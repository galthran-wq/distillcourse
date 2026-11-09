# %% [markdown]
# # Lab: a contrastive transaction encoder judged against your own aggregates
#
# The lab builds the encoder the module described, on real anonymised bank
# histories with product-purchase targets and no fraud label: slices and a
# margin loss trained on CPU in minutes, an embedding read for every client
# at every month's cut without a later event, aggregates by prefix sums as
# the opponent, and a bootstrap that says whether the two differ — at all
# the labels and at a tenth of them.
#
# What exists at the end: a small sequence-representation toolkit of your own
# — `sample_slices`, `coles_loss`, `hard_negatives` with `coles_loss_hard`,
# the `SliceEncoder` forward pass, `embed_at_cuts`, `window_aggregates`,
# `paired_client_bootstrap`, `pretraining_set` and `pretrain` — an encoder it
# trained on about 5,700 clients' histories, and three confidence intervals that
# say whether that encoder's vector adds anything to windowed aggregates you
# also wrote, with all the labels, a tenth of them and 3% of them.
#
# Ground rules:
#
# - The graded functions use numpy and torch. Inside them, no sequence
#   library (pytorch-lifestream would make every checkpoint a call to it);
#   checking your result against one is fine.
# - The loader, the featurizer, the encoder's layers, the model wrappers, the
#   plots and the loops that apply your functions to 11,837 clients ship
#   complete. They are infrastructure: read them, do not edit them.
# - The nine exact checkpoints are the required set. The written answer and
#   the open task are optional; partial completion is a normal way to finish.
# - Each checkpoint is checked on a small hand-made fixture, so a function that
#   passes is right for every input of that shape, not only for this data.

# %%
import copy
import os
import time

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import torch
import torch.nn.functional as F
from lightgbm import LGBMClassifier
from scipy.stats import rankdata
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from torch import nn

import distill

distill.open_lab("fraud-ml/transaction-embedding-lab")

# Fixed threads and seeds: the reference run must give the same numbers twice.
THREADS = min(4, os.cpu_count() or 1)
torch.set_num_threads(THREADS)
torch.manual_seed(0)

DAY = 86400
FIELDS = ["event_type", "src_type11", "dst_type11", "dst_type12"]
TARGETS = ["target_1", "target_2", "target_3", "target_4"]
PRETRAIN_END = int(pd.Timestamp("2022-08-01").timestamp())
TRAIN_FOLDS, EVAL_FOLD, GRADED_FOLD = (2, 3, 4), 1, 0

# %% [markdown]
# ## 1. The data: a bank's event histories with product targets
#
# The Multimodal Banking Dataset (MBD) is a release of a bank's own client
# histories, anonymised; its 100,224-client cut, MBD-mini, is public under
# CC BY 4.0. Each client has card transactions with a timestamp, an amount and
# categorical codes (event type, source and destination types), and four
# targets per month: whether the client bought each of four products in that
# month. **There is no fraud label.** The lab shows the representation
# technique on real behaviour; whether it catches fraud is not something this
# data can say.
#
# Three facts about the data shape the lab:
#
# - **Dates are jittered, the hour kept.** The release adds noise to every
#   date and keeps the time of day, so the order of events within a day is
#   unreliable. The amounts carry noise too.
# - **A row labelled for month `mon` may see only events before that month
#   starts.** Its cut is midnight UTC on the first of the month; an event at or
#   after the cut belongs to the month being predicted.
# - **The positives are enriched.** Of all clients, 81% buy nothing in any
#   month. This cut draws 12,000 clients so that half bought at least one
#   product at some point; 11,837 of them have card events in the window
#   kept. Scores here are therefore not comparable with the published
#   results on the full set (mean ROC-AUC 0.78–0.82).
#
# The file in `data/` is that cut, trimmed so the mirror can carry it: card
# events from 1 July 2021 to the end of 2022, six columns, times floored to the
# minute, amounts rounded to two significant figures (21 MB). The clients
# fall into MBD's own five folds:
#
# | folds | role | label months |
# |---|---|---|
# | 2, 3, 4 | training: the encoder is pretrained on their events before 1 August 2022, the downstream models on their labels | 2022-02 to 2022-09 |
# | 1 | evaluation: your intervals are read here | 2022-10 to 2023-01 |
# | 0 | graded: labels kept by the server | 2022-10 to 2023-01 |
#
# The encoder never sees a client of folds 0 or 1, nor any event from August
# 2022 on. Months 2022-10 and later are predicted with an encoder frozen
# before them and with models fitted on earlier months of other clients.
#
# One client's history is a dict of arrays, one entry per event, sorted by
# time. Everything that is one value per client (the fold, a label) lives in
# a table of its own, never in that dict: code that slices a history slices
# every array in it, and a per-client array stored beside the events would be
# cut along with them. (The sequence libraries mark such arrays by a name
# prefix for exactly this reason.)

# %%
# Infrastructure (do not modify): the loaders.
def load_events(path="data/events.parquet"):
    """List of client histories; history c is a dict of arrays sorted by time.

    Keys: "t" (int64 seconds, UTC), "amount" (float64), and one int64 array
    per name in FIELDS.
    """
    ev = pd.read_parquet(path)
    client = ev["client"].to_numpy()
    bounds = np.searchsorted(client, np.arange(client.max() + 2))
    cols = {"t": ev["minute"].to_numpy(np.int64) * 60, "amount": ev["amount"].to_numpy(np.float64),
            **{f: ev[f].to_numpy(np.int64) for f in FIELDS}}
    return [{k: v[a:b] for k, v in cols.items()} for a, b in zip(bounds[:-1], bounds[1:])]


def load_rows():
    """One row per (client, month) to predict, with its cut, fold, part and targets (NaN when graded)."""
    folds = pd.read_csv("data/clients.csv").set_index("client")["fold"]
    rows = pd.concat([pd.read_csv("data/targets.csv.gz"), pd.read_csv("data/holdout.csv")], ignore_index=True)
    rows["cut"] = (pd.to_datetime(rows["month"]) - pd.Timestamp("1970-01-01")) // pd.Timedelta("1s")
    rows["fold"] = folds.loc[rows["client"]].to_numpy()
    rows["part"] = np.select([rows["fold"].isin(TRAIN_FOLDS), rows["fold"] == EVAL_FOLD], ["train", "eval"], "graded")
    return rows, folds.to_numpy()


seqs = load_events()
rows, fold_of = load_rows()
VOCAB = {f: int(max(s[f].max() for s in seqs)) + 1 for f in FIELDS}
lengths = np.array([len(s["t"]) for s in seqs])
print(f"{len(seqs):,} clients, {lengths.sum():,} events; events per client, 10/50/90/99th percentile:",
      np.percentile(lengths, [10, 50, 90, 99]).astype(int))
print("vocabulary sizes:", VOCAB)
summary = rows.groupby("part").agg(rows=("client", "size"), clients=("client", "nunique"),
                                   **{t: (t, "sum") for t in TARGETS}).astype(int)
summary.loc["graded", TARGETS] = -1
print(summary.loc[["train", "eval", "graded"]].to_string(), "\n(-1: the graded labels are the server's)")

# %% [markdown]
# The positive counts are small: a few hundred per target in training, about
# a hundred per target on the evaluation fold, and product 2 is the rarest by
# far. Hold that against every difference of ROC-AUC later on.

# %% [markdown]
# ## 2. Slices: two views of one history
#
# The pretraining task needs pairs that should be close without any label.
# The assumption the module made is that two windows of one client's life
# look more alike than windows of two different clients. A *slice* is a
# contiguous run of events: a start and a length.
#
# Write `sample_slices`. For each of the $k$ slices, draw the length uniformly
# among all lengths from `min_len` to the largest one that fits, which is
# `max_len` or the history's own length if that is shorter; then draw the
# start uniformly among all starts that keep the slice inside the history.
# Use exactly two calls per slice, in this order: `rng.integers` for the
# length, then `rng.integers` for the start (upper bounds are exclusive in
# numpy). The checker replays your draws from the same seed.
#
# A history shorter than `max_len` must not make the sampler return lengths
# it cannot hold, and must not pile its draws on one length either.

# %%
def sample_slices(n_events, k, min_len, max_len, rng):
    """k random contiguous slices of a history of n_events events.

    Args:
        n_events: int, length of the history, n_events >= min_len.
        k: number of slices.
        min_len, max_len: inclusive bounds on a slice's length.
        rng: numpy Generator; two draws per slice, length then start.
    Returns:
        (k, 2) int array; row i is (start, length) of slice i, and
        0 <= start, start + length <= n_events.
    """
    # BEGIN SOLUTION
    out = np.empty((k, 2), dtype=np.int64)
    top = min(max_len, n_events)
    for i in range(k):
        length = int(rng.integers(min_len, top + 1))
        start = int(rng.integers(0, n_events - length + 1))
        out[i] = start, length
    return out
    # END SOLUTION


# %%
# Local checks: bounds hold, and lengths spread over the whole allowed range.
_s = sample_slices(40, 2000, 15, 64, np.random.default_rng(0))
assert _s.shape == (2000, 2) and (_s[:, 0] >= 0).all() and (_s.sum(1) <= 40).all()
assert _s[:, 1].min() == 15 and _s[:, 1].max() == 40
assert np.bincount(_s[:, 1])[40] < 3 * np.bincount(_s[:, 1])[30], "draws pile up on the longest length"
_s = sample_slices(500, 2000, 15, 64, np.random.default_rng(0))
assert _s[:, 1].max() == 64 and (_s.sum(1) <= 500).all()


def slices_for_lengths(ns, k, min_len, max_len, seed):
    """The checker's harness: one generator, k slices for each history length in ns."""
    rng = np.random.default_rng(seed)
    return np.concatenate([sample_slices(n, k, min_len, max_len, rng) for n in ns])


# %%
distill.check("slice-sampler", slices_for_lengths)

# %% [markdown]
# ## 3. The margin loss on a batch
#
# A batch holds slices of several clients; `client_ids[u]` says whose slice
# row $u$ is. The encoder returns one vector per slice, and the vectors are
# set to unit length, so the distance between two of them follows from
# their dot product:
#
# $$d_{uv}^2 = \|c_u - c_v\|^2 = 2 - 2\, c_u \cdot c_v .$$
#
# A pair is positive ($Y_{uv} = 1$) when the two slices are the same
# client's and $u \ne v$; negative ($Y_{uv} = 0$) when they are different
# clients'. In words: positive pairs are pulled together whatever their
# distance, negative pairs are pushed apart only while they are closer than
# the margin $\rho$. Each pair costs
#
# $$\mathcal{L}_{uv} = \tfrac{1}{2}\, Y_{uv}\, d_{uv}^2 + \tfrac{1}{2}\,(1 - Y_{uv}) \max(0,\ \rho - d_{uv})^2 ,$$
#
# and the batch loss is the mean of $\mathcal{L}_{uv}$ over the pairs used:
# here, every ordered pair $(u, v)$ with $u \ne v$. A row is never paired
# with itself.
#
# Write `coles_loss`. Do not trust the caller to pass unit rows: normalise
# them first, then take every distance from one matrix product. The square
# root has no gradient at zero, so clamp the squared distance at `1e-12`
# before taking it.
#
# By hand, on the module's four slices: two clients, unit vectors at angles
# a1 = 0°, a2 = 40° (client A) and b1 = 60°, b2 = 150° (client B), margin
# 0.5. Two unit vectors $\theta$ apart are $d = 2\sin(\theta/2)$ apart.
#
# | pair | kind | $d$ | term |
# |---|---|---|---|
# | a1–a2 | positive | 0.6840 | 0.2340 |
# | b1–b2 | positive | 1.4142 | 1.0000 |
# | a1–b1 | negative | 1.0000 | 0 |
# | a1–b2 | negative | 1.9319 | 0 |
# | a2–b1 | negative | 0.3473 | $\tfrac{1}{2}(0.5 - 0.3473)^2 = 0.0117$ |
# | a2–b2 | negative | 1.6383 | 0 |
#
# Each unordered pair appears twice among the ordered ones, so the mean over
# the twelve ordered pairs is the mean over these six: $1.2456 / 6 = 0.2076$.

# %%
def coles_loss(z, client_ids, margin):
    """Contrastive margin loss of a batch, over all ordered pairs u != v.

    Args:
        z: (n, d) float tensor, one row per slice, any length.
        client_ids: (n,) int tensor, the client of each row.
        margin: float, rho.
    Returns:
        scalar tensor, differentiable in z.
    """
    # BEGIN SOLUTION
    z = F.normalize(z, dim=1)
    d2 = (2 - 2 * z @ z.T).clamp(min=1e-12)
    d = d2.sqrt()
    same = client_ids[:, None] == client_ids[None, :]
    off = ~torch.eye(len(z), dtype=torch.bool)
    pos = 0.5 * d2[same & off]
    neg = 0.5 * (margin - d[~same]).clamp(min=0) ** 2
    return torch.cat([pos, neg]).mean()
    # END SOLUTION


# %%
_ang = np.deg2rad([0.0, 40.0, 60.0, 150.0])
FOUR = torch.tensor(np.c_[np.cos(_ang), np.sin(_ang)])
FOUR_IDS = torch.tensor([0, 0, 1, 1])
print(f"four slices: {coles_loss(FOUR, FOUR_IDS, 0.5).item():.4f} (by hand 0.2076)")
assert abs(coles_loss(FOUR, FOUR_IDS, 0.5).item() - 0.20760) < 1e-4
assert abs(coles_loss(3 * FOUR, FOUR_IDS, 0.5).item() - 0.20760) < 1e-4, "rows must be normalised first"


def loss_fixture(z, client_ids, margin):
    """The checker's harness: numpy in, the loss as a float out (in float64)."""
    return coles_loss(torch.tensor(z), torch.tensor(client_ids), margin).item()


# %%
distill.check("coles-loss", loss_fixture)

# %% [markdown]
# ## 4. Hard negatives
#
# A batch of 64 clients with four slices each has 252 negatives per slice
# and only three positives. Once training is under way most negatives are
# beyond the margin and contribute exactly zero; averaged in, those zeros
# dilute the few that still carry a gradient. The slices that carry it are
# the nearest ones, and the distance matrix already holds them: for each row,
# among the slices of *other* clients, take the `n_hard` with the smallest
# distance.
#
# Write `hard_negatives`, which reads them off a distance matrix, and
# `coles_loss_hard`, the batch loss over the pairs it now uses: every ordered
# positive pair as before, and, for each row $u$, the pairs $(u, v)$ with
# $v$ one of $u$'s hard negatives. One mean over all of them. Choose the
# indices without gradient (`torch.no_grad()` or a detached matrix), then
# take the loss from the differentiable distances at those indices.
#
# With `n_hard` equal to every other-client slice the hard loss must equal
# `coles_loss`: the check below uses that. On the four slices with one hard
# negative each, the nearest other-client slice of a1 is b1, of a2 is b1, of
# b1 is a2 and of b2 is a2; only a2–b1 is inside the margin, and the mean
# over four positive and four hard pairs is
# $(2 \cdot 0.2340 + 2 \cdot 1.0000 + 2 \cdot 0.0117)/8 = 0.3114$.

# %%
def hard_negatives(dist, client_ids, n_hard):
    """Indices of each row's nearest slices of other clients.

    Args:
        dist: (n, n) tensor of pairwise distances.
        client_ids: (n,) int tensor.
        n_hard: how many per row; at most the number of other-client rows.
    Returns:
        (n, n_hard) long tensor; row u lists u's n_hard nearest other-client
        rows, nearest first.
    """
    # BEGIN SOLUTION
    same = client_ids[:, None] == client_ids[None, :]
    return dist.masked_fill(same, float("inf")).topk(n_hard, dim=1, largest=False).indices
    # END SOLUTION


def coles_loss_hard(z, client_ids, margin, n_hard):
    """Margin loss over ordered positive pairs and each row's n_hard hard negatives.

    Args:
        z: (n, d) float tensor, any row length.
        client_ids: (n,) int tensor.
        margin: float, rho.
        n_hard: hard negatives per row.
    Returns:
        scalar tensor, differentiable in z.
    """
    # BEGIN SOLUTION
    z = F.normalize(z, dim=1)
    d2 = (2 - 2 * z @ z.T).clamp(min=1e-12)
    d = d2.sqrt()
    same = client_ids[:, None] == client_ids[None, :]
    off = ~torch.eye(len(z), dtype=torch.bool)
    with torch.no_grad():
        idx = hard_negatives(d, client_ids, n_hard)
    pos = 0.5 * d2[same & off]
    neg = 0.5 * (margin - d.gather(1, idx)).clamp(min=0) ** 2
    return torch.cat([pos, neg.reshape(-1)]).mean()
    # END SOLUTION


# %%
print(f"four slices, one hard negative each: {coles_loss_hard(FOUR, FOUR_IDS, 0.5, 1).item():.4f} (by hand 0.3114)")
assert abs(coles_loss_hard(FOUR, FOUR_IDS, 0.5, 1).item() - 0.31140) < 1e-4
_z, _ids = torch.randn(12, 5, dtype=torch.float64), torch.arange(12) // 3
assert abs(coles_loss_hard(_z, _ids, 1.2, 9).item() - coles_loss(_z, _ids, 1.2).item()) < 1e-9, \
    "with every other-client slice selected, the hard loss is the full loss"


def hard_fixture(z, client_ids, margin, n_hard):
    """The checker's harness: the indices (from unit rows) and the hard loss."""
    zt, ids = torch.tensor(z), torch.tensor(client_ids)
    u = F.normalize(zt, dim=1)
    idx = hard_negatives(torch.cdist(u, u), ids, n_hard)
    return idx.numpy().astype(float), coles_loss_hard(zt, ids, margin, n_hard).item()


# %%
distill.check("hard-negatives", hard_fixture)

# %% [markdown]
# ## 5. The encoder
#
# The encoder reads one slice event by event. Each event becomes a vector:
# a learned embedding of each of its four categorical codes, plus two
# numbers, the log amount standardised and the log of the gap since the
# previous event in hours. A GRU, a recurrent unit with reset and update
# gates, reads these vectors in order and keeps a state of 128 numbers; the
# slice's embedding is the state after its last event, set to unit length.
#
# `featurize` (shipped) turns a history and a set of event indices into the
# inputs; `SliceEncoder.__init__` (shipped) builds the layers. You write
# `forward`. Slices in a batch have different lengths. Pad them to one
# length and the GRU runs on through the padding: a short slice's final
# state is then its state after the zeros, not after its last event. Packing
# (`nn.utils.rnn.pack_sequence`) runs each sequence for exactly its own
# length; with `enforce_sorted=False` the batch can come in any order and
# the final states come back in that same order.
#
# With `states=True`, `forward` also returns the state after every event,
# padded with zeros past each sequence's end (`pad_packed_sequence`), each
# state set to unit length. The next section reads those.

# %%
# Infrastructure (do not modify): the inputs and the layers.
def featurize(seq, idx, scale):
    """Encoder inputs for the events idx of one history.

    Returns (num, cats): num a (L, 2) float tensor (standardised log amount,
    log1p of the gap in hours / 4, the first event's gap 0); cats a dict of
    (L,) long tensors, one per field. The float dtype follows torch's default.
    """
    t = seq["t"][idx]
    gap = np.diff(t, prepend=t[:1])
    num = np.stack([(np.log1p(seq["amount"][idx]) - scale[0]) / scale[1], np.log1p(gap / 3600) / 4], axis=1)
    return (torch.tensor(num, dtype=torch.get_default_dtype()),
            {f: torch.as_tensor(np.asarray(seq[f])[idx], dtype=torch.long) for f in FIELDS})


def embedding_dim(n):
    return min(32, 4 + int(n ** 0.5))


class SliceEncoder(nn.Module):
    def __init__(self, vocab, hidden=128):
        super().__init__()
        self.emb = nn.ModuleDict({f: nn.Embedding(n, embedding_dim(n)) for f, n in vocab.items()})
        self.gru = nn.GRU(2 + sum(e.embedding_dim for e in self.emb.values()), hidden, batch_first=True)

    def forward(self, batch, states=False):
        """Encode a batch of event sequences.

        Args:
            batch: list of B pairs (num, cats) as featurize returns them, each
                of length L_b >= 1, in any order of lengths.
            states: also return every step's state.
        Returns:
            z: (B, hidden), row b the GRU state after sequence b's own last
               event, unit length.
            if states: (z, S) with S (B, max L_b, hidden), S[b, i] the state
               after event i of sequence b, unit length, zero for i >= L_b.
        """
        # BEGIN SOLUTION
        x = [torch.cat([num] + [self.emb[f](cats[f]) for f in self.emb], dim=1) for num, cats in batch]
        out, h = self.gru(nn.utils.rnn.pack_sequence(x, enforce_sorted=False))
        z = F.normalize(h[-1], dim=1)
        if not states:
            return z
        S, _ = nn.utils.rnn.pad_packed_sequence(out, batch_first=True)
        return z, F.normalize(S, dim=2)
        # END SOLUTION


# %%
# Local checks: unit rows; a sequence's vector does not depend on what else is in the batch.
_enc = SliceEncoder(VOCAB, 16)
_b = [featurize(seqs[c], np.arange(n), (9.0, 2.0)) for c, n in zip(np.flatnonzero(lengths >= 40), (5, 40, 17))]
with torch.no_grad():
    _z = _enc(_b)
    _alone = torch.cat([_enc([x]) for x in _b])
    _zz, _S = _enc(_b, states=True)
assert torch.allclose(_z.norm(dim=1), torch.ones(3), atol=1e-5)
assert torch.allclose(_z, _alone, atol=1e-5), "padding leaks into the final state, or the rows come back reordered"
assert _S.shape == (3, 40, 16) and torch.allclose(_S[0, 4], _z[0], atol=1e-5) and _S[0, 5:].abs().max() == 0


def encode_fixture(seed, vocab, hidden, batch):
    """The checker's harness: a seeded float64 encoder on a fixed batch."""
    torch.set_default_dtype(torch.float64)
    try:
        torch.manual_seed(seed)
        enc = SliceEncoder(vocab, hidden)
        tb = [(torch.tensor(num), {f: torch.as_tensor(c) for f, c in cats.items()}) for num, cats in batch]
        with torch.no_grad():
            return enc(tb).numpy()
    finally:
        torch.set_default_dtype(torch.float32)


# %%
distill.check("slice-encoder", encode_fixture)

# %% [markdown]
# ## 6. An embedding at every cut, from one pass
#
# Downstream, a row is a client and a month, and its features may use only
# events before that month starts. The encoder must therefore be read at
# every cut: the state after the last event strictly before it. Re-encoding
# the history up to each cut is correct and costs one GRU pass per cut,
# twelve per client here. One pass is enough. The GRU state after event $i$
# depends only on events $0..i$ (the gap feature of event $i$ reads event
# $i-1$, never $i+1$), so the states of a single pass over the whole history
# hold the answer for every cut: with $n$ the number of events before the
# cut, the row is the state after event $n - 1$, and a cut with nothing
# before it gets the zero vector.
#
# Write `embed_at_cuts` for a batch of clients: one `encoder(..., states=True)`
# call on their full histories, then for each client the states at its cuts.
# Mind the event stamped exactly at a cut: it belongs to the month being
# predicted. Reading the state after it, or after the first event of the
# cut's month, is the point-in-time leak the module warned about, and it
# raises the downstream score.

# %%
def embed_at_cuts(encoder, seqs, cuts, scale):
    """Embeddings of a batch of clients at their cuts, from one encoder pass.

    Args:
        encoder: a SliceEncoder.
        seqs: list of B histories (dicts of arrays as load_events gives),
            each with at least one event.
        cuts: list of B int arrays of cut timestamps (seconds), one per history.
        scale: (mean, sd) of log1p(amount), passed to featurize.
    Returns:
        (sum_b len(cuts[b]), hidden) float array: client 0's cuts in order,
        then client 1's, and so on. A row is the state after the last event
        strictly before its cut, or zeros when no event precedes the cut.
    """
    # BEGIN SOLUTION
    with torch.no_grad():
        _, S = encoder([featurize(s, np.arange(len(s["t"])), scale) for s in seqs], states=True)
    out = []
    for b, (s, c) in enumerate(zip(seqs, cuts)):
        n = np.searchsorted(s["t"], np.asarray(c), side="left")
        rows = S[b].numpy()[np.maximum(n - 1, 0)]
        rows[n == 0] = 0.0
        out.append(rows)
    return np.concatenate(out)
    # END SOLUTION


# %%
# Local check: the single pass agrees with re-encoding each prefix, the slow way.
_c = np.flatnonzero(lengths >= 30)[:2]
_cuts = [seqs[c]["t"][[0, 9, 29]] for c in _c]          # one cut exactly at the first event
_E = embed_at_cuts(_enc, [seqs[c] for c in _c], _cuts, (9.0, 2.0))
with torch.no_grad():
    for r, (c, n) in enumerate([(c, n) for c in _c for n in (0, 9, 29)]):
        slow = np.zeros(16) if n == 0 else _enc([featurize(seqs[c], np.arange(n), (9.0, 2.0))])[0].numpy()
        assert np.allclose(_E[r], slow, atol=1e-5), f"row {r}: the state read is not the one before the cut"


def embed_fixture(seed, vocab, hidden, seqs, cuts, scale):
    """The checker's harness: a seeded float64 encoder read at the fixture's cuts."""
    torch.set_default_dtype(torch.float64)
    try:
        torch.manual_seed(seed)
        return embed_at_cuts(SliceEncoder(vocab, hidden), seqs, cuts, scale)
    finally:
        torch.set_default_dtype(torch.float32)


# %%
distill.check("embed-at-cuts", embed_fixture)

# %% [markdown]
# ## 7. The opponent: windowed aggregates by prefix sums
#
# The embedding is only worth training if it beats, or adds to, what a person
# would build by hand. The fair opponent is the one the course built in
# module 3: per client and cut, counts and amount statistics over the last
# 30 days, the last 90 days and the whole history, broken down by event type
# and source type. A row's window is the half-open interval
# $[\text{cut} - w, \text{cut})$, so nothing at or after the cut enters it.
#
# With twelve cuts per client, summing each window from scratch rereads the
# same events twelve times. Prefix sums do it once: stack per-event columns
# $V$ (a 1 for the count, the log amount $\ell = \log(1 + \text{amount})$,
# $\ell^2$, one indicator per top event type, $\ell$ times each indicator,
# one indicator per top source type), let $P_0 = 0$ and
# $P_k = V_0 + \dots + V_{k-1}$, and every window sum is $P_{hi} - P_{lo}$,
# with $lo$ and $hi$ the number of events before $\text{cut} - w$ and before
# the cut, found by binary search (`np.searchsorted`). It is the difference
# of two running sums from module 3, here in matrix form.
#
# From the window sums: the count $N$; the mean log amount $S_1/N$; the
# variance $S_2/N - (S_1/N)^2$, floored at 0 because rounding can push it
# just below; and (not additive, so taken from the slice directly) the
# number of distinct destination codes `dst_type12`. Mean, variance and
# distinct count are 0 for an empty window. After the windows comes one
# last column: days from the last event before the cut to the cut, 9999 when
# there is none.
#
# Column order, for each window in the order given: count, mean, variance,
# distinct destinations, the counts of each top type, the log-amount sums of
# each top type, the counts of each top source; then the days column.

# %%
def window_aggregates(seq, cuts, windows, top_types, top_src):
    """Windowed aggregates of one history at each cut.

    Args:
        seq: one history (dict of arrays, "t" sorted, seconds).
        cuts: (m,) int array of cut timestamps.
        windows: window lengths in days, e.g. (30, 90, 10000).
        top_types: event_type codes that get their own columns.
        top_src: src_type11 codes that get their own columns.
    Returns:
        (m, len(windows) * (4 + 2 * len(top_types) + len(top_src)) + 1)
        float array, columns as listed above.
    """
    # BEGIN SOLUTION
    t, la = seq["t"], np.log1p(seq["amount"])
    is_type = (seq["event_type"][:, None] == np.asarray(top_types)[None, :]).astype(float)
    is_src = (seq["src_type11"][:, None] == np.asarray(top_src)[None, :]).astype(float)
    V = np.column_stack([np.ones(len(t)), la, la ** 2, is_type, is_type * la[:, None], is_src])
    P = np.vstack([np.zeros(V.shape[1]), np.cumsum(V, axis=0)])
    cuts = np.asarray(cuts)
    hi = np.searchsorted(t, cuts, side="left")
    out = []
    for w in windows:
        lo = np.searchsorted(t, cuts - w * DAY, side="left")
        S = P[hi] - P[lo]
        n = S[:, 0]
        safe = np.maximum(n, 1)
        mean = S[:, 1] / safe
        var = np.maximum(S[:, 2] / safe - mean ** 2, 0.0)
        distinct = [len(np.unique(seq["dst_type12"][a:b])) for a, b in zip(lo, hi)]
        k = len(top_types)
        out += [n[:, None], mean[:, None], var[:, None], np.array(distinct, float)[:, None],
                S[:, 3:3 + k], S[:, 3 + k:3 + 2 * k], S[:, 3 + 2 * k:]]
    last = np.where(hi > 0, (cuts - t[np.maximum(hi - 1, 0)]) / DAY, 9999.0)
    return np.column_stack(out + [last[:, None]])
    # END SOLUTION


# %%
# Local check: module 3's seven payments, one card, a 24-hour window at each payment's own time.
_when = pd.to_datetime(["2022-01-01 18:20", "2022-01-01 20:35", "2022-01-01 22:30", "2022-01-02 00:50",
                        "2022-01-02 19:18", "2022-01-02 23:45", "2022-01-03 00:00"])
_seven = {"t": ((_when - pd.Timestamp("1970-01-01")) // pd.Timedelta("1s")).to_numpy(np.int64),
          "amount": np.array([250.0, 400, 250, 50, 100, 150, 10]),
          "event_type": np.array([1, 1, 2, 1, 1, 1, 1]),          # 1 = POS, 2 = ATM
          "src_type11": np.ones(7, np.int64), "dst_type11": np.ones(7, np.int64),
          "dst_type12": np.array([5, 5, 7, 9, 9, 9, 5])}
_A = window_aggregates(_seven, _seven["t"], (1,), [1, 2], [1])
_inside = [[], [0], [0, 1], [0, 1, 2], [1, 2, 3], [3, 4], [3, 4, 5]]
assert _A.shape == (7, 4 + 4 + 1 + 1)
assert (_A[:, 0] == [0, 1, 2, 3, 3, 2, 3]).all(), "N_24h of the table: 0 1 2 3 3 2 3"
assert np.allclose(_A[:, 0] * _A[:, 1], [np.log1p(_seven["amount"][i]).sum() for i in _inside])
assert (_A[:, 4:6] == [[0, 0], [1, 0], [2, 0], [2, 1], [2, 1], [2, 0], [3, 0]]).all()
assert (_A[:, 3] == [0, 1, 1, 2, 3, 1, 1]).all() and _A[0, -1] == 9999 and np.isclose(_A[6, -1], 15 / 60 / 24)


# %%
distill.check("window-aggregates", window_aggregates)

# %% [markdown]
# ## 8. A difference with an interval: the client bootstrap
#
# The two feature sets will be compared by ROC-AUC per product, averaged
# over the four products, on the evaluation fold: about 9,500 rows, a
# hundred positives per product. A difference of 0.01 on that many
# positives can be noise, so each comparison gets a 95% interval.
#
# The bootstrap estimates the spread of a statistic by recomputing it on
# samples drawn with replacement from the data. What gets drawn matters. The
# rows here are not independent: each client has four monthly rows, and a
# client who buys in October tends to look the same in November. Resampling
# rows treats a client's four rows as four independent witnesses and makes
# the interval too narrow. Resample *clients*, and keep all of a drawn
# client's rows.
#
# And the question is the difference, not either score. Both models are
# scored on the same resampled rows, and the statistic is the difference of
# their mean ROC-AUC. Two intervals, one per model, overlap even when one
# model wins on almost every resample; the paired difference does not throw
# that pairing away.
#
# Write `paired_client_bootstrap`. Protocol (the checker replays it):
#
# 1. `rng = np.random.default_rng(seed)`; clients are indexed in sorted order,
#    `np.unique(client_ids)`.
# 2. For each of the `n_boot` draws: one call `rng.integers(0, n_clients,
#    n_clients)` picks the clients; the draw's rows are all rows of each
#    picked client, a client picked twice contributing its rows twice.
# 3. For each target column, if the draw's labels are all 0 or all 1, skip
#    it; otherwise compute ROC-AUC of `score_b` minus ROC-AUC of `score_a`.
#    The draw's statistic is the mean over the targets kept.
# 4. Return the 2.5th and 97.5th percentiles of the `n_boot` statistics,
#    `np.percentile` with its default interpolation.

# %%
def paired_client_bootstrap(y, score_a, score_b, client_ids, n_boot, seed):
    """Percentile interval of mean-over-targets ROC-AUC(b) - ROC-AUC(a), resampling clients.

    Args:
        y: (n, T) array of 0/1 labels.
        score_a, score_b: (n, T) scores of the two models.
        client_ids: (n,) client of each row, any order.
        n_boot: number of bootstrap draws.
        seed: seed of the generator.
    Returns:
        (2,) float array, the 2.5th and 97.5th percentiles.
    """
    # BEGIN SOLUTION
    rng = np.random.default_rng(seed)
    _, inverse = np.unique(client_ids, return_inverse=True)
    order = np.argsort(inverse, kind="stable")
    starts = np.searchsorted(inverse[order], np.arange(inverse.max() + 2))
    members = [order[a:b] for a, b in zip(starts[:-1], starts[1:])]
    stats = []
    for _ in range(n_boot):
        pick = rng.integers(0, len(members), len(members))
        rows = np.concatenate([members[k] for k in pick])
        diffs = []
        for j in range(y.shape[1]):
            yy = y[rows, j]
            if yy.min() == yy.max():
                continue
            diffs.append(roc_auc_score(yy, score_b[rows, j]) - roc_auc_score(yy, score_a[rows, j]))
        stats.append(np.mean(diffs))
    return np.percentile(stats, [2.5, 97.5])
    # END SOLUTION


# %%
# Local check: a model against itself differs by exactly zero on every draw.
_y = (np.random.default_rng(1).random((300, 2)) < 0.2).astype(int)
_a = np.random.default_rng(2).random((300, 2))
assert np.allclose(paired_client_bootstrap(_y, _a, _a, np.arange(300) // 3, 50, 0), 0)


# %%
distill.check("paired-client-bootstrap", paired_client_bootstrap)

# %% [markdown]
# ## 9. What the encoder may train on
#
# The encoder is trained before any downstream model, on histories with no
# labels, and that is where a leak hides most easily: nothing downstream
# looks at the pretraining set again. Two rules make the evaluation honest.
#
# - **Clients.** No client of the evaluation or graded folds. An encoder
#   that has read a client's history has, in a weak sense, memorised that
#   client, and the comparison is then not about new clients.
# - **Time.** No event at or after the pretraining end, 1 August 2022. The
#   encoder is frozen before the label months it is evaluated on (October
#   2022 on), as a deployed encoder would be. An event stamped exactly at
#   the end is already after it.
#
# A history with too few events before the end cannot give a slice of the
# minimum length and is left out.
#
# Write `pretraining_set`: for each client, how many of its first events the
# encoder may read, or 0 if it reads none of them.

# %%
def pretraining_set(times, folds, test_folds, pretrain_end, min_events):
    """Usable history prefix per client for pretraining.

    Args:
        times: list of sorted int arrays of event timestamps, one per client.
        folds: (n_clients,) int array, each client's fold.
        test_folds: folds never trained on.
        pretrain_end: timestamp; events at or after it are excluded.
        min_events: a client with fewer usable events gets 0.
    Returns:
        (n_clients,) int array: the number of events strictly before
        pretrain_end, or 0 for a client in test_folds or below min_events.
    """
    # BEGIN SOLUTION
    n = np.array([np.searchsorted(t, pretrain_end, side="left") for t in times])
    n[np.isin(folds, test_folds) | (n < min_events)] = 0
    return n
    # END SOLUTION


# %%
distill.check("pretraining-set", pretraining_set)

# %% [markdown]
# ## 10. The training loop
#
# Everything is in place: slices, the loss with hard negatives, the encoder.
# Write `pretrain`, which runs `n_steps` steps of Adam on batches built from
# the usable prefixes. Per step, in this order (the checker replays it):
#
# 1. `rng.choice(pool, batch_clients, replace=False)`, where `pool` is the
#    clients with a usable prefix, ascending (`np.flatnonzero(n_usable)`).
# 2. For each position $j$ in the drawn array, in order, and the client $c$
#    at that position: `sample_slices(n_usable[c], k, min_len, max_len, rng)`;
#    each slice's events are featurized with
#    `featurize(seqs[c], np.arange(start, start + length), scale)` and the
#    slice is labelled $j$.
# 3. Encode the batch, take `coles_loss_hard`, and step: clear the gradients,
#    backpropagate, update.
#
# Create the optimiser inside, `torch.optim.Adam(encoder.parameters(), lr)`,
# and return the per-step losses. Clearing the gradients matters: PyTorch adds
# each backward pass's gradient to the one already stored.

# %%
def pretrain(encoder, seqs, n_usable, n_steps, scale, rng, batch_clients=64, k=4,
             min_len=15, max_len=64, margin=0.5, n_hard=5, lr=2e-3):
    """Contrastive pretraining of encoder in place.

    Args:
        encoder: a SliceEncoder, trained in place.
        seqs: list of histories.
        n_usable: (n_clients,) usable prefix lengths, from pretraining_set.
        n_steps: optimiser steps.
        scale: (mean, sd) of log1p(amount) for featurize.
        rng: numpy Generator for the clients and slices.
        batch_clients, k, min_len, max_len: batch_clients clients per batch,
            k slices of each, lengths in [min_len, max_len].
        margin, n_hard: the loss's margin and hard negatives per slice.
        lr: Adam's learning rate.
    Returns:
        list of n_steps floats, the loss of each step's batch.
    """
    # BEGIN SOLUTION
    pool = np.flatnonzero(n_usable)
    opt = torch.optim.Adam(encoder.parameters(), lr=lr)
    losses = []
    for _ in range(n_steps):
        batch, ids = [], []
        for j, c in enumerate(rng.choice(pool, batch_clients, replace=False)):
            for start, length in sample_slices(int(n_usable[c]), k, min_len, max_len, rng):
                batch.append(featurize(seqs[c], np.arange(start, start + length), scale))
                ids.append(j)
        loss = coles_loss_hard(encoder(batch), torch.tensor(ids), margin, n_hard)
        opt.zero_grad()
        loss.backward()
        opt.step()
        losses.append(loss.item())
    return losses
    # END SOLUTION


# %%
def pretrain_fixture(seed, vocab, hidden, seqs, n_usable, n_steps, scale, hyper, query, cuts):
    """The checker's harness: a seeded float64 encoder, trained on the fixture, read at cuts."""
    torch.set_default_dtype(torch.float64)
    try:
        torch.manual_seed(seed)
        enc = SliceEncoder(vocab, hidden)
        losses = pretrain(enc, seqs, n_usable, n_steps, scale, np.random.default_rng(seed), **hyper)
        return np.asarray(losses), embed_at_cuts(enc, [seqs[q] for q in query], cuts, scale)
    finally:
        torch.set_default_dtype(torch.float32)


# %%
distill.check("pretrain-and-embed", pretrain_fixture)

# %% [markdown]
# ## 11. Pretraining on about 5,700 histories
#
# The real run: the usable prefixes of the training folds, the amount scale
# fitted on those events only, and the settings of the module's run — 64
# clients a batch, four slices of 15 to 64 events each, margin 0.5, five
# hard negatives per slice, a GRU of 128 units, Adam at $2 \cdot 10^{-3}$.
# 800 steps take about four minutes on four threads of a server CPU and
# ten to fifteen on a two-core Colab machine. No GPU is needed.

# %%
PRETRAIN_STEPS = 800
n_usable = pretraining_set([s["t"] for s in seqs], fold_of, (EVAL_FOLD, GRADED_FOLD), PRETRAIN_END, 15)
_la = np.concatenate([np.log1p(seqs[c]["amount"][:n_usable[c]]) for c in np.flatnonzero(n_usable)])
SCALE = (float(_la.mean()), float(_la.std()))
print(f"{(n_usable > 0).sum():,} clients and {n_usable.sum():,} events to pretrain on; "
      f"log amount mean {SCALE[0]:.3f}, sd {SCALE[1]:.3f}")
assert not np.isin(fold_of[n_usable > 0], (EVAL_FOLD, GRADED_FOLD)).any()

torch.manual_seed(0)
encoder = SliceEncoder(VOCAB, 128)
_t0 = time.time()
losses = pretrain(encoder, seqs, n_usable, PRETRAIN_STEPS, SCALE, np.random.default_rng(0))
print(f"{PRETRAIN_STEPS} steps in {time.time() - _t0:.0f} s; loss over the first and last 50 steps: "
      f"{np.mean(losses[:50]):.4f} -> {np.mean(losses[-50:]):.4f}")

# %% [markdown]
# A loss curve says little without a broken one beside it. The same loop
# with a learning rate 500 times larger, for 80 steps from a fresh encoder.
# The loss is bounded, so a step too large does not make it blow up; it
# stalls. For scale: an encoder that sends every slice to one point has
# positive terms of 0 and hard-negative terms of $\tfrac{1}{2}\rho^2 =
# 0.125$, and with 768 positive and 1,280 hard pairs per batch its loss is
# $0.125 \cdot 1280 / 2048 = 0.078$.

# %%
# Infrastructure (do not modify): a broken run for comparison, and the plot.
torch.manual_seed(0)
_broken = pretrain(SliceEncoder(VOCAB, 128), seqs, n_usable, 80, SCALE, np.random.default_rng(0), lr=1.0)


def plot_losses(curves):
    fig, ax = plt.subplots(figsize=(7, 3.2))
    for name, ls in curves.items():
        smooth = pd.Series(ls).rolling(10, min_periods=1).mean()
        ax.plot(np.arange(1, len(ls) + 1), smooth, lw=1.2, label=name)
    ax.set_yscale("log")
    ax.set_xlabel("step")
    ax.set_ylabel("batch loss (10-step mean)")
    ax.legend(fontsize=8)
    plt.tight_layout()
    plt.show()


plot_losses({"lr 2e-3": losses, "lr 1.0": _broken})
print(f"steps 71-80: lr 1.0 {np.mean(_broken[70:80]):.4f}, lr 2e-3 {np.mean(losses[70:80]):.4f}; collapse level 0.078")

# %% [markdown]
# ## 12. Every row's two feature sets
#
# Your `embed_at_cuts` and `window_aggregates` now run over every row of
# the three parts: 75,784 client-months. The loops below batch clients of
# similar length together so that padding stays small; they call only your
# functions. The top 20 event types and top 10 source types are counted on
# the pretraining events, like the amount scale: nothing about the
# evaluation or graded clients chooses a column.

# %%
# Infrastructure (do not modify): your functions over every row.
WINDOWS = (30, 90, 10000)
_pool = np.flatnonzero(n_usable)
TOP_TYPES = pd.Series(np.concatenate([seqs[c]["event_type"][:n_usable[c]] for c in _pool])).value_counts().index[:20].to_numpy()
TOP_SRC = pd.Series(np.concatenate([seqs[c]["src_type11"][:n_usable[c]] for c in _pool])).value_counts().index[:10].to_numpy()


def embed_rows(encoder, seqs, rows, scale, batch=64):
    groups = rows.groupby("client").indices
    clients = sorted(groups, key=lambda c: len(seqs[c]["t"]))
    cut = rows["cut"].to_numpy()
    out = np.zeros((len(rows), encoder.gru.hidden_size), dtype=np.float32)
    for i in range(0, len(clients), batch):
        chunk = clients[i:i + batch]
        E = embed_at_cuts(encoder, [seqs[c] for c in chunk], [cut[groups[c]] for c in chunk], scale)
        out[np.concatenate([groups[c] for c in chunk])] = E
    return out


def aggregate_rows(seqs, rows):
    groups = rows.groupby("client").indices
    cut = rows["cut"].to_numpy()
    out = None
    for c, pos in groups.items():
        X = window_aggregates(seqs[c], cut[pos], WINDOWS, TOP_TYPES, TOP_SRC)
        if out is None:
            out = np.zeros((len(rows), X.shape[1]))
        out[pos] = X
    return out


_t0 = time.time()
E = embed_rows(encoder, seqs, rows, SCALE)
print(f"embeddings {E.shape} in {time.time() - _t0:.0f} s")
_t0 = time.time()
A = aggregate_rows(seqs, rows)
print(f"aggregates {A.shape} in {time.time() - _t0:.0f} s")

# %% [markdown]
# ## 13. The head-to-head, at three label budgets
#
# Three models per product, fitted on the training folds' months up to
# September 2022 and scored on the evaluation fold's October to January:
#
# - **aggregates**: a boosted tree (LightGBM, 300 trees, fixed settings) on
#   the 163 aggregate columns;
# - **embedding**: a logistic regression on the 128-number embedding;
# - **rank average**: the mean of the two models' scores converted to ranks,
#   the early fusion of the module, which needs no weights fitted.
#
# And three label budgets: all training clients labelled, a tenth of them
# and 3% of them, the same seeded draw of clients for every model (each
# smaller set inside the larger one). The encoder is the same in all three:
# it was trained without labels, so a smaller label budget does not shrink
# it. A product with fewer than five positive training rows under a budget
# is left out of that budget's mean, and the table says so.
#
# Each comparison with the aggregates gets the interval from your
# bootstrap, 1,000 draws of evaluation clients.

# %%
# Infrastructure (do not modify): the models, the label budgets and the comparison.
def fit_gbm(X, y, Xt):
    m = LGBMClassifier(n_estimators=300, learning_rate=0.03, num_leaves=31, subsample=0.8, subsample_freq=1,
                       colsample_bytree=0.5, min_child_samples=20, random_state=0, n_jobs=THREADS,
                       deterministic=True, force_row_wise=True, verbose=-1)
    return m.fit(X, y).predict_proba(Xt)[:, 1]


def fit_logreg(X, y, Xt):
    m = make_pipeline(StandardScaler(), LogisticRegression(C=0.1, max_iter=2000))
    return m.fit(X, y).predict_proba(Xt)[:, 1]


def rank_average(*scores):
    return np.mean([rankdata(s) / len(s) for s in scores], axis=0)


part = rows["part"].to_numpy()
Y = rows[TARGETS].to_numpy()
_train_clients = np.unique(rows.loc[part == "train", "client"])
_order = np.random.default_rng(1).permutation(_train_clients)
BUDGETS = {"all labels": _order, "10% of clients": _order[:len(_order) // 10],
           "3% of clients": _order[:len(_order) * 3 // 100]}


def score_models(labelled, test):
    """Scores of the three models on the rows `test`, per target, from the labelled clients' training rows."""
    tr = (part == "train") & rows["client"].isin(labelled).to_numpy()
    P = {m: np.full((test.sum(), len(TARGETS)), np.nan) for m in ("aggregates", "embedding", "rank average")}
    for j in range(len(TARGETS)):
        if Y[tr, j].sum() < 5:
            continue
        P["aggregates"][:, j] = fit_gbm(A[tr], Y[tr, j], A[test])
        P["embedding"][:, j] = fit_logreg(E[tr], Y[tr, j], E[test])
        P["rank average"][:, j] = rank_average(P["aggregates"][:, j], P["embedding"][:, j])
    return P, tr


def mean_auc(y, P):
    return np.mean([roc_auc_score(y[:, j], P[:, j]) for j in range(y.shape[1])])


ev = part == "eval"
results, intervals = [], {}
_t0 = time.time()
for name, labelled in BUDGETS.items():
    P, tr = score_models(labelled, ev)
    kept = [j for j in range(len(TARGETS)) if not np.isnan(P["aggregates"][0, j])]
    y = Y[ev][:, kept].astype(int)
    row = {"budget": name, "clients": len(labelled), "train rows": int(tr.sum()),
           "positives": " / ".join(str(int(Y[tr, j].sum())) for j in range(len(TARGETS))),
           "products": len(kept)}
    row.update({m: mean_auc(y, P[m][:, kept]) for m in P})
    for m in ("embedding", "rank average"):
        intervals[name, m] = paired_client_bootstrap(y, P["aggregates"][:, kept], P[m][:, kept],
                                                     rows.loc[ev, "client"].to_numpy(), 1000, 0)
        row[f"{m} - aggregates"] = "[{:+.3f}, {:+.3f}]".format(*intervals[name, m])
    results.append(row)
print(f"fitted and bootstrapped in {time.time() - _t0:.0f} s")
table = pd.DataFrame(results).set_index("budget")
with pd.option_context("display.width", 200, "display.precision", 3):
    print(table.to_string())

# %%
# Infrastructure (do not modify): the intervals and the scores against the label budget.
def plot_intervals(table, intervals):
    fig, (left, right) = plt.subplots(1, 2, figsize=(10, 3.4))
    names = list(table.index)
    for k, m in enumerate(("embedding", "rank average")):
        diff = table[m] - table["aggregates"]
        lo = np.array([intervals[n, m][0] for n in names])
        hi = np.array([intervals[n, m][1] for n in names])
        y = np.arange(len(names)) + 0.15 * (k - 0.5)
        left.errorbar(diff, y, xerr=[diff - lo, hi - diff], fmt="o", ms=4, capsize=3, label=f"{m} - aggregates")
    left.axvline(0, color="0.5", lw=0.8)
    left.set_yticks(range(len(names)), names)
    left.invert_yaxis()
    left.set_xlabel("difference of mean ROC-AUC, 95% client-bootstrap interval")
    left.legend(fontsize=8)
    share = np.array([1.0, 0.1, 0.03])
    for m in ("aggregates", "embedding", "rank average"):
        right.plot(share, table[m], "o-", ms=4, lw=1.2, label=m)
    right.set_xscale("log")
    right.set_xticks(share, ["100%", "10%", "3%"])
    right.set_xlabel("training clients labelled")
    right.set_ylabel("mean ROC-AUC, evaluation fold")
    right.legend(fontsize=8)
    plt.tight_layout()
    plt.show()


plot_intervals(table, intervals)

# %% [markdown]
# ## 14. What the point-in-time trap is worth
#
# The `embed-at-cuts` check named two ways of reading the state too late.
# Here is what the second one, the state after the first event at or after
# the cut, does to the embedding's score at all labels: the same encoder,
# the same logistic regression, only the index read is one event later.

# %%
# Infrastructure (do not modify): the trap, for comparison only.
def leaky_rows(encoder, seqs, rows, scale, batch=64):
    groups = rows.groupby("client").indices
    clients = sorted(groups, key=lambda c: len(seqs[c]["t"]))
    cut = rows["cut"].to_numpy()
    out = np.zeros((len(rows), encoder.gru.hidden_size), dtype=np.float32)
    for i in range(0, len(clients), batch):
        chunk = clients[i:i + batch]
        with torch.no_grad():
            _, S = encoder([featurize(seqs[c], np.arange(len(seqs[c]["t"])), scale) for c in chunk], states=True)
        for b, c in enumerate(chunk):
            n = np.searchsorted(seqs[c]["t"], cut[groups[c]], side="left")
            out[groups[c]] = S[b].numpy()[np.minimum(n, len(seqs[c]["t"]) - 1)]
    return out


E_leak = leaky_rows(encoder, seqs, rows, SCALE)
_tr = part == "train"
_honest = np.array([fit_logreg(E[_tr], Y[_tr, j], E[ev]) for j in range(4)]).T
_leaky = np.array([fit_logreg(E_leak[_tr], Y[_tr, j], E_leak[ev]) for j in range(4)]).T
print(f"embedding at all labels, mean ROC-AUC on the evaluation fold: read before the cut "
      f"{mean_auc(Y[ev].astype(int), _honest):.3f}, read one event past it {mean_auc(Y[ev].astype(int), _leaky):.3f}")


# %% [markdown]
# The reference run of this notebook (seed 0, 800 steps) gave, on the
# evaluation fold:
#
# | budget | aggregates | embedding | rank average | embedding − aggregates | rank average − aggregates |
# |---|---|---|---|---|---|
# | all labels | 0.710 | 0.691 | 0.724 | [−0.050, +0.013] | [−0.003, +0.030] |
# | 10% of clients | 0.590 | 0.646 | 0.638 | [+0.023, +0.092] | [+0.031, +0.067] |
# | 3% of clients | 0.569 | 0.605 | 0.599 | [+0.003, +0.071] | [+0.013, +0.048] |
#
# and, for the trap of section 14, 0.691 read before the cut against 0.706
# read one event past it. A second run with the pretraining seeded 1
# instead of 0, all else equal, gave the same picture at all labels
# ([−0.044, +0.016], [−0.001, +0.030]) and at a tenth ([+0.017, +0.082],
# [+0.027, +0.061]), but at 3% both intervals spanned zero
# ([−0.028, +0.039], [−0.007, +0.028]): the embedding itself scored 0.572
# there instead of 0.605. Your numbers will differ in the third decimal:
# the encoder is trained in floating point on a different machine, and
# 800 steps of a GRU do not land on the same weights twice across
# hardware. One seed, one cut, half the clients chosen for having bought
# something: these are not the published 0.78–0.82, and they say nothing
# about fraud.
#
# Two experiments are worth running yourself once the checkpoints stand,
# neither graded. **Order.** Shuffle each training slice's events before
# encoding (and each history before reading cuts, which then needs one
# pass per cut). With the dates jittered within the day, how much does the
# embedding lose? In an earlier run of the course on a similar cut, 0.011.
# **Concatenation.** Give the boosted tree the aggregates and the
# embedding as one 291-column matrix instead of averaging ranks; compare at
# all labels and at a tenth.

# %% [markdown]
# ## 15. What the intervals license
#
# Write a short answer, from your own table (not the reference's), to four
# points:
#
# 1. For each label budget, which of these readings its interval licenses,
#    and which it forbids: "the embedding beats the aggregates", "the rank
#    average adds to the aggregates", "pretraining pays when labels are
#    scarce".
# 2. What the intervals do not account for: name at least two sources of
#    variation or selection that the client bootstrap leaves out.
# 3. Two things this lab cannot say at all, whatever the intervals: one
#    about fraud, one about the published numbers on this benchmark.
# 4. What the trap of section 14 would have done to the comparison.

# %%
distill.submit_review(
    "what-the-interval-licenses",
    "1. At all labels the embedding-minus-aggregates interval is [-0.050, +0.013] and the "
    "rank-average one [-0.003, +0.030]. Both contain zero, so neither 'the embedding beats the "
    "aggregates' nor 'the rank average adds to them' is licensed; the point estimates (-0.019, "
    "+0.014) only suggest the fusion helps a little. Nor is 'the embedding is worse' licensed. "
    "At a tenth of the clients both intervals are clear of zero ([+0.023, +0.092], "
    "[+0.031, +0.067]): there the embedding alone beats the aggregates and the fusion adds to "
    "them, on these clients and months. At 3% both are clear of zero too, more narrowly for "
    "the embedding alone ([+0.003, +0.071]). 'Pretraining pays when labels are scarce' is "
    "supported as a pattern: the difference moves from spanning zero at full labels to clear "
    "of zero at a tenth and at 3%. It is the aggregates that collapse (0.710 to 0.590), "
    "the embedding loses less (0.691 to 0.646). "
    "2. The bootstrap resamples evaluation clients only. It holds fixed the encoder (one "
    "pretraining seed; another seed gives a different embedding), the draw of which training "
    "clients are labelled (one draw per budget; another 10% could favour either model), the "
    "boosted tree's and the logistic regression's settings, and the evaluation months. And "
    "the cut over-samples buyers: half the clients bought something, against 19% in the full "
    "data, so the scores are not the ones a natural sample would give. Three budgets compared "
    "at once also means one interval clear of zero by chance is not unlikely. "
    "3. The data has no fraud label, so nothing here says the embedding detects fraud; it "
    "shows the technique on product purchases. And the scores are not comparable with the "
    "published 0.78-0.82 on the benchmark: different clients, a sampled positive mix, fewer "
    "columns and months, a different split. "
    "4. Reading the state one event past the cut raised the embedding from 0.691 to 0.706 at "
    "all labels: that leak alone would move the embedding-minus-aggregates estimate by +0.015, "
    "a third of the way across its interval, and could make a null result look like a win."
)

# %% [markdown]
# ## 16. Open task: the most from a tenth of the labels
#
# Score the graded fold's 9,440 client-months, October 2022 to January 2023,
# for all four products, using labels **only** of the 10% budget's training
# clients, `BUDGETS["10% of clients"]`. Anything unlabelled is yours: the
# aggregates `A`, the embedding `E`, the encoder (retrain it, change its
# settings, train longer), new columns from the histories. Two rules keep
# the number meaningful, and nothing can check them: no label outside the
# budget, and no pretraining on a client of folds 0 or 1 or on an event
# from August 2022 on.
#
# The grade is one ROC-AUC over the four products stacked: `stack_targets`
# turns each product's scores into ranks within that product, divided by
# the number of rows, and concatenates the four. A positive of one product
# then competes with negatives of all four, so the stacked score is close
# to a mean of the four products' ROC-AUCs weighted by their positives,
# which puts little weight on product 2 (21 graded positives). Scores
# turned into ranks per product cannot be scaled against each other, which
# is why the helper does it for you; do not submit raw probabilities.
#
# The bar and what stands below it, on the graded fold, stacked:
#
# | scores at 10% of clients | stacked ROC-AUC |
# |---|---|
# | the boosted tree of section 13 on the aggregates | 0.630 |
# | the logistic regression of section 13 on the embedding | 0.626 |
# | their rank average, as in section 13 | 0.650 |
# | **the bar** | **0.654** |
#
# The bar is not "beat the aggregates by a margin": at full labels the
# interval for that spans zero, and grading it would grade luck. It sits
# just above section 13's rank average, so that fusion returned as it is
# does not clear it; a change has to buy something. The evaluation fold,
# whose labels you have, is your validation: the cell after yours plots
# your scores there beside section 13's three models, product by product.
# `scarce_label_scores` is called once, on the evaluation and graded rows
# together, so anything slow inside it runs once. Hints are after the
# plot; try first.

# %%
def stack_targets(P):
    """(n, 4) scores -> (4n,) ranks within each product divided by n, product-major."""
    return np.concatenate([rankdata(P[:, j]) / len(P) for j in range(P.shape[1])])


def scarce_label_scores(test):
    """Scores for every product on the rows `test`, from the 10% budget's labels only.

    Args:
        test: (len(rows),) boolean mask of the rows to score; the notebook
            passes the evaluation and graded rows together.
    Returns:
        (test.sum(), 4) float array, higher meaning more likely to buy.
    """
    # BEGIN SOLUTION
    # A copy trained 1,200 steps further on the same pretraining set, so the
    # encoder of sections 11-15 stays as it was; and where the embedding moved
    # over the 90 days before the cut, read from the same pass.
    enc = copy.deepcopy(encoder)
    pretrain(enc, seqs, n_usable, 1200, SCALE, np.random.default_rng(1200))
    E2 = embed_rows(enc, seqs, rows, SCALE)
    D = np.hstack([E2, E2 - embed_rows(enc, seqs, rows.assign(cut=rows["cut"] - 90 * DAY), SCALE)])
    LA = np.sign(A) * np.log1p(np.abs(A))
    tr = (part == "train") & rows["client"].isin(BUDGETS["10% of clients"]).to_numpy()
    out = np.zeros((test.sum(), len(TARGETS)))
    for j in range(len(TARGETS)):
        tree = LGBMClassifier(n_estimators=300, learning_rate=0.02, num_leaves=4, min_child_samples=100,
                              subsample=0.8, subsample_freq=1, colsample_bytree=0.5, random_state=0,
                              n_jobs=THREADS, deterministic=True, force_row_wise=True, verbose=-1)
        pa = tree.fit(A[tr], Y[tr, j]).predict_proba(A[test])[:, 1]
        emb_lr = make_pipeline(StandardScaler(), LogisticRegression(C=0.001, max_iter=3000))
        pe = emb_lr.fit(D[tr], Y[tr, j]).predict_proba(D[test])[:, 1]
        agg_lr = make_pipeline(StandardScaler(), LogisticRegression(C=0.03, max_iter=3000))
        pl = agg_lr.fit(LA[tr], Y[tr, j]).predict_proba(LA[test])[:, 1]
        out[:, j] = rank_average(pa, pe, pl)
    return out
    # END SOLUTION


# %%
# Infrastructure (do not modify): your scores, split into the evaluation fold
# (labels yours) and the graded fold (labels the server's), and the plot.
_scored = part != "train"
_t0 = time.time()
_P_all = scarce_label_scores(_scored)
assert _P_all.shape == (_scored.sum(), 4)
print(f"scored in {time.time() - _t0:.0f} s")
P_open = {"eval": _P_all[ev[_scored]], "graded": _P_all[(part == "graded")[_scored]]}
P13, _ = score_models(BUDGETS["10% of clients"], ev)


def plot_open_task(y, mine, ref):
    """ROC-AUC per product and stacked, evaluation fold: section 13's models at 10% beside yours."""
    names = [f"product {j + 1}\n({int(y[:, j].sum())} pos.)" for j in range(y.shape[1])] + ["stacked"]
    fig, ax = plt.subplots(figsize=(7, 3.6))
    models = {**ref, "yours": mine}
    for k, (name, P) in enumerate(models.items()):
        auc = [roc_auc_score(y[:, j], P[:, j]) for j in range(y.shape[1])]
        auc.append(roc_auc_score(y.T.ravel(), stack_targets(P)))
        pos = np.arange(len(names)) + 0.15 * (k - (len(models) - 1) / 2)
        ax.plot(auc, pos, "D" if name == "yours" else "o", ms=6 if name == "yours" else 4, label=name)
    ax.axhline(len(names) - 1.5, color="0.7", lw=0.8)
    ax.set_yticks(range(len(names)), names)
    ax.invert_yaxis()
    ax.set_xlabel("ROC-AUC, evaluation fold, 10% of clients labelled")
    ax.legend(fontsize=8, loc="lower right")
    plt.tight_layout()
    plt.show()


_y = Y[ev].astype(int)
plot_open_task(_y, P_open["eval"], P13)
print(f"evaluation fold, 10% of clients: stacked ROC-AUC {roc_auc_score(_y.T.ravel(), stack_targets(P_open['eval'])):.3f} "
      f"(section 13's rank average {roc_auc_score(_y.T.ravel(), stack_targets(P13['rank average'])):.3f}), "
      f"mean over products {mean_auc(_y, P_open['eval']):.3f}")

# %% [markdown]
# <details><summary>Hint 1 — strategy</summary>
#
# At 710 labelled clients the boosted tree of section 13 has 31 leaves per
# tree and 163 columns to split on, and fourteen positives of product 2:
# it fits noise. The embedding's logistic regression has 128 weights and
# the same problem in a milder form. Both models can be made to ask less
# of the labels. Then the fusion can take more members than two: the
# aggregates on a log scale suit a linear model better than raw counts
# and sums, and an encoder trained longer, read twice, also says how a
# client's behaviour has changed.
#
# </details>
#
# <details><summary>Hint 2 — pseudocode</summary>
#
# ```
# train a copy of the encoder further; embed every row at its cut and at
#     its cut minus 90 days; keep the embedding and the difference
# for each product:
#     tree on A with few leaves and many rows per leaf
#     logistic regression on the embedding and its difference, small C
#     logistic regression on sign(A) * log1p(|A|)
#     rank average of the three
# compare each change on the evaluation fold, stacked and per product
# ```
#
# </details>
#
# <details><summary>Hint 3 — last resort</summary>
#
# ```python
# enc = copy.deepcopy(encoder)
# pretrain(enc, seqs, n_usable, 1200, SCALE, np.random.default_rng(1200))   # about six minutes
# E2 = embed_rows(enc, seqs, rows, SCALE)
# D = np.hstack([E2, E2 - embed_rows(enc, seqs, rows.assign(cut=rows["cut"] - 90 * DAY), SCALE)])
# LA = np.sign(A) * np.log1p(np.abs(A))
# LGBMClassifier(n_estimators=300, learning_rate=0.02, num_leaves=4, min_child_samples=100, ...)   # on A
# make_pipeline(StandardScaler(), LogisticRegression(C=0.001, max_iter=3000))                      # on D
# make_pipeline(StandardScaler(), LogisticRegression(C=0.03, max_iter=3000))                       # on LA
# ```
# The rank average of the three reaches about 0.674 on the graded fold and
# clears the bar by two hundredths. The two-member fusion with only the
# regularisation (the tree above on `A`, `C=0.003` on `E`) reaches about
# 0.664, one hundredth above it.
#
# </details>

# %%
distill.submit_predictions("scarce-label-fusion", stack_targets(P_open["graded"]))

# %% [markdown]
# ## 17. Optional: the released next-event weights, and a fraud label
#
# Neither step is run by this notebook, and neither is graded.
#
# **The released next-event model.** The module's generative family has
# public weights trained on this benchmark (`deburky/EventGPT` on Hugging
# Face, CC BY 4.0, about 92 MB per variant). Its embedding at a cut is one
# call:
#
# ```python
# # pip install git+https://github.com/deburky/EventGPT
# from eventgpt import api
# from eventgpt.hub import from_pretrained
# model, vocab = from_pretrained("deburky/EventGPT", "aligned-s42")
# emb = api.embed(model, vocab, cuts, trx, geo)   # (n, 384): history strictly before each cut
# ```
#
# It reads the benchmark's event-per-row `detail` tables, transactions with
# all their columns and geolocation pings, which this lab's file does not
# carry (the tarball is about 2 GB). Its only published timing is on a GPU,
# 242,604 client-months in about 20 minutes on one L4; on a CPU, embedding
# this lab's 9,440 graded rows has not been measured here. If you run it,
# apply the module's checklist before reading the result: the weights were
# pretrained on 2021–2022 events that include the evaluation and graded
# clients' label months, which a model pretrained only before the label
# period gives back as 0.004–0.006 of ROC-AUC; its vocabulary was fitted on
# this same bank's data; and a third member in the rank average is one more
# choice made after seeing the evaluation fold. For the open task its
# embedding counts as unlabelled data, but its pretraining breaks the
# second rule, so report such a score beside the bar, not to the server.
#
# **A fraud label.** The synthetic card set of the IBM TabFormer repository
# has a fraud label at about 0.1% of transactions. Fetch it yourself (git-lfs
# or the repository's download link; it is not mirrored here, and its
# licence is not stated). Split it in time 80/10/10 by cumulative count,
# build module 3's windowed aggregates per card as the baseline and fit a
# boosted tree, then pretrain your `SliceEncoder` on the training period's
# cards and rank-average its embedding in. Report average precision with
# the prevalence in the same sentence, and say whether the relative lift a
# vendor reported for embeddings over a 13-feature baseline (average
# precision 0.1238 to 0.1755) survives a baseline you built.

# %% [markdown]
# ## References
#
# - D. Babaev, N. Ovsov, I. Kireev, M. Ivanova, G. Gusev, I. Nazarov,
#   A. Tuzhilin, "CoLES: Contrastive Learning for Event Sequences with
#   Self-Supervision", SIGMOD 2022 (arXiv:2002.08232): Algorithm 1 (slices),
#   Sec. 3.3 (the margin loss on unit vectors, the batch distance matrix),
#   Sec. 3.4 (the GRU encoder), Table 5 (hard negatives), Sec. 4.0.4 (batch
#   sizes).
# - pytorch-lifestream, https://github.com/pytorch-lifestream/pytorch-lifestream:
#   the tutorial notebooks `coles-emb.ipynb` and `coles-catboost.ipynb`
#   (pretrain, freeze, embeddings into a boosted tree), whose two-step shape
#   this lab follows without the library; docs `sequential_data_definition.md`
#   and `feature_naming.md`.
# - D. Mollaev, I. Kireev, M. Postnova et al., "Multimodal Banking Dataset:
#   Understanding Client Needs through Event Sequences", arXiv:2409.17587,
#   2024: Sec. 3.2 (the four targets, events strictly before the month),
#   Sec. 3.3 (the noise on dates and amounts), Sec. 4.2.1 and Table 2 (the
#   aggregation baseline and the published scores). MBD-mini, CC BY 4.0:
#   https://huggingface.co/datasets/ai-lab/MBD-mini
# - D. Burakov, "EventGPT: Next-Event Pretraining on Banking Customer
#   Histories", arXiv:2611.03302, 2026, and the weights `deburky/EventGPT`:
#   the embedding API, Sec. 6.2 (client-clustered uncertainty), the measured
#   pretraining overlap.
# - NVIDIA, "Build your own transaction foundation model" (developer
#   example, notebooks 01, 04 and 05), and the IBM TabFormer repository:
#   the optional fraud step.

# %%
distill.dump()
