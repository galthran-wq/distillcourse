# Risk-neutral valuation — research brief

Lesson: `risk-neutral-valuation` (module: risk-neutral-pricing, core, planned). NEW.
Goal: Derive the risk-neutral pricing formula in continuous time and obtain the Black–Scholes formula by direct integration of the lognormal payoff.

## Sources
- Shreve II §5.2.3–5.2.5: discounted portfolio value under $\tilde P$ is a martingale; the risk-neutral pricing formula (5.2.30–5.2.31); §5.2.5's derivation of BSM as a risk-neutral expected discounted payoff (5.2.36) — the lognormal integral evaluated: split at the exercise boundary, complete the square twice, $N(d_1)$ and $N(d_2)$ emerge as genuine Gaussian probabilities. This computation, EVERY step shown, is the lesson's core (the design intent's "honest math": the formula finally DERIVED, closing the verification-only IOU from module 5).
- Shreve II §6.4: Feynman–Kac (Thm 6.4.1) and discounted Feynman–Kac (Thm 6.4.3) with the recipe "find the martingale, take the differential, set the dt term to zero" — the ★ starred section connecting expectation to PDE; proof carried at Shreve's level (differentiate the conditional expectation via the Markov property — the Markov step fenced/stated).
- Hull §15.7 ("risk-neutral valuation… the single most important tool") for the framing quote-fact; §13.2's discrete twin as the recap anchor.
- Module 2's Theorem 2.4.7 (the discrete pricing formula) — the object this lesson is the limit of; Ref in the opening seam.

## Key points
1. From martingale to price, the three-line argument: discounted wealth is a $\tilde P$-martingale (Girsanov + Itô, shown); a replicating portfolio's terminal value is the payoff; so $V(t) = \tilde E[e^{-r(T-t)}V(T)\mid\mathcal F(t)]$ — module 2's Theorem 2.4.7 verbatim with $\tilde E_n \to \tilde E[\cdot|\mathcal F_t]$. (Replication's EXISTENCE is still owed — next lesson's representation theorem; say so, keep the ledger of debts explicit.)
2. The integral: $S_T = S_t\exp((r - \tfrac12\sigma^2)\tau + \sigma\sqrt\tau Z)$ under $\tilde P$; the call's expectation split at $Z > -d_2$; both Gaussian integrals evaluated with the square-completions written out; $c = SN(d_1) - Ke^{-r\tau}N(d_2)$. The anatomy claims of black-scholes-formula (N(d_2) as exercise probability, the $N(d_1)$ leg) become THEOREMS here — close the loop explicitly (C5 spiral; the formula lesson's IOU stamped paid).
3. Three derivations, one formula — the synthesis section: tree limit (module 4/CRR), PDE by hedging (module 5), expectation by measure (here); one table mapping each derivation's inputs and what each proves that the others do not (tree: constructivity; PDE: hedge; expectation: probabilistic meaning). This is the course's "risk-neutral measure as consequence" landing.
4. ★ Feynman–Kac: the conditional expectation $f(t,x) = \tilde E[e^{-r\tau}h(S_T)|S_t = x]$ satisfies the BS PDE — derived by the martingale-plus-Itô recipe; the recipe named as the general machine (find the martingale, kill the dt term); module 5's forward exercise redeemed.
5. Scope honesty: the formula prices only REPLICABLE claims so far; the pricing formula for general payoffs $h(S_T)$ is licensed by completeness — deferred one lesson, tracked in the debts ledger.

## Set pieces & gems
- The full lognormal integral — the lesson's centerpiece Example, no skipped algebra; the two square-completions as labeled steps.
- The "debts ledger" device: what is now proved / what is still owed (hedge existence, uniqueness) — the module's connective tissue and an honest-math set piece.
- Hull's "single most important tool" flagged once as the practitioner's verdict (one sentence, References-anchored).

## Pitfalls
- Do not let the integral's algebra swallow the lesson: two-thirds derivation, one-third synthesis; the synthesis (three-derivations table + debts ledger) is what makes this a spine move rather than a computation.
- The conditional-expectation-to-PDE differentiation in Feynman–Kac needs the Markov property of GBM; state it (Shreve §6.3) as a fence, don't fake the proof.
- $\tau = T - t$ notation: fix once; $d_{1,2}$ as functions of $(\tau, x)$ consistent with the formula lesson's ledger.
- Keep dividends/rates extensions out (one Remark at most).

## FIGURE PLAN
- draw: The pricing formula's pedigree — a three-branch diagram: tree limit / PDE hedge / measure expectation, all pointing at the one formula; each branch labeled with its module and what it uniquely establishes. The synthesis figure; original.
- draw: The integral staged — FigureSequence (4 frames): frame 1 the lognormal terminal density with the exercise region shaded; frame 2 the payoff split into stock leg minus strike leg over that region; frame 3 the strike leg's integral becoming $N(d_2)$ (the square-completion annotated); frame 4 the stock leg's becoming $S N(d_1)$ (the measure-tilt of the density drawn — the completed square shifting the Gaussian's center). Voita rule 7; the lesson's signature.
- draw: The debts ledger — a two-column card: PROVED (pricing formula, the closed form, PDE ⟷ expectation) / OWED (hedge existence → next lesson; uniqueness → next lesson); checkboxes. Original, reused (updated) in the next lesson.
- draw: Feynman–Kac's recipe as a loop — candidate $f$ → $e^{-rt}f(t,S_t)$ → Itô differential → set $dt$ term to zero → PDE; each arrow labeled with the tool's home lesson. Original.
- draw: $N(d_2)$ vs $N(d_1)$ made honest — the terminal density under $\tilde P$ with the exercise-probability area vs the value-weighted (tilted) density's area; the two numbers computed for the running 4.76 example. Spiral of the formula lesson's anatomy figure, now with proofs attached.

## EXERCISE PLAN
1. Warm-up: derive the price of a cash-or-nothing digital ($h = \mathbb 1_{S_T > K}$) directly from the integral: $e^{-r\tau}N(d_2)$ — one region, one completion.
2. Derivation skipped: the asset-or-nothing leg $\tilde E[e^{-r\tau}S_T\mathbb 1_{S_T>K}] = SN(d_1)$ carried out alone, with the square-completion producing the $+\sigma\sqrt\tau$ shift — the tilt made explicit; note the call = difference of the two digitals.
3. Boundary probe: evaluate the pricing expectation for $h(S_T) = S_T$ (the stock itself): the integral gives $S_t$ exactly — the formula prices the primary asset consistently; identify which property (martingale of discounted $S$) this verifies.
4. Claim to refute: "the risk-neutral pricing formula holds because the market averages investors' beliefs into $\tilde P$." Refute with the pedigree: $\tilde P$ was CONSTRUCTED from $(α, r, σ)$ by Girsanov with no investor input; the formula holds by replication + martingale; state what role beliefs retain (the P-dynamics, hence P&L distributions — module 8's territory).
5. Proof comprehension (Feynman–Kac ★): in the recipe's derivation, name the step that uses the Markov property and the step that uses the martingale property; explain why BOTH are needed.
6. Mixed/spaced (E3): price the digital on a 100-step CRR tree (module 2 machinery) and compare to $e^{-r\tau}N(d_2)$; report the sawtooth's amplitude at the digital's discontinuity vs the vanilla's (worse — and say why gamma concentration matters, Ref greeks-hedging-error).
7. FORWARD (E7): compute $\partial^2/\partial K^2$ of the derived call formula analytically and evaluate: $e^{-r\tau}\times$ the lognormal density at $K$. Solution: differentiating the price surface in strike recovers the risk-neutral DENSITY — Breeden–Litzenberger, this module's application lesson, where the same identity is run on market data → Ref implied-density.

## ARC
- Inherits: the constructed measure (girsanov-theorem); the discrete pricing formula (martingales-risk-neutral-pricing); the formula-as-verified-object (black-scholes-formula).
- Contributes: the pricing formula in continuous time, the closed form DERIVED at last, Feynman–Kac's bridge, and the three-derivations synthesis — the spine's "measure as consequence" fully landed.
- Hands off: two debts — a hedge must exist (representation) and the measure must be alone (uniqueness) → martingale-representation-ftap.
- Spine step: "Girsanov's theorem builds the continuous risk-neutral measure the tree promised…" (step 6).
