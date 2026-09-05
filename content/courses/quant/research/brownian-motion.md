# Brownian motion and quadratic variation — research brief

Lesson: `brownian-motion` (module: continuous-limit, core, planned). NEW.
Goal: State the definition of Brownian motion, prove its martingale property and quadratic variation, and mark precisely which foundations are assumed unproved.

## Sources
- Shreve II §3.3: Definition 3.3.1 (independent, stationary, normal increments; continuous paths), the distribution, the Brownian filtration (3.3.3), Theorem 3.3.4 (martingale property — prove in full, it is two lines given independence).
- Shreve II §3.4: 3.4.1 first-order variation (infinite for BM — the MVT contrast with smooth functions, Figs 3.4.1–3.4.3), Theorem 3.4.3 ($[W,W](T) = T$ a.s. — carry the $L^2$ proof: expected value $T$, variance $\to 0$ by the fourth-moment computation), Remarks 3.4.4–3.4.5 (the $dW\,dW = dt$ heuristic DISSECTED: two tempting formalizations rejected before the correct one — the reader summary calls this "an unusually honest pedagogical moment"; reproduce its structure), 3.4.3 volatility of GBM via QV.
- Shreve II §1.1–1.3 and §2.1–2.3, used ONLY to write the fence: what "almost surely" means, that expectation is now a Lebesgue integral, that general conditional expectation is Definition 2.3.1 with the same five properties (proved in module 2's finite setting, existence by Radon–Nikodym cited to Appendix B), and the St. Petersburg example (finite a.s. yet infinite expectation) as the one demonstration of why the machinery exists.
- Baxter & Rennie Figs 3.7–3.8 (zoom into smooth curve vs BM) — the demo's blueprint; Fig 3.1/3.2 (FTA index vs simulated BM) — the model-plausibility artifact (source image available).
- MinuteLabs (linked aside, carried from last lesson if not already used).

## Key points
1. The definition, stated formal-first (every term now familiar from the walk — the L4 exception applies): continuity, $W(0) = 0$, independent stationary $N(0, t-s)$ increments. Existence is a THEOREM (Wiener), fenced: this course states it; the construction lives in Vol II's citations.
2. The fence, as a section, early: what changes off the finite tree — "almost surely" defined, events of probability zero now abundant (any single path has probability 0), expectation as integral, conditional expectation now DEFINED by its properties (partial-averaging) with existence cited. One table: which module-2 facts carry over verbatim (all five properties), which get restated (definitions), which are new debts (existence theorems). This is the design intent's "fenced off, never faked" executed literally.
3. Martingale property proved. Then the two variations: first-order variation infinite (proof sketch honest: $\sum |W(t_{i+1}) - W(t_i)| \ge [W,W]/\max|\Delta W| \to \infty$ given QV > 0 and continuity); Theorem 3.4.3's $L^2$ proof in full — $E[\text{sampled QV}] = T$ exactly, variance bounded by $2T \cdot \max(t_{i+1} - t_i) \to 0$.
4. The $dW\,dW = dt$ discussion at Shreve's own standard: reject "each squared increment is close to $dt$" (it is not — it is exponentially distributed around it), reject the pathwise-ratio reading; keep the correct statement (sums of squared increments converge in $L^2$ to $T$, mesh-uniformly). Also: $dW\,dt = 0$, $dt\,dt = 0$ with the one-line size arguments.
5. Nowhere differentiability stated (fenced, with the QV heuristic: a differentiable patch would contribute zero QV); self-similarity — zooming never smooths (the demo's task); GBM's realized volatility read from QV over a window: $\frac{1}{T}[\log S, \log S](T) = \sigma^2$ — the bridge to module 8's realized-vol estimators, one sentence.

## Set pieces & gems
- The Remark 3.4.4–3.4.5 dissection restaged as the lesson's centerpiece Remark — the course showing its honesty standard on the most-abused notation in the field.
- The St. Petersburg r.v. (finite a.s., infinite expectation) as the single, sharp reason "a.s." and integrability need care.
- B&R's FTA-index-vs-simulated-path comparison: real market data looks Brownian locally, not globally (grows, stays positive) — the honest scope of the model before GBM fixes part of it.
- The zoom experience (Figs 3.7–3.8) — smooth curves straighten under magnification; BM does not, at any depth.

## Pitfalls
- Never write "proof" over a fenced statement; the lesson's credibility IS the fence discipline. Existence of BM, nowhere-differentiability (full proof), and general conditional-expectation existence are cited, not proved — say to WHERE (Vol II App. B; Karatzas–Shreve).
- The QV theorem's convergence is in $L^2$ along stated partitions; do not claim a.s. convergence for arbitrary partitions (false in general) — one precise caveat sentence.
- Do not let the physics aside grow: Einstein/atoms is one Aside paragraph with the MinuteLabs link.
- Notation ledger: $[W,W](T)$ vs $\langle W \rangle_T$ — pick Shreve's bracket and note the angle-bracket synonym once.

## FIGURE PLAN
- draw: The definition as a picture — one path with three increment windows shaded, each labeled $N(0, t_{i+1}-t_i)$ and marked independent; continuity flagged at a corner. Single Figure.
- draw: The fence table — a two-column figure: "proved in module 2 (finite)" vs "stated here (infinite)" — the five properties ✓ carried, existence rows marked cited; the course's honesty contract as one visual. Original.
- draw: FigureSequence (3 frames), first-order vs quadratic variation: frame 1 a smooth curve's variations (finite length, QV → 0 with mesh, MVT chords drawn); frame 2 BM's (length grows with mesh, QV pinning to $T$); frame 3 the two limit rows tabulated. Inspired by Shreve Figs 3.4.1–3.4.3.
- draw: The $L^2$ proof dissected — the sampled QV as a sum of independent $(\Delta W)^2$ blocks, each with mean $\Delta t$ and variance $2(\Delta t)^2$; the mean telescoping to $T$, the variance to $\le 2T\max\Delta t$. Voita rule 7.
- source: financialcal-fig3-1-fta-index — the real UK FTA index 1963–92 beside a simulated Brownian path; save as `fta-vs-brownian`; the reader must see the comparable local jaggedness and the global difference (growth, positivity); placement: float right beside the model-scope paragraph; credit Baxter & Rennie Fig 3.1/3.2.
- draw: Zoom grid — 2×3 panel: smooth curve at 1×/10×/100× (straightening) over BM at the same magnifications (statistically identical) — the demo's static summary for print. Inspired by B&R Figs 3.7–3.8.

## EXERCISE PLAN
1. Warm-up: compute $P(W(2) \le 1 \mid W(1) = x)$ and $E[W(2)W(3)]$ from the definition's increment structure (covariance $= \min(s,t)$ derived, not quoted).
2. Derivation skipped: prove $E[W^4(t)] = 3t^2$ (Gaussian moments) and use it to complete the variance step of Theorem 3.4.3's proof that the lesson compressed.
3. Boundary probe: apply the QV theorem to the process $X(t) = ct$ (zero QV) and to $X(t) = W(t) + ct$: show drift contributes nothing to QV — cross terms die at rate $\Delta t^{3/2}$ — so QV sees only the noise; state which later formula this licenses ($dX\,dX = \sigma^2 dt$).
4. Claim to refute: "since each $(\Delta W)^2$ has mean $\Delta t$, each squared increment is approximately $\Delta t$ for small $\Delta t$." Refute with the ratio $(\Delta W)^2/\Delta t \sim \chi^2_1$ — it never concentrates; name what actually converges (the SUM, by variance cancellation) — Shreve's own rejected formalization #1.
5. Mixed/spaced (E3): the scaled walk of last lesson has QV exactly $t$ for every $n$; BM's QV is $t$ only a.s. and in $L^2$ — write three sentences on what the limit weakened and why the finite case was stronger.
6. Research-shaped: simulate BM at $n = 10^4$ steps; compute sampled QV on meshes $10^{-1..-4}$ and tabulate convergence to $T$; then repeat with a Student-t(3) increment walk (infinite fourth moment) and report what breaks in the variance argument.
7. FORWARD (E7): compute $d(W^2)$ naively by the ordinary chain rule ($2W\,dW$), then compute $E[W^2(T)]$ both ways — the naive integral has expectation 0, the truth is $T$. Solution: the missing $+T$ is exactly the QV correction; the calculus that gets it right is next lesson's integral and the formula after it → Ref ito-integral.

## ARC
- Inherits: the scaled walk carrying QV = $t$ into the limit (random-walk-to-brownian-motion); module 2's conditional-expectation properties, about to be re-used on faith stated precisely.
- Contributes: the limit object defined; its martingale property and QV proved; the course's measure-theoretic fence erected once, explicitly, where it belongs.
- Hands off: a path of infinite length cannot be integrated against by Riemann–Stieltjes; building the integral that works anyway → ito-integral.
- Spine step: "Refining the tree does not smooth the randomness away…" (step 4).
