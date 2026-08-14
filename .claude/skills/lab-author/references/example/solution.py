# %% [markdown]
# # Example lab (toy): standardization and distances
# Minimal end-to-end demonstration of the authoring loop. Not course content.

# %%
import numpy as np
import distill

distill.open_lab("example/standardize")

# %% [markdown]
# ## Z-score
# Center, then scale: $z = (x - \bar x) / \sigma$.

# %%
def zscore(x):
    """Standardize a vector. x: (n,). Returns (n,) with mean 0, std 1."""
    # BEGIN SOLUTION
    return (x - x.mean()) / x.std()
    # END SOLUTION

# %%
distill.check("zscore", zscore)

# %% [markdown]
# ## Pairwise squared distances
# Composes the previous step: distances between standardized points.

# %%
def pairwise_sq(X):
    """All pairwise squared euclidean distances. X: (n, d). Returns (n, n)."""
    # BEGIN SOLUTION
    diff = X[:, None, :] - X[None, :, :]
    return (diff ** 2).sum(-1)
    # END SOLUTION

# %%
distill.check("pairwise", pairwise_sq)

# %% [markdown]
# ## Open task: separate the classes
# Score points by their first coordinate; AUC against hidden labels.

# %%
rng = np.random.default_rng(7)
holdout_X = rng.normal(size=(200, 3)) + np.outer(rng.integers(0, 2, 200), [2.0, 0, 0])
# BEGIN SOLUTION
preds = holdout_X[:, 0]
# END SOLUTION
distill.submit_predictions("separate", preds)

# %%
distill.submit_review(
    "why-standardize",
    "Distances mix feature scales; standardizing makes each feature contribute "
    "comparably, otherwise the largest-scale feature dominates the metric.",
)

# %%
distill.dump()
