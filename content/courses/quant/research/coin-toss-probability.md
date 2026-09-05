# Probability on the coin-toss space — research brief

Lesson: `coin-toss-probability` (module: binomial-model, core, planned). NEW.
Goal: Compute conditional expectations on the coin-toss space and prove their five fundamental properties.

## Sources
- Shreve I §2.1–2.3: finite probability spaces, random variables/distributions/expectations on $\Omega = \{H,T\}^N$, Definition 2.3.1 (conditional expectation by averaging over unrevealed tosses), Theorem 2.3.2 (the five fundamental properties), with the COMPLETE proofs from the Appendix ("Proof of Fundamental Properties of Conditional Expectations") — this is the module where the course proves what Vol II will only restate.
- Shreve II §2.1–2.3 for the forward-looking framing only: σ-algebras as information, the general Definition 2.3.1 — cited as "the same five properties, restated for infinite spaces in module 4" (do not develop).
- Baxter & Rennie §2.3's seven boxed definitions (process, measure, filtration, claim, conditional expectation, previsible process, martingale) — use its filtration-on-a-seven-node-tree pictures as figure inspiration.

## Key points
1. $\Omega$ is finite and concrete: for $N=3$, eight sequences, each with probability $p^{\#H}q^{\#T}$. Every abstract word this course ever uses (event, random variable, measure) is a finite object here — the pedagogical contract: prove everything now, in the setting where proofs are sums.
2. Information as partial revelation: knowing the first $n$ tosses partitions $\Omega$; the filtration is the increasing sequence of partitions. Adaptedness: $X_n$ is determined by the first $n$ tosses. Tie every definition to the tree the previous lesson drew (the value at a node IS measurability).
3. Conditional expectation $E_n[X]$ DEFINED by the formula (average over unrevealed tosses with weights $p, q$), computed on a worked 3-period example before any property is stated (L4).
4. Theorem 2.3.2 proved in full, one property at a time, each with a tree-numeric check first: (i) linearity; (ii) taking out what is known; (iii) tower/iterated conditioning; (iv) independence; (v) conditional Jensen. Each proof is a finite-sum manipulation — show the sums (proof roadmap per playbook-math; mark where the argument becomes general).
5. Why the hedger cares, kept concrete: $\Delta_n$ adapted = no peeking (rehearses the Itô-integral requirement); tower = backward induction composes; taking-out-what-is-known = the wealth equation's conditional expectation collapses; Jensen = module 3's no-early-exercise proof. Forward references stated as facts, one line each.

## Set pieces & gems
- The 3-period worked computation of $E_1[S_3]$ and $E_2[S_3]$ on the standard $u=2, d=\tfrac12$ tree, with the tower identity verified numerically before it is proved.
- Conditional Jensen previewed with the concrete convex case $\phi(x) = \max(x - 5, 0)$ on the tree: $E_n[\phi(S_{n+1})] \ge \phi(E_n[S_{n+1}])$ — the exact instance module 3's Theorem 4.5.1 will run.
- B&R's device: the same seven-node tree re-annotated for each new definition — adopt as the lesson's running figure family.

## Pitfalls
- Do not say "σ-algebra" more than once; on a finite space, partitions are the honest object, and the measure-theory fence belongs to module 4. One Remark: "on infinite spaces the partition picture fails and the general definition is Vol II's Def 2.3.1 — module 4 states it, existence is proved by a theorem (Radon–Nikodym) this course cites but does not prove."
- Keep $p, q$ general (any $0<p<1$) — this lesson is about ANY measure on the tree; risk-neutral $\tilde p$ is one choice among many. The distinction is load-bearing for the change-of-measure lesson.
- The five proofs are the depth target; do not compress them to "clear by symmetry" (playbook-math bans "clearly").
- Notation ledger entry: $E_n[X]$ vs $E[X \mid \mathcal F_n]$ — one object, two notations; fix the course's ($E_n$, Shreve's).

## FIGURE PLAN
- draw: The eight-leaf tree with a filtration overlay — FigureSequence (3 frames): frame 1 no tosses revealed ($\Omega$ one block); frame 2 first toss revealed (two blocks shaded); frame 3 two tosses (four blocks); each frame lists which random variables are "known". Inspired by B&R figs 2.8–2.13.
- draw: $E_1[S_3]$ computed in place — the subtree hanging off node $H$ with the four leaf values, weights $p^2, pq, qp, q^2$ written on the paths, the weighted sum assembled beside; twin panel for node $T$. Voita rule 4 (one concrete running example).
- draw: The tower property as nested averaging — three nested boxes (average within 4-blocks → within 2-blocks → overall), arrows showing $E[E_2[X]] = E[X]$; the "average of averages" picture. Original.
- draw: Taking out what is known — $E_n[S_n \cdot Y]$ with $S_n$ rendered as a constant within each time-$n$ block (same color as the block), factoring visually out of the sum. Original.
- draw: Adapted vs anticipating — two Δ processes on the tree: one constant on information blocks (legal), one differing within a block (illegal, colored warning); caption: the illegal one knows toss $n+1$. Sets up stopping times and the Itô integral.

## EXERCISE PLAN
1. Warm-up: on the $N=3$ tree with $p = \tfrac23$, compute $E_1[S_2]$, $E_1[S_3]$, and verify the tower identity $E_1[E_2[S_3]] = E_1[S_3]$ numerically at both time-1 nodes.
2. Derivation skipped: prove property (iv) (independence: if $X$ depends only on tosses $n+1..N$, then $E_n[X] = E[X]$) from the definition, for general $N$ — the Appendix proof reconstructed.
3. Boundary probe: $n = 0$ and $n = N$ — show $E_0 = E$ and $E_N[X] = X$ fall out of the definition, and which "property" each endpoint trivializes.
4. Claim to refute: "since $E_n[S_{n+1}] > S_n$ under any $p > \tilde p$, the stock is a good deal, so the option must also be underpriced under such $p$." Locate the error using lesson 3's arbitrage plus this lesson's language: prices are $\tilde E$-objects; $E$-facts describe P&L distributions.
5. Error-diagnosis: a computed table of "$E_2[S_3]$" contains one entry violating measurability (differs within an information block); find it and explain which clause of the definition it breaks.
6. FORWARD (E7): define $M_n = E_n[X]$ for a fixed claim $X$ and prove $E_n[M_{n+1}] = M_n$ from the tower property. Solution: every conditional-expectation process is a martingale — the definition arriving one lesson early → Ref martingales-risk-neutral-pricing.

## ARC
- Inherits: the tree and the backward recursion (multiperiod-binomial) — used so far without probabilistic language.
- Contributes: the machinery — filtration, adaptedness, conditional expectation with all five properties PROVED — on the one space where proofs are finite sums.
- Hands off: with $E_n$ in hand, the backward recursion can be named for what it is: a martingale statement under $\tilde P$ → martingales-risk-neutral-pricing.
- Spine step: "Chaining one-period replications backward through a tree prices every claim…" (step 2).
