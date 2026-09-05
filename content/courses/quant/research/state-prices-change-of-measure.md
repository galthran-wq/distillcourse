# Change of measure and state prices — research brief

Lesson: `state-prices-change-of-measure` (module: binomial-model, core, planned). NEW.
Goal: Construct the Radon–Nikodym derivative between the actual and risk-neutral measures and express prices as expectations under either.

## Sources
- Shreve I §3.1: Theorem 3.1.1 (change of measure on the tree, $Z(\omega) = \tilde P(\omega)/P(\omega)$, $E[Z] = 1$, $\tilde E[Y] = E[ZY]$), Definition 3.1.3 (state-price density $\zeta$). §3.2: Theorem 3.2.1/3.2.7 (the Radon–Nikodym derivative PROCESS $Z_n = E_n[Z]$, martingale property, the conditional-expectation translation lemma $\tilde E_n[Y] = \frac{1}{Z_n}E_n[ZY]$), Fig 3.2.1 (Z evolving along the tree).
- Baxter & Rennie §3.4 (discrete part): the Radon–Nikodym derivative on a tree via likelihood ratios on paths — the "re-weight paths, never rewrite them" framing.
- Shreve II §1.6 for the forward pointer only: Theorem 1.6.1 and the recentering-a-normal Example 1.6.6 belong to module 6's girsanov lesson; here cite as "the same construction, continuous".
- SKIP Shreve I §3.3 (CAPM/utility maximization) — off the spine; one Notes line at most.

## Key points
1. The object: on the finite tree, $Z(\omega) = \tilde P(\omega)/P(\omega)$ computed explicitly — for the standard tree with $p = \tfrac23$ vs $\tilde p = \tfrac12$, per-path values $(\tilde p/p)^{\#H}(\tilde q/q)^{\#T}$. Equivalence = same impossible events; why $p \in (0,1)$ and the admissibility inequalities guarantee it.
2. Translation identities proved in full (finite sums): $\tilde E[Y] = E[ZY]$; conditionally, $\tilde E_n[Y] = Z_n^{-1}E_n[Z Y]$. The lesson's mechanical core.
3. The process $Z_n = E_n[Z]$: a $P$-martingale (tower, one line), multiplicative along the tree (each step multiplies by $\tilde p/p$ or $\tilde q/q$) — the discrete exponential martingale; module 6's $Z(t) = e^{-\theta W - \theta^2 t/2}$ named as its limit shape.
4. State-price density $\zeta_n = Z_n/(1+r)^n$: two accountings of one price — $V_0 = \tilde E[(1+r)^{-N}V_N] = E[\zeta_N V_N]$. Read $\zeta_N(\omega)$ economically: the price today of one dollar in leaf $\omega$; with $p > \tilde p$, down-paths carry $\zeta > $ their discounted probability — dollars in bad states cost more. This is the single place the course touches economics; keep it one section, quantitative.
5. Why this lesson exists (the seam, stated): module 6's Girsanov theorem is exactly this construction with Gaussian likelihood ratios; every formula here has a continuous twin, and the discrete proofs are the honest half of that pair.

## Set pieces & gems
- The complete $Z$-tree for $N=3$, $p=\tfrac23 \to \tilde p = \tfrac12$: all eight leaf values, the $Z_n$ process at every node, martingale property checked numerically (Shreve Fig 3.2.1's idea with our running numbers).
- The two-accountings computation: price the $K=5$ call once as $\tilde E[\cdot]$ and once as $E[\zeta_3 V_3]$ with $p = \tfrac23$ — same 1.20-lineage number, different bookkeeping; a table with both columns.
- The "insurance is expensive" reading: rank leaves by $S_3$ and tabulate $\zeta_3$ vs discounted actual probability — the crash leaf costs ~2× its probability; foreshadows module 8's variance risk premium (one forward sentence).

## Pitfalls
- Do not let the economics take over: state-price density gets numbers and one interpretation paragraph, not a welfare theory.
- $Z$ depends on BOTH measures; students conflate "the" Radon–Nikodym derivative with the risk-neutral measure itself. Near-miss slot: a $Z' \ge 0$ with $E[Z'] = 1$ that fails equivalence (zero on a possible path) defines a measure that admits arbitrage pricing errors — name the violated clause.
- Radon–Nikodym as a THEOREM (existence in general) is fenced: on finite spaces the construction is the proof; the general statement (Vol II Thm 1.6.7) is cited for module 4's fence.
- Keep $r$ constant; forward measures/numeraire changes are out of scope (anti-sprawl) — one Notes line that the machinery generalizes.

## FIGURE PLAN
- draw: The $Z$-tree — the standard 3-period tree annotated with $Z_n$ at every node, edge labels $\tilde p/p$, $\tilde q/q$; leaf column shows $Z_3$ against path probabilities. Inspired by Shreve Fig 3.2.1.
- draw: Re-weighting, not rewriting — the eight paths as bars whose heights change from $P$-weights to $\tilde P$-weights ($Z$ = the ratio printed on each bar); the paths themselves identical. FigureSequence (2 frames: before/after). Inspired by B&R §3.4.
- draw: The translation identity dissected — $\tilde E[Y] = E[ZY]$ with underbraces ("average under new weights" = "average of re-weighted variable under old weights"), the 8-term sums written out for a small $Y$. Voita rule 7.
- draw: State-price bar chart — leaves ordered by $S_3$; paired bars: discounted probability vs $\zeta_3 \cdot P(\omega)$-normalized price of a state-dollar; the down-leaf excess shaded. Original.
- draw: Discrete-to-continuous preview — the multiplicative $Z_n$ ladder beside the curve $e^{-\theta W(t) - \theta^2 t/2}$, matched shapes, captioned "module 6 takes the limit". Original.

## EXERCISE PLAN
1. Warm-up: with $p = 0.6$, $\tilde p = 0.5$, $N = 2$: compute $Z$ on all four paths, verify $E[Z] = 1$, and price a claim both ways.
2. Derivation skipped: prove the conditional translation lemma $\tilde E_n[Y] = Z_n^{-1}E_n[ZY]$ from the definitions (Shreve's Lemma 3.2.6 reconstructed for the finite tree).
3. Boundary probe: let $\tilde p \to 1$ with $p$ fixed. Which paths' $Z$ blow up, which collapse to zero, where does equivalence fail in the limit, and what does the state-price of the all-tails leaf do?
4. Claim to refute: "since $E[Z] = 1$ and $Z > 0$, $Z_n$ is bounded by 1 somewhere on every path." Refute with the computed tree (paths where $Z_n$ rises monotonically); name the property $Z_n$ actually has (martingale, so constant EXPECTATION).
5. Mixed/spaced (E3): show the discounted-stock martingale property under $\tilde P$ (last lesson) is equivalent to $\zeta_n S_n$ being a $P$-martingale — one identity, two homes.
6. Research-shaped: Shreve's Exercise-3.1-style computation — given a specific two-period market and utility-free data, find the measure $\hat P$ under which the UNDISCOUNTED stock is a martingale and show it misprices the bond; conclude why discounting picks the right martingale.
7. FORWARD (E7): compute $E_n[Z_{n+1}/Z_n \cdot Y]$ for $Y$ depending only on toss $n+1$ and observe it equals $\tilde E_n[Y]$ — a one-step measure change by a multiplicative factor. Solution: the continuous version of this per-step factor is $e^{-\theta\,dW - \frac12\theta^2 dt}$, Girsanov's kernel → Ref girsanov-theorem.

## ARC
- Inherits: the risk-neutral measure as pricing device (martingales-risk-neutral-pricing) and conditional expectation's toolkit.
- Contributes: the measure change as an OBJECT — $Z$, its martingale process, state prices — with proofs; the discrete rehearsal Girsanov will imitate.
- Hands off: the machinery rests; the module closes by cashing it on the primary source's own trade → crr-arbitrage-trade; the continuous twin waits in module 6.
- Spine step: "Chaining one-period replications backward through a tree prices every claim…" (step 2).
