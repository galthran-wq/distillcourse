# The scaling limit of the binomial model — research brief

Lesson: `random-walk-to-brownian-motion` (module: continuous-limit, core, planned). NEW.
Goal: Compute the scaled random walk's distribution and quadratic variation, and derive the lognormal limit of the calibrated binomial stock.

## Sources
- Shreve II §3.2 complete: 3.2.1–3.2.4 the symmetric walk (independent increments, martingale, quadratic variation $[M,M]_k = k$ computed PATH BY PATH — with the variance-vs-QV distinction made explicit), 3.2.5 the scaled walk $W^{(n)}(t) = M_{nt}/\sqrt n$, 3.2.6 the CLT computation ($P\{W^{(100)}(0.25) = 0.1\} = 0.1555$ via a binomial coefficient vs the normal density — the worked numeric gem), Fig 3.2.3 (histogram against the limiting normal — THE canonical convergence figure), 3.2.7 the binomial model's limit to geometric Brownian motion (log-normal limit theorem, the $-\tfrac12\sigma^2$ appearing in the limit's exponent).
- CRR 1979 §5: the calibration $u = e^{\sigma\sqrt{t/n}}$, $d = 1/u$, $\hat r = r^{t/n}$; matching mean/variance of $\log(S^*/S)$; the CLT argument for lognormal convergence; the alternative jump limit (one Remark only — a different scaling gives Poisson, showing the limit is a CHOICE).
- Baxter & Rennie Fig 3.4 (walks at 16/64/256/1024 steps converging visually) as figure inspiration.

## Key points
1. Why rescale this way: to keep variance at time $t$ finite and nonzero, steps must shrink as $1/\sqrt n$ when their count grows as $n$ — derive the exponent by demanding $\mathrm{Var}[W^{(n)}(t)] = t$, not by fiat. Any other exponent kills the limit (degenerate or explosive) — a boundary probe lives here.
2. The walk's three properties, each proved in two lines: independent increments; martingale; and the property that will carry the whole course — quadratic variation $[M,M]_k = k$ along EVERY path (each squared step is exactly 1). Contrast with variance: same number, utterly different origin (ensemble vs path); this distinction is the module's key idea and is invisible until stated.
3. The scaled walk inherits all three, with $[W^{(n)}, W^{(n)}](t) = t$ exactly, path by path, for every $n$ — so whatever the limit is, it arrives carrying quadratic variation $t$. The limit does not CREATE $dW\,dW = dt$; it preserves it.
4. The CLT computation in full (Shreve's §3.2.6 numbers): the binomial probability vs $N(0, 0.25)$ density × bin width — agreement to three decimals at $n = 100$. Concrete before the theorem (L4).
5. The stock's limit: CRR calibration, $\log S_T$ = sum of i.i.d. $\pm\sigma\sqrt{\Delta t}$ steps (plus the rate drift) → normal by CLT → $S_T$ lognormal; the limit's mean-correction $-\tfrac12\sigma^2 t$ computed from $\log$'s concavity (the same correction Itô's formula will re-derive — one forward sentence).

## Set pieces & gems
- Shreve's $W^{(100)}(0.25)$ computation — the lesson's central worked Example, digits shown.
- Fig 3.2.3 recreated: the histogram-with-density overlay as a house figure (computable exactly — no data needed).
- The CRR jump-limit remark (different scaling → log-Poisson): the limit is not forced by discreteness alone, but by the $\sqrt{\Delta t}$ calibration — a scope-honesty gem.
- MinuteLabs Brownian-motion simulator linked in an Aside: the physical mechanism (many small collisions) as the origin story; Einstein's 1905 atoms argument in one sentence (the linked MinutePhysics video as the reference).

## Pitfalls
- Do not claim to PROVE weak convergence of processes (functional CLT); the honest scope: convergence of marginals via CLT is shown; path-level convergence (Donsker) is named and fenced. This is the module's first fence — set the standard.
- The QV-vs-variance confusion is the documented misconception here (L13): "quadratic variation is just the variance" — refute with the asymmetric-walk example where $[M,M]_k = k$ still (each step still squares to 1) while the variance changes.
- Keep $u = e^{\sigma\sqrt{\Delta t}}$ distinct from module 2's abstract $u, d$: calibration enters HERE, for the first time; earlier lessons never needed it.
- $-\tfrac12\sigma^2$: derive, don't decree; students meet it three times (here, Itô, BS formula) — plant the cross-references.

## FIGURE PLAN
- draw: The rescaling — FigureSequence (4 frames): the same underlying coin sequence rendered at 16/64/256/1024 steps on fixed axes, jaggedness persisting while the envelope stabilizes. Inspired by B&R Fig 3.4.
- draw: QV vs variance — two panels: left, ONE path with squared increments stacking to $k$ (a staircase, deterministic); right, MANY paths' endpoint spread (the ensemble fan) with variance $k$. Same number, two measurements; color-bound labels. Original — the lesson's signature.
- draw: The $W^{(100)}(0.25)$ computation dissected — the binomial spike at 0.1 with its coefficient, the normal curve through it, the bin-width × density approximation drawn as a shaded sliver. Inspired by Shreve §3.2.6.
- draw: Histogram vs limit density — Shreve Fig 3.2.3 recreated exactly (computable): the $n=100$ distribution of $W^{(n)}(0.25)$ with $N(0,0.25)$ overlaid. Single Figure.
- draw: The calibrated tree becomes a lognormal fan — the CRR tree at small $n$ morphing into the lognormal terminal density (3 frames: tree, denser tree, density with the $-\tfrac12\sigma^2 t$ mean shift annotated). Inspired by CRR §5.

## EXERCISE PLAN
1. Warm-up: compute $P\{W^{(64)}(0.5) = 0.25\}$ by binomial count and compare against the normal approximation, Shreve-style.
2. Boundary probe: rescale with steps $1/n^{\alpha}$ for $\alpha = 1$ and $\alpha = 1/4$ (count still $n$ per unit time). Compute $\mathrm{Var}[W^{(n)}(1)]$ in each case and identify the unique $\alpha$ giving a nondegenerate limit — the $\sqrt{}$ is forced.
3. Claim to refute: "quadratic variation is a fancy name for variance." Refute with the $p = 0.7$ walk: $[M,M]_k = k$ unchanged (path fact), variance $4pq \cdot k \ne k$ (ensemble fact); name what each is measured over.
4. Derivation skipped: carry out CRR's moment matching — given target mean $\mu t$ and variance $\sigma^2 t$ for $\log(S_t/S_0)$, solve for $u, d, q$ with $d = 1/u$ and verify $q \to \tfrac12$ as $n \to \infty$.
5. Research-shaped: simulate 10,000 scaled walks at $n = 100$; measure the skewness and excess kurtosis of $W^{(n)}(1)$ and report how fast both die (compare $n = 10$) — the CLT with numbers attached.
6. FORWARD (E7): for one simulated path of $W^{(1000)}$ on $[0,1]$, compute the FIRST-order variation $\sum|W(t_{i+1}) - W(t_i)|$ at mesh $1/10, 1/100, 1/1000$. Solution: it grows like $\sqrt{n}$ without bound — the limit path has infinite length, and the next lesson proves it and builds the object anyway → Ref brownian-motion.

## ARC
- Inherits: the binomial machine and its martingale structure (module 2); the motivation — trees at 1,000 steps beg for their limit.
- Contributes: the correct scaling, the QV-vs-variance distinction, the CLT convergence with digits, and the calibrated stock's lognormal limit.
- Hands off: the limit object needs a definition of its own, and its roughness (infinite length, QV = $t$) is the next lesson's subject → brownian-motion.
- Spine step: "Refining the tree does not smooth the randomness away…" (step 4).
