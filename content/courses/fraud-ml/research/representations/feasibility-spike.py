"""Feasibility spike: CoLES on a small MBD-mini cut, CPU only, against aggregates."""
import argparse, glob, json, os, time
import numpy as np, pandas as pd, pyarrow.parquet as pq, torch, lightgbm as lgb
from torch import nn
from sklearn.metrics import roc_auc_score
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from scipy.stats import rankdata

ap = argparse.ArgumentParser()
ap.add_argument("--root"); ap.add_argument("--clients", type=int, default=6000)
ap.add_argument("--neg-per-pos", type=float, default=3.0); ap.add_argument("--minutes", type=float, default=8)
ap.add_argument("--threads", type=int, default=4); ap.add_argument("--seed", type=int, default=0)
ap.add_argument("--hid", type=int, default=128); ap.add_argument("--maxlen", type=int, default=64); ap.add_argument("--bs", type=int, default=64); ap.add_argument("--shuffle-order", action="store_true"); ap.add_argument("--out")
a = ap.parse_args()
torch.set_num_threads(a.threads); torch.manual_seed(a.seed); rng = np.random.default_rng(a.seed)
T = [f"target_{i}" for i in range(1, 5)]
CATS = {"event_type": 56, "event_subtype": 62, "currency": 15, "src_type11": 101, "dst_type11": 123, "dst_type12": 649}
day = 86400
HID = a.hid


def stamp(s):
    return int(pd.Timestamp(s).timestamp())


# Point-in-time rule: a row labelled for month `mon` sees only events before that month starts.
tg = pd.concat(pd.read_parquet(f).assign(fold=int(f.split("fold=")[1].split("/")[0]))
               for f in glob.glob(f"{a.root}/targets/fold=*/*.parquet"))
tg["mon"] = pd.to_datetime(tg["mon"]); tg["cut"] = (tg["mon"].dt.to_period("M").dt.start_time - pd.Timestamp("1970-01-01")) // pd.Timedelta("1s")
print("months", tg.mon.min(), tg.mon.max(), "rows", len(tg), "clients", tg.client_id.nunique())
print("per-row positive rate", tg[T].mean().round(5).to_dict())
pos = tg[tg[T].sum(axis=1) > 0].client_id.unique(); allc = tg.client_id.unique()
print("clients with any positive", len(pos), "of", len(allc))
neg = np.setdiff1d(allc, pos)
n_pos = min(len(pos), int(a.clients / (1 + a.neg_per_pos)))
keep = np.r_[rng.choice(pos, n_pos, replace=False), rng.choice(neg, min(len(neg), a.clients - n_pos), replace=False)]
keep_set = set(keep)
tg = tg[tg.client_id.isin(keep_set)]

t0 = time.time(); cols = ["client_id", "event_time", "amount"] + list(CATS); seqs = {}
for f in glob.glob(f"{a.root}/ptls/trx/fold=*/*.parquet"):
    for r in pq.read_table(f, columns=cols).to_pylist():
        if r["client_id"] in keep_set:
            o = np.argsort(r["event_time"], kind="stable")
            seqs[r["client_id"]] = {k: np.asarray(r[k])[o] for k in cols[1:]}
print("loaded", len(seqs), "clients", round(time.time() - t0), "s; events", sum(len(s["amount"]) for s in seqs.values()))
ids = sorted(seqs); tg = tg[tg.client_id.isin(seqs)]
lens = np.array([len(seqs[i]["amount"]) for i in ids]); print("events per client pct", np.percentile(lens, [10, 50, 90, 99]).tolist())
# Size of what a lab's data/ would hold for this cut, in the columns used.
sz = pd.DataFrame([{"c": i, **{k: seqs[i][k].astype("float32" if k == "amount" else "int32").tolist() for k in cols[1:]}} for i in ids])
sz.to_parquet(a.out + ".parquet", compression="zstd"); print("cut size MB", round(os.path.getsize(a.out + ".parquet") / 1e6, 1), flush=True); del sz

# How the published noise leaves order: fraction of same-day neighbours, and ties.
gaps = np.concatenate([np.diff(seqs[i]["event_time"]) for i in ids[:2000] if lens[ids.index(i)] > 1])
print("gap==0 share", float((gaps == 0).mean()), "gap<1h", float((gaps < 3600).mean()), "gap<1d", float((gaps < day).mean()))

PRETRAIN_END = stamp("2022-08-01")  # encoder never sees later events, so it is deployable at the test months
TRAIN_MONTHS_END = pd.Timestamp("2022-09-30"); test_fold = 0
amt_mu = np.mean([np.log1p(np.abs(s["amount"])).mean() for s in seqs.values()])
amt_sd = np.std(np.concatenate([np.log1p(np.abs(seqs[i]["amount"])) for i in ids[:500]]))


def tensors(s, idx=None):
    idx = np.arange(len(s["amount"])) if idx is None else idx
    t = s["event_time"][idx]; gap = np.diff(t, prepend=t[0] if len(t) else 0).clip(0)
    num = np.c_[(np.log1p(np.abs(s["amount"][idx])) - amt_mu) / amt_sd, np.log1p(gap / 3600) / 4]
    return torch.tensor(num, dtype=torch.float32), {k: torch.tensor(np.minimum(s[k][idx], v - 1).clip(0), dtype=torch.long) for k, v in CATS.items()}


class Enc(nn.Module):
    def __init__(s, h=HID):
        super().__init__()
        s.emb = nn.ModuleDict({k: nn.Embedding(v, min(32, 4 + int(v ** 0.5))) for k, v in CATS.items()})
        d = sum(e.embedding_dim for e in s.emb.values()) + 2
        s.gru = nn.GRU(d, h, batch_first=True)

    def forward(s, batch):
        x = [torch.cat([n] + [s.emb[k](c[k]) for k in CATS], 1) for n, c in batch]
        L = torch.tensor([len(i) for i in x])
        p = nn.utils.rnn.pack_sequence(x, enforce_sorted=False)
        o, h = s.gru(p)
        return nn.functional.normalize(h[-1], dim=1), o


def coles_loss(z, y, margin=0.5, hard=5):
    d = torch.cdist(z, z); same = y[:, None] == y[None, :]; eye = torch.eye(len(y), dtype=torch.bool)
    p = 0.5 * d[same & ~eye].pow(2).mean()
    dn = d.masked_fill(same, 9e9); near = dn.topk(hard, largest=False, dim=1).values
    return p + 0.5 * (margin - near).clamp(min=0).pow(2).mean()


# Pretrain only on non-test clients, on events before PRETRAIN_END: no peek at test clients or later months.
fold_of = tg.drop_duplicates("client_id").set_index("client_id").fold
pre = [i for i in ids if fold_of.get(i, 1) != test_fold]
pidx = {}
for i in pre:
    n = int(np.searchsorted(seqs[i]["event_time"], PRETRAIN_END))
    if n >= 15:
        v = np.arange(n)
        pidx[i] = rng.permutation(v) if a.shuffle_order else v
pre = list(pidx); print("pretrain clients", len(pre), "events", sum(len(v) for v in pidx.values()))
enc = Enc(); opt = torch.optim.Adam(enc.parameters(), 2e-3)
t0 = time.time(); step = 0; hist = []
while time.time() - t0 < a.minutes * 60:
    who = rng.choice(len(pre), a.bs, replace=False); batch = []; y = []
    for j, w in enumerate(who):
        v = pidx[pre[w]]
        for _ in range(4):
            L = int(rng.integers(15, min(a.maxlen, len(v)) + 1)); st = int(rng.integers(0, len(v) - L + 1))
            batch.append(tensors(seqs[pre[w]], v[st:st + L])); y.append(j)
    z, _ = enc(batch); loss = coles_loss(z, torch.tensor(y)); opt.zero_grad(); loss.backward(); opt.step(); step += 1
    hist.append(loss.item())
    if step % 100 == 0:
        print("step", step, "loss", round(float(np.mean(hist[-100:])), 4), "t", round(time.time() - t0), flush=True)
print("pretrain steps", step, "minutes", a.minutes)

# Embed every client at every cut with one GRU pass, reading the state just before each cut.
cuts_by = tg.groupby("client_id").cut.apply(lambda c: sorted(set(c))).to_dict()
enc.eval(); E = {}; t0 = time.time()
with torch.no_grad():
    if a.shuffle_order:
        # Each cut needs its own pass, because the permuted prefix differs per cut.
        items = [(i, c) for i in ids for c in cuts_by.get(i, [])]
        for b in range(0, len(items), 256):
            chunk = items[b:b + 256]; bt = []; live = []
            for i, c in chunk:
                n = int(np.searchsorted(seqs[i]["event_time"], c))
                if n: bt.append(tensors(seqs[i], rng.permutation(n))); live.append((i, c))
                else: E[(i, c)] = np.zeros(HID)
            if bt:
                z, _ = enc(bt)
                for k, v in zip(live, z.numpy()): E[k] = v
    else:
        for b in range(0, len(ids), 256):
            chunk = [i for i in ids[b:b + 256] if len(seqs[i]["amount"])]
            _, o = enc([tensors(seqs[i]) for i in chunk]); o, _ = nn.utils.rnn.pad_packed_sequence(o, batch_first=True)
            o = nn.functional.normalize(o, dim=2).numpy()
            for r, i in enumerate(chunk):
                for c in cuts_by.get(i, []):
                    n = int(np.searchsorted(seqs[i]["event_time"], c))
                    E[(i, c)] = o[r, n - 1] if n else np.zeros(o.shape[2])
print("embedded", len(E), "rows in", round(time.time() - t0), "s")

# Aggregates: additive per-event columns, prefix sums, three windows.
top = pd.Series(np.concatenate([seqs[i]["event_type"] for i in ids[:2000]])).value_counts().index[:20].to_numpy()
tops = pd.Series(np.concatenate([seqs[i]["src_type11"] for i in ids[:2000]])).value_counts().index[:10].to_numpy()
A = {}; WIN = [30 * day, 90 * day, 10 ** 9]
for i in ids:
    s = seqs[i]; la = np.log1p(np.abs(s["amount"]))
    V = np.c_[np.ones(len(la)), la, la ** 2, (s["event_type"][:, None] == top).astype(float), (s["event_type"][:, None] == top) * la[:, None], (s["src_type11"][:, None] == tops).astype(float)]
    cum = np.vstack([np.zeros(V.shape[1]), np.cumsum(V, 0)]); t = s["event_time"]
    for c in cuts_by.get(i, []):
        hi = int(np.searchsorted(t, c)); row = []
        for w in WIN:
            lo = int(np.searchsorted(t, c - w)); d = cum[hi] - cum[lo]; n = max(d[0], 1)
            row += [d[0], d[1] / n, max(d[2] / n - (d[1] / n) ** 2, 0), len(set(s["dst_type12"][lo:hi])) if hi > lo else 0]; row += list(d[3:])
        row.append((c - t[hi - 1]) / day if hi else 9999); A[(i, c)] = np.array(row, dtype=np.float32)
print("aggregate columns", len(next(iter(A.values()))))

df = tg[["client_id", "cut", "mon", "fold"] + T].copy(); keys = list(zip(df.client_id, df.cut))
XA = np.stack([A[k] for k in keys]); XE = np.stack([E.get(k, np.zeros(HID)) for k in keys]).astype(np.float32)
tr = ((df.fold != test_fold) & (df.mon <= TRAIN_MONTHS_END)).to_numpy(); te = ((df.fold == test_fold) & (df.mon > TRAIN_MONTHS_END)).to_numpy()
print("train rows", tr.sum(), "test rows", te.sum(), "test positives", df.loc[te, T].sum().to_dict(), "train positives", df.loc[tr, T].sum().to_dict())


def gbm(X, y, Xt):
    m = lgb.LGBMClassifier(n_estimators=300, learning_rate=0.03, num_leaves=31, subsample=0.8, subsample_freq=1, colsample_bytree=0.5, min_child_samples=20, verbose=-1, n_jobs=a.threads, random_state=a.seed)
    return m.fit(X, y).predict_proba(Xt)[:, 1]


def lr(X, y, Xt):
    sc = StandardScaler().fit(X); return LogisticRegression(C=0.1, max_iter=500).fit(sc.transform(X), y).predict_proba(sc.transform(Xt))[:, 1]


def run(mask, tag):
    out = {}
    y = df[T].to_numpy(); groups = df.client_id.to_numpy()[te]
    P = {}
    for j, t in enumerate(T):
        yt = y[mask, j]; ye = y[te, j]
        if yt.sum() < 5 or ye.sum() < 5: continue
        pa = gbm(XA[mask], yt, XA[te]); pe = lr(XE[mask], yt, XE[te]); pc = gbm(np.c_[XA[mask], XE[mask]], yt, np.c_[XA[te], XE[te]])
        pr = rankdata(pa) + rankdata(pe)
        P[t] = dict(agg=pa, emb=pe, concat=pc, rank_avg=pr, y=ye)
    res = {m: float(np.mean([roc_auc_score(v["y"], v[m]) for v in P.values()])) for m in ["agg", "emb", "concat", "rank_avg"]}
    per = {t: {m: round(float(roc_auc_score(v["y"], v[m])), 4) for m in ["agg", "emb", "concat", "rank_avg"]} for t, v in P.items()}
    # Client-level bootstrap of the paired difference, so a small cut cannot flatter itself.
    u = np.unique(groups); pos = {c: np.flatnonzero(groups == c) for c in u}; bs = {"emb-agg": [], "rank_avg-agg": []}
    for _ in range(200):
        pick = np.concatenate([pos[c] for c in rng.choice(u, len(u))]); da = []; dr = []
        for v in P.values():
            yy = v["y"][pick]
            if yy.sum() == 0: continue
            ba = roc_auc_score(yy, v["agg"][pick]); da.append(roc_auc_score(yy, v["emb"][pick]) - ba); dr.append(roc_auc_score(yy, v["rank_avg"][pick]) - ba)
        bs["emb-agg"].append(np.mean(da)); bs["rank_avg-agg"].append(np.mean(dr))
    ci = {k: [round(float(q), 4) for q in np.percentile(v, [2.5, 97.5])] for k, v in bs.items()}
    print(tag, {k: round(v, 4) for k, v in res.items()}, "CI", ci, "targets", list(P), flush=True)
    return dict(tag=tag, mean=res, per=per, ci=ci)


results = [run(tr, "all-labels")]
cl = df.client_id.to_numpy(); ptr = np.unique(cl[tr])
for frac in (0.1, 0.03):
    sel = set(rng.choice(ptr, int(len(ptr) * frac), replace=False))
    results.append(run(tr & np.isin(cl, list(sel)), f"labels-{frac}"))
json.dump(dict(args=vars(a), steps=step, results=results), open(a.out, "w"), indent=1)
