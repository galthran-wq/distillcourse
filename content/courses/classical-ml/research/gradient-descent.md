# Gradient descent and convex optimization — research brief

Lesson: `gradient-descent` (module: estimation, core, planned). KEPT SLUG — old draft at content/courses/classical-ml-interview/lessons/gradient-descent/lesson.mdx (22 min).
Goal: Explain how batch gradient descent, SGD, and Newton's method minimize training loss and when each is appropriate.

## Sources
- SSBD Ch. 12 (convexity/Lipschitz/smoothness definitions and the counterexamples showing convex+bounded alone isn't learnable — starred material), Ch. 14 (GD analysis Lemma 14.1, O(Bρ/√T) rate Thm 14.8; SGD's unbiased-gradient trick §14.5 — "learning directly on the population").
- Murphy §8.1–8.4 (condition number and zig-zag Fig 8.11–8.12; Newton Fig 8.14; step-size schedules; momentum one-liner).
- CS229 Ch. 1 (LMS/Widrow–Hoff, batch vs stochastic on the Portland housing data — the classic first contact).
- Bishop §5.2.4 (local quadratic approximation view — light).

## Key points
1. GD as repeated first-order descent: derive the update from minimizing the local linearization plus a proximal term; the learning-rate dichotomy on a 1D quadratic (η < 2/L converges; the exact threshold computed).
2. Conditioning: the elongated bowl; zig-zag geometry; why feature scaling (module 5's practice) is an optimization fact too.
3. Convexity: definition, chord picture, first-order characterization (derived); the classical losses audited for convexity (squared, logistic, hinge — a table with one-line proofs or pointers); why convexity converts local to global.
4. SGD: E[per-sample gradient] = full gradient (proved in two lines); noise vs cost trade; mini-batches; step-size decay conditions (Robbins–Monro, stated). SSBD's deeper point as a ★ section: SGD on fresh samples descends the RISK itself — optimization and generalization briefly become the same act.
5. Newton: derive the step from the quadratic model; quadratic convergence claim; O(d³) cost; one honest sentence on when it wins (moderate d, well-behaved curvature) — IRLS in module 4 is its payoff.
6. Rates stated as facts with meaning: O(1/√T) convex-Lipschitz, O(1/T) smooth, linear for strongly convex — one table, proofs deferred (★ sketch of Lemma 14.1's telescoping argument for the motivated).

## Set pieces & gems
- Murphy Fig 8.11/8.14 recreations (zig-zag; Newton's one-jump).
- CS229's housing-data LMS trace — recreate the loss-vs-iteration curve.
- SSBD Example 12.8/12.9 (convex+bounded not learnable) — mention in ★ only; full treatment belongs to no lesson (too deep), one paragraph max.

## Pitfalls
- This is a tool lesson serving the whole course: resist an optimization-theory detour; every rate stated must be read ("double the accuracy costs 4× the steps").
- Don't teach momentum/Adam — out of the classical scope; one sentence naming them as descendants.
- Newton for non-convex loss can go uphill — say it (Hessian must be PD).

## FIGURE PLAN
- draw: The 1D quadratic with three learning rates — undershoot, converge, diverge — as three trajectories on one curve; the η = 2/L threshold labeled. Single Figure.
- draw: FigureSequence (3 frames): the elongated-bowl contour with (1) GD zig-zag at large η, (2) GD at tuned η, (3) Newton's single step after the metric rescaling. One element changes per frame. Inspired by Murphy Figs 8.11/8.14 and SSBD Fig 14.1/14.3.
- draw: Convexity — chord above curve; beside it the first-order (tangent-below) characterization; one non-convex counterexample with a trapped local min. Two-panel.
- draw: The loss audit table as a figure — squared/logistic/hinge/0–1 plotted on one margin axis (0–1 non-convex, the rest convex surrogates) — foreshadows module 4's zoo; amber on the 0–1 step.
- draw: SGD noise — full-batch gradient arrow vs a fan of per-sample gradient arrows whose average is the batch arrow; trajectory comparison inset (GD smooth, SGD jittery, same destination). Inspired by SSBD Fig 14.3.

## EXERCISE PLAN
1. Warm-up: two GD steps by hand on f(w) = (w−3)² from w=0 at η = 0.25 (unfamiliar mechanics only once).
2. Boundary probe: run GD on f(w) = |w| with constant η — permanent oscillation at the kink; name the hypothesis that failed (differentiability/smoothness) and the fix the course uses later (subgradients exist; decaying η).
3. Derivation skipped: derive the exact convergence threshold η < 2/L for the 1D quadratic (the lesson asserts it; the reader proves it via the recursion |1−ηL|).
4. Claim to refute: "SGD converges to a worse optimum than GD because its gradients are wrong." Refute via unbiasedness + decaying steps; name what SGD actually trades (variance of the iterate, not asymptotic target).
5. Strategy choice (playbook-math mix): for (a) logistic regression with d=10⁶ sparse features, (b) d=20 dense clinical data, (c) non-differentiable hinge — pick GD/SGD/Newton/subgradient and defend in two sentences each.
6. FORWARD (E7): apply one Newton step to the Bernoulli log-likelihood in the natural parameter and observe it lands exactly on the MLE in one step from any start. Solution: the log-likelihood is quadratic in η's sufficient-statistic geometry — the exponential-family structure the GLM lesson names → Ref glm.

## ARC
- Inherits: the likelihood engine (mle-map) that now needs numerical solving when no closed form exists.
- Contributes: the three iterative solvers, convexity as the property that makes the classical toolkit reliable, and the rates that price accuracy.
- Hands off: with engine + solver in hand, the family portrait — every standard model as one GLM → glm.
- Spine step: "Estimation has a common engine — the likelihood — and a floor…" (step 2).

## REVISION (vs old draft)
- Gains: the derivation of GD from local linearization (old draft asserts the update); the η<2/L threshold computed; the SGD-descends-the-risk ★ section (SSBD §14.5); rate table with meanings; seams into fisher-information (curvature language now available) and out to glm.
- Loses: interview framing; "when each is appropriate" listicle becomes the strategy-choice exercise + one argued section.
- Demo: keep GradientDescentExplorer; task text changes to the find-the-divergence-threshold objective (D1).
