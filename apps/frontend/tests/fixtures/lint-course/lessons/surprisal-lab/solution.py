# %% [markdown]
# ## Surprisal
# The surprisal of an outcome with probability $p$ is $-\log_2 p$, in bits.

# %%
import numpy as np

import distill

distill.open_lab("lint-course/surprisal-lab")

# %%
def surprisal(p):
    """Surprisal in bits. p: (n,) probabilities in (0, 1]. Returns (n,)."""
    # BEGIN SOLUTION
    return -np.log2(p)
    # END SOLUTION

# %%
distill.check("surprisal", surprisal)

# %% [markdown]
# ## Entropy, term by term
# Entropy averages surprisal over the distribution: $H = \sum_i p_i \log_2 (1/p_i)$.
# Return the terms of that sum, not the sum itself.

# %%
def entropy_terms(p):
    # p: (n, k) rows of probabilities. Returns (n, k) contributions in bits.
    # BEGIN SOLUTION
    return -p * np.log2(p)
    # END SOLUTION

# %%
distill.check("entropy-terms", entropy_terms)

# %% [markdown]
# ## Open task: rank the held-out sources
# Each row of the held-out file is one source's distribution over four
# outcomes. Score the sources so the predictable ones rank first.

# %%
holdout = np.loadtxt("data/holdout.csv", delimiter=",")

# %%
# BEGIN SOLUTION
scores = (holdout * np.log2(holdout)).sum(axis=1)
# END SOLUTION

# %%
distill.submit_predictions("beat-baseline", scores)

# %%
distill.submit_review(
    "why-uniform",
    "Entropy is maximal for the uniform distribution: any concentration of "
    "mass makes some outcomes cheap to describe.",
)

# %%
distill.dump()
