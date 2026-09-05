# Lab: binomial pricer and the exercise boundary — research brief

Lesson: `binomial-pricer-lab` (module: american-options, type: lab, planned). NEW.
Goal: Build a binomial pricer that prices European and American claims, verifies its own replicating portfolio along every path, and extracts the American put's early-exercise boundary.

## ARC
- Inherits: the lattice and backward induction (multiperiod-binomial), the wealth equation and Δ process (module 2), the American max-step and the Snell characterization (american-derivatives), the boundary as object (first-passage-perpetual-put).
- Contributes: modules 2–3 as executable code — the replication theorem verified to machine precision, the exercise boundary extracted as data rather than read off a figure.
- Hands off: the CRR-calibrated lattice ($u = e^{\sigma\sqrt{\Delta t}}$) and the convergence study land the learner at module 4's doorstep (the sawtooth converging to a continuous-limit value); the hedge engine returns, continuous, in discrete-hedging-lab.
- Spine step: "An American claim adds a choice…" (step 3, closing item).

## LAB PLAN

Artifact: one notebook building `BinomialPricer` — lattice construction, European and American backward passes, a replication verifier that walks any toss path holding the computed $(\Delta_n, \text{bond})$ and reports the maximum absolute mismatch (target: ~1e-12), a boundary extractor returning the critical stock price per date, and a convergence study against a fine-grid reference. At the end the learner has a pricer whose claims about itself (hedge exactness, boundary shape, convergence) are all measured.

CANON GROUNDING: the pencil-and-paper spine is Shreve Vol I's end-of-chapter exercises — Ch.1 §1.6 (replication and arbitrage exercises on explicit trees, incl. path-dependent variants) and Ch.4 §4.8 (American pricing/stopping exercises), the ~55-exercise apparatus the book's pedagogy section documents as its assigned work; the computational form follows CRR 1979's own worked artifacts (the §4 three-tree computation and §6's Table 3 American put with early-exercise nodes marked), which this lab reproduces as its fixed test vectors; the convergence checkpoint reproduces the Wolfram Demonstration's binomial-vs-reference study (its Details section fully specifies the CRR method and the fine-grid FinancialDerivative reference this lab's stored value replaces). 18.S096's biweekly problem sets tied to the pricing lectures (Lecture 19's replicating-portfolio derivation) are the university-course confirmation that this material is assigned as homework.
DEPARTURES: Shreve's exercises are proofs; this lab is their computational closure — each checkpoint's correctness test is a number the proofs predict (hedge mismatch 0, American ≥ European, call boundary absent). The Wolfram demo's Mathematica reference value is replaced by a private fine-lattice value computed at build time.

Datasets / inputs: none shipped — all trees are generated from parameters in-notebook. Fixed test vectors: Shreve Example 1.1.1 (1.20), CRR §4 (34.065, root Δ 0.719), CRR Table 3's American put values. The convergence reference (American put, Wolfram Snapshot-1 parameters T=3, S0=40, K=45, r=.07, σ=.3 at n=2,000 CRR steps) lives in `private/` as the metric checkpoint's target.

Checkpoints (plan; lab-author may split or deepen):
1. `stock-lattice` (exact, warm-up): the recombining lattice $S_0 u^j d^{i-j}$ as a ragged array; checked against the CRR §4 tree.
2. `european-price` (exact, warm-up): backward induction for an arbitrary terminal-payoff function; must reproduce 1.20 and 34.065. Consumes 1.
3. `replicating-portfolio` (exact): $\Delta_n$ and bond position per node, plus `walk_hedge(path)` returning the wealth-vs-claim mismatch sequence; verified = max mismatch below 1e-10 across all 8 paths of the 3-period tree. Consumes 1–2. This is Theorem 1.2.2 as an assertion.
4. `american-put` (exact): the max(intrinsic, continuation) pass; reproduces CRR Table 3 including which nodes exercise. Consumes 1–2.
5. `exercise-boundary` (exact): per-date critical stock price from the exercise flags (highest exercising node), on a 50-step CRR-calibrated put; shape must be monotone toward $K$ at expiry. Consumes 4.
6. `no-early-exercise-call` (review, required: false): run the American call on a non-dividend lattice, report zero exercise nodes, and name Theorem 4.5.1 with its three hypotheses; rubric grades the naming of hypotheses, not prose.
7. `boundary-accuracy` (metric, required: false, LAST): price the Snapshot-1 American put at n = 2,000 with CRR calibration; score = −|price − reference|; threshold calibrated by the build (≈ within 0.005). The learner discovers the sawtooth on the way (plot n = 10..100 first — the notebook asks for the plot, ungraded).

Known-wrong variants worth declaring: continuation computed without the $1/(1+r)$ discount (checkpoint 4's classic — prices too high, MORE exercise nodes); $\Delta$ from the wrong node pair ($V(HH)-V(HT)$ over $S(HH)-S(TT)$ — the module's own error-diagnosis exercise, caught by the hedge walker); $\tilde p$ with $u$ and $d$ swapped (negative probability, silent NaN downstream — hint names the admissibility inequality); intrinsic compared against DISCOUNTED intrinsic (boundary shifts one node); boundary read as the LOWEST exercising node (inverts monotonicity).

NOT blanked (ships complete): plotting helpers (lattice drawing, boundary plot, convergence plot), the path enumerator, the test-vector tables (Shreve/CRR numbers), and the fine-grid reference machinery (private). The learner writes the lattice, both backward passes, the hedge walker, and the boundary extractor — the mathematics, not the scaffolding.

est_hours: 4. Progression: warm-ups 1–2 → replication 3 → American 4 → boundary 5 → review 6 → open metric 7. Required: 1–5.
