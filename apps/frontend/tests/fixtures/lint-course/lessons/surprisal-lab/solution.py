# %% [markdown]
# ## Surprisal
# The surprisal of an outcome with probability $p$ is $-\log_2 p$, in bits.

# %%
import numpy as np

import distill

# %%
def surprisal(p):
    """Surprisal in bits. p: (n,) probabilities in (0, 1]. Returns (n,)."""
    # BEGIN SOLUTION
    return -np.log2(p)
    # END SOLUTION

# %%
distill.check("surprisal", surprisal)

# %%
distill.submit_review(
    "why-uniform",
    "Entropy is maximal for the uniform distribution: any concentration of "
    "mass makes some outcomes cheap to describe.",
)
