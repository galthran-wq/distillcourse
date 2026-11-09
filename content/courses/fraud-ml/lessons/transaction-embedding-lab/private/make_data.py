"""Regenerates the lab's cut of MBD-mini: data/events.parquet, data/clients.csv,
data/targets.csv.gz, data/holdout.csv (published) and private/holdout_y.csv (the
labels of the graded rows).

Run from the lesson directory with the MBD-mini `ptls` and `targets` tarballs
extracted under MBD_ROOT (https://huggingface.co/datasets/ai-lab/MBD-mini,
CC BY 4.0): `uv run python private/make_data.py MBD_ROOT`.

The cut: 12,000 clients drawn so that half bought at least one of the four
products in some month (the natural mix is 81% all-zero), their card events
from 2021-07-01 on, six of the transaction table's columns, times floored to
the minute and amounts rounded to two significant figures — the trims that
bring the file to a size the public mirror can carry. Folds are MBD's own
client folds: 2–4 train (months up to 2022-09), 1 is the evaluation fold the
learner reads intervals on (months from 2022-10), 0 is the graded fold, whose
labels stay here.
"""

import glob
import sys

import numpy as np
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

SEED = 0
N_CLIENTS = 12_000
FROM = int(pd.Timestamp("2021-07-01").timestamp())
LAST_TRAIN_MONTH = "2022-09"
TARGETS = [f"target_{i}" for i in range(1, 5)]
FIELDS = ["event_type", "src_type11", "dst_type11", "dst_type12"]

root = sys.argv[1]
rng = np.random.default_rng(SEED)

tg = pd.concat(
    pd.read_parquet(f).assign(fold=int(f.split("fold=")[1].split("/")[0]))
    for f in sorted(glob.glob(f"{root}/targets/fold=*/*.parquet"))
)
tg["month"] = pd.to_datetime(tg["mon"]).dt.strftime("%Y-%m")
tg = tg.sort_values(["client_id", "month"], kind="stable")
pos = np.sort(tg.loc[tg[TARGETS].sum(axis=1) > 0, "client_id"].unique())
neg = np.setdiff1d(np.sort(tg["client_id"].unique()), pos)
keep = set(np.r_[rng.choice(pos, N_CLIENTS // 2, replace=False), rng.choice(neg, N_CLIENTS // 2, replace=False)])

parts = []
for f in sorted(glob.glob(f"{root}/ptls/trx/fold=*/*.parquet")):
    t = pq.read_table(f, columns=["client_id", "event_time", "amount", *FIELDS]).to_pandas()
    t = t[t["client_id"].isin(keep)]
    if len(t):
        parts.append(t.explode(["event_time", "amount", *FIELDS]))
ev = pd.concat(parts)
ev = ev[ev["event_time"].astype("int64") >= FROM]
ids = np.sort(ev["client_id"].unique())
code = pd.Series(np.arange(len(ids)), index=ids)
ev = ev.assign(client=code[ev["client_id"]].to_numpy(), t=ev["event_time"].astype("int64") // 60)
ev = ev.sort_values(["client", "t"], kind="stable")

amount = ev["amount"].astype("float64").to_numpy()
scale = 10.0 ** (np.floor(np.log10(amount)) - 1)
table = pa.table({
    "client": ev["client"].to_numpy().astype("int16"),
    "minute": ev["t"].to_numpy().astype("int32"),
    "amount": (np.round(amount / scale) * scale).astype("float32"),
    **{f: ev[f].to_numpy().astype("int16") for f in FIELDS},
})
pq.write_table(table, "data/events.parquet", compression="zstd", compression_level=19,
               use_dictionary=["client", "amount", *FIELDS],
               column_encoding={"minute": "DELTA_BINARY_PACKED"})

tg = tg[tg["client_id"].isin(code.index)].assign(client=lambda d: code[d["client_id"]].to_numpy())
tg[["client", "fold"]].drop_duplicates().sort_values("client").to_csv("data/clients.csv", index=False)
train = tg["fold"].isin([2, 3, 4]) & (tg["month"] <= LAST_TRAIN_MONTH)
evaluation = (tg["fold"] == 1) & (tg["month"] > LAST_TRAIN_MONTH)
graded = (tg["fold"] == 0) & (tg["month"] > LAST_TRAIN_MONTH)
tg.loc[train | evaluation, ["client", "month", *TARGETS]].to_csv("data/targets.csv.gz", index=False)
tg.loc[graded, ["client", "month"]].to_csv("data/holdout.csv", index=False)
tg.loc[graded, TARGETS].to_csv("private/holdout_y.csv", index=False)
print("clients", len(ids), "events", len(ev), "train rows", int(train.sum()),
      "evaluation rows", int(evaluation.sum()), "graded rows", int(graded.sum()))
