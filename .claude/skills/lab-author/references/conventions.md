# Lab source conventions

Binding formats for lab lessons. The build pipeline implements exactly
this; a lab that deviates fails validate. Genre norms live in SKILL.md — this
file is the file-format contract.

## Files in a lab lesson directory

```
content/courses/<course>/lessons/<lesson>/
  lesson.mdx          # short intro: goal, what gets built, prerequisites (the page draws
                      #   the Colab button and checklist ABOVE this text: refer to them as "above")
  solution.py         # the reference solution, jupytext percent format
  challenges.yaml     # verification contract
  pyproject.toml      # the lab's deps (direct, pinned)
  uv.lock             # full transitive lock — the build/CI env, committed
  data/               # optional small data files shipped to the mirror
  private/            # optional inputs the learner must never see
```

`data/` is **published verbatim** to the public mirror, file for file. Anything
a checkpoint is graded against — held-out labels above all — goes in
`private/`, which the build copies into the run directory and into nothing
else. The natural layout for a metric lab is therefore
`data/holdout_X.csv` beside `private/holdout_y.csv`, with `labels_code`
reading the second; a labels file left in `data/` is force-pushed to a public
repository and nothing will warn you.

`lab.ipynb` is generated — never committed, never hand-written. `course.yaml`
declares the lesson (`type: lab`, `lab.checkpoints`, `lab.est_hours`); the
checkpoint id sets in `course.yaml` and `challenges.yaml` must be identical
(lint enforces).

## solution.py — jupytext percent format

Plain Python, cells delimited by percent markers, so the file both executes
top-to-bottom as a script and converts 1:1 to a notebook:

```python
# %% [markdown]
# ## Log-loss
# Plain-English statement first, then the formula:
# $$L = -\frac{1}{n}\sum_i y_i \log p_i + (1-y_i)\log(1-p_i)$$

# %%
def log_loss(w, b, X, y):
    """Log-loss. X: (n, d), y: (n,) in {0,1}. Returns a scalar."""
    # BEGIN SOLUTION
    p = 1 / (1 + np.exp(-(X @ w + b)))
    return -np.mean(y * np.log(p) + (1 - y) * np.log(1 - p))
    # END SOLUTION

# %%
distill.check("logloss", log_loss)
```

Rules:

- **Markers**: `# BEGIN SOLUTION` / `# END SOLUTION`, exact spelling, own
  lines, inside the function body. Signature and docstring stay OUTSIDE the
  markers — they are the learner's scaffold. The docstring always carries
  Args/Returns with shapes.
- The student version replaces the marked span with `# YOUR CODE HERE` (and,
  when the function would otherwise be syntactically empty, `raise
  NotImplementedError`). Write solutions so the cut version is still valid
  scaffolding: no load-bearing code between marker pairs and the `return`
  the learner is supposed to write.
- **Checkpoint declarations** are cells of their own, immediately after the
  thing they check:
  - `distill.check("<id>", fn)` — exact checkpoint; `fn` is called with the
    inputs generated from `challenges.yaml`.
  - `distill.submit_predictions("<id>", preds)` — metric checkpoint.
  - `distill.submit_review("<id>", text)` — review checkpoint; in the
    solution, `text` is a model answer the author writes (it doubles as the
    rubric sanity check and never ships to the learner).
- The first code cell imports; `import distill` is present (the build and
  the author loop inject their capture stub under that name; in the learner
  notebook the generated header installs the real client).
- Everything stochastic is seeded (`default_rng(seed)`, framework seeds set)
  — build determinism is a validate gate.
- Free-form markdown cells (`# %% [markdown]`) carry the narrative. The
  generated header cell (badge, installs, `distill.open_lab`, data wgets) is
  prepended by the build — do not write it by hand.

## challenges.yaml

```yaml
checkpoints:
  logloss:
    kind: exact
    seed: 1337
    atol: 1.0e-6
    inputs_code: |          # python; `rng` (numpy Generator) in scope;
      X = rng.normal(size=(50, 4))          # must end by assigning `inputs`
      y = (rng.random(50) > 0.5).astype(float)
      w0 = rng.normal(size=4); b0 = 0.1
      inputs = (w0, b0, X, y)
    wrong:                  # optional known-wrong variants → diagnostics
      - hint: "Lost the minus in front of the mean."
        code: |             # same signature as the solution fn
          def f(w, b, X, y):
              import numpy as np
              p = 1 / (1 + np.exp(-(X @ w + b)))
              return np.mean(y * np.log(p) + (1 - y) * np.log(1 - p))
  beat-baseline:
    kind: metric
    metric: roc_auc         # v1 set: roc_auc, accuracy, rmse
    threshold: 0.85         # build fails unless the reference beats it by ≥ 0.02
    holdout: data/holdout_X.csv
    labels_code: |          # build-time only; produces `labels` for the private artifact
      labels = np.loadtxt("private/holdout_y.csv")   # never data/
  why-not-mse:
    kind: review
    rubric: |               # private; the judge's grading contract
      Pass if the answer names non-convexity of MSE under the sigmoid OR
      vanishing gradients at saturation. ...
```

- `inputs_code` is public (ships in the manifest) — inputs are never secret,
  only expected outputs are.
- `wrong` variants are the best feedback device we have: compute what the
  canonical bug produces and name the bug. Write at least one for the
  checkpoints where a canonical bug exists.
- **Every metric reads "higher is better"**, so one comparison answers for all
  three: `rmse` is stored and compared **negated**. Its threshold is therefore
  written negative — `metric: rmse, threshold: -0.5` means "an RMSE under
  0.5 passes" — and the reference score the build prints is negative too. The
  learner is shown the error itself; the sign is the wire format, not the
  wording.
- `required` on a checkpoint lives in `course.yaml`, not here, and defaults to
  `true` for `exact` and `metric` and to `false` for `review`: an outage or a
  spent judge budget leaves a review verdict pending forever and nothing
  re-grades it, so a review gates completion only where an author writes
  `required: true` out.

## Canonicalization (shared with the server compare and the client)

Outputs → `np.asarray(dtype=float64)`, C-order. Total scalars ≤ 64: raw
value list (server compares `allclose(atol)`). Larger: quantize
`q = np.round(x / atol).astype(int64)`, digest
`sha256(shape_bytes + b"f8" + q.tobytes())`, where `shape_bytes` is
`str(array.shape).encode()` — the Python repr, `"(65,)"`. Tuples of arrays
canonicalize element-wise in order, into one digest.

An output canonicalization cannot represent is refused, not encoded: NaN or an
infinity anywhere (neither compares equal to itself), and — on the digest path
— any magnitude at or above `2**63 * atol`, where the quantized values would
saturate and every such output would share one digest. Either aborts the build
with the checkpoint named; fix the solution or widen `atol`.

The one implementation is `canonicalize` in
`apps/frontend/lib/labs/python/distill_capture.py`; the committed vectors next
to it (`canon_vectors.json`, checked by `check_canon_vectors.py`) are the
cross-implementation contract — a second implementation that does not
reproduce them byte for byte, or that encodes a case marked `"rejects": true`
instead of refusing it, will grade correct answers wrong.

## Dependencies: pyproject.toml + uv.lock + .python-version

Every lab pins its interpreter with a `.python-version` file (currently
`3.12`, Colab's CPython) next to pyproject. Without it uv picks the newest
interpreter it can find, and a too-new Python turns pinned scientific deps
into sdist builds — no wheels exist yet for that CPython, so the lab
"works" only where compilers happen to be installed (found the hard way:
numpy 2.3.1 has no cp314 wheels; the deploy image build died compiling it
from source while every compiler-equipped machine passed silently).


Each lab is a uv project: `pyproject.toml` declares the direct deps, exact-
pinned (`numpy==2.3.1`), only what the lab imports; `uv lock` produces the
committed `uv.lock`. `requires-python` is `">=3.11"` or higher — the build
driver parses `pyproject.toml` with `tomllib`, and lint refuses a lower floor.
(The `distill` client is separate and floors at 3.10, which is Colab's; the
lab's environment is the build's, not Colab's.) The lock is the
reproducibility boundary: the build
and the authoring loop execute the solution with `uv run` against it, so the
env is bit-for-bit stable across machines and time.

The generated Colab install cell gets the **direct deps at their locked
versions** (short list), not the full transitive export — Colab is a
best-effort runtime with a large preinstalled stack; exact transitive
replication there is neither achievable nor needed. If a lab breaks on a
Colab-preinstalled transitive dep, pin that dep directly in pyproject.

Heavy deps (torch) only when the lab needs them; note GPU expectations in
lesson.mdx.

## The capture module

`apps/frontend/lib/labs/python/distill_capture.py` is the capture-mode
`distill`: `check` generates inputs from `challenges.yaml`, runs the fn,
canonicalizes, records the expected output, runs `wrong` variants, prints ✓/✗;
`submit_predictions` computes the metric via `labels_code` and asserts the
threshold margin; `submit_review` records the model answer; `distill.dump()`
writes the captured data for inspection. The build copies the same file next
to the solution it executes, so the loop and the build cannot disagree.

`solution.py` must therefore end with a `distill.dump()` cell, and open with
`distill.open_lab("<course>/<lesson>")`. Both are capture-mode calls: the
build strips them from the student notebook, whose generated header opens the
session instead. It also replaces the model answer in every
`distill.submit_review(...)` with a placeholder — the answer never ships.

The generated header is **two** cells, and neither is hand-written: setup
(installs, `wget`s, `import distill`, `open_lab`) and, after it, the login
cell — `distill.login("PASTE-THE-CODE-FROM-THE-LESSON-PAGE")`, the one line a
learner edits, with the code the lesson page's "Code for the notebook" button
issues. Pairing is a separate step from setup: it is redone whenever the code
expires or the account revokes the pairing, and setup is not.
