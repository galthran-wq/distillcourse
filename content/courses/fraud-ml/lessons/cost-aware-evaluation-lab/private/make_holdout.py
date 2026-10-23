"""Regenerates the held-out week: data/holdout_week.csv + private/holdout_y.csv.

Authoring-time only, run from the lesson directory:

    uv run python private/make_holdout.py

The generator, the feature builder and the splitter are read out of
solution.py, so the held-out week is the notebook's own pipeline run on a
second seed. That seed is the secret: with it, the labels can be regenerated
from the public notebook, which is why this file lives in private/.
"""

import ast
from pathlib import Path

import numpy as np

SEED = 7_340_219
NEEDED = {"DAY", "simulate", "_window_sum", "build_features", "prequential_split"}

tree = ast.parse(Path("solution.py").read_text())
nodes = [n for n in tree.body
         if (isinstance(n, ast.FunctionDef) and n.name in NEEDED)
         or (isinstance(n, ast.Assign) and any(getattr(t, "id", None) in NEEDED for t in n.targets))]
ns: dict = {"np": np}
exec(compile(ast.Module(body=nodes, type_ignores=[]), "solution.py", "exec"), ns)

s = ns["simulate"](SEED)
X = ns["build_features"](s)
# The week a model deployed on day 84 scores: train 70-76, delay 77-83.
(_, test), = ns["prequential_split"](s["day"], s["card"], s["fraud"], 70, 1, 7, 7, 7)

header = ("amount,weekend,night,card_nb_1d,card_avg_amount_1d,card_nb_7d,card_avg_amount_7d,"
          "card_nb_30d,card_avg_amount_30d,terminal_nb_1d,terminal_risk_1d,terminal_nb_7d,"
          "terminal_risk_7d,terminal_nb_30d,terminal_risk_30d")
fmt = ["%.2f"] + ["%.4g"] * 14  # amounts to the cent, the rest to 4 significant digits
np.savetxt("data/holdout_week.csv", X[test], delimiter=",", fmt=fmt, header=header, comments="")
np.savetxt("private/holdout_y.csv", s["fraud"][test], fmt="%d")
print(f"{len(test):,} rows, {s['fraud'][test].sum()} frauds")
