# The hedging argument and the Black–Scholes PDE — research brief

Lesson: `black-scholes-pde` (module: black-scholes, core, planned). NEW.
Goal: Derive the Black–Scholes PDE by matching the evolution of a self-financing hedge against the option's Itô expansion.

## Sources
- Shreve II §4.5.1–4.5.3: the complete derivation — portfolio evolution $dX = \Delta dS + r(X - \Delta S)dt$ (eq 4.5.2), the option value's Itô expansion, equating discounted evolutions term by term: $dW$ terms ⟹ $\Delta(t) = c_x(t, S(t))$ (eq 4.5.11), $dt$ terms ⟹ the PDE $c_t + rxc_x + \tfrac12\sigma^2x^2c_{xx} = rc$ (eq 4.5.14); terminal/boundary conditions (4.5.19–4.5.20). The dossier calls §4.5.1–4.5.3 "the hedging argument… worked completely with no shortcuts" — that is the lesson's body.
- Black & Scholes 1973: the seven ideal conditions (p.640) — list them verbatim-adjacent as the model's contract; the $15/$20 hedge illustration (p.641: hedge equity falls from \$5.00 to \$4.25 on EITHER \$5 move — convexity slippage motivating continuous rebalancing); the historical framing (prior formulas' unmeasurable parameters, pp.639–641). Original-page figure available for the formula lesson; here use the worked numbers.
- Merton 1973 §6: the alternative derivation's existence noted in one Notes line (stochastic rates generalization — out of scope).
- Baxter & Rennie §3.8 (terminal-value/PDE rederivation) as secondary; 18.S096 Lecture 24's "Itô's lemma under the microscope" (two-time-scale story) — optional inspiration for a Remark on why full risk elimination needs $dt/dt' \to \infty$.

## Key points
1. The inheritance stated up front: the wealth equation is module 2's, verbatim, with $(1+r)$ → $r\,dt$; the derivation is the one-period argument run in the limit the stop-loss lesson showed is mandatory. Two sentences of L10a placement.
2. Setup: GBM stock, constant $r$, a candidate value function $c(t,x)$ assumed smooth (assumption flagged; verified when the solution is exhibited). The seven BS ideal conditions listed and NUMBERED — the course refers back to them by number when each is later relaxed or broken (the smile module breaks #2's constant σ).
3. The derivation carried in full with the discounting trick Shreve uses: compute $d(e^{-rt}X)$ and $d(e^{-rt}c)$, set them equal; the $dW$ match gives the delta rule (the ramp the stop-loss forward exercise met); the $dt$ match gives the PDE. Every Itô step shown (product rule from module 4's exercise — Ref).
4. What the PDE says, read term by term: $\Theta + rS\Delta + \tfrac12\sigma^2S^2\Gamma = rc$ before the Greeks have names (they get named next lesson — plant it); $\mu$ absent — the drift died with the $dW$ term, which IS the "price is not an opinion" mechanism in continuous time.
5. The solution exhibited (the formula, stated) and VERIFIED against the PDE + terminal condition by differentiation — the honest division of labor announced: this lesson verifies; the risk-neutral module DERIVES the formula by integration (5.2.5); the tree limit already approximated it. Boundary behavior: $c(t,0) = 0$, $c \sim x - Ke^{-r(T-t)}$ as $x \to \infty$.
6. The 1973 hedge-slippage example as the closing Example: at the published hedge ratio 1/2, both a \$5 up and a \$5 down move cost the hedged position \$0.75 — second-order loss, gamma unnamed; rebalancing frequency is what keeps it $O(\Delta t)$.

## Set pieces & gems
- The seven ideal conditions as a numbered contract box — the course's later modules cite the numbers.
- The BS 1973 $15/$20 worked slippage — primary-source arithmetic showing convexity before the formalism.
- The two-column derivation (portfolio column vs option column, matched line by line) — the argument's shape as its layout.
- 18.S096's "complete risk elimination requires $dt/dt' \to \infty$" as a ★ Remark for the discretely-hedged reality (bridges to greeks-hedging-error).

## Pitfalls
- Do not "solve" the PDE by heat-equation transformation here — that machinery buys nothing this course needs (the integral derivation in module 6 is cleaner and honest); state the choice explicitly in a Remark so the reader knows it is deliberate, with the substitution cited (BS 1973's own route via Churchill).
- The smoothness assumption on $c$ is real; flag it and note verification closes the loop.
- Self-financing in continuous time is DEFINED by the wealth SDE (not derived); say so — the discrete lesson had it as a theorem-adjacent bookkeeping fact, the continuous version is a modeling postulate matching it.
- σ constant, r constant: keep every later-relaxed assumption visibly on the contract list rather than silently used.

## FIGURE PLAN
- draw: The two-column derivation — left column $d(e^{-rt}X)$ expanded, right column $d(e^{-rt}c)$ expanded; the $dW$ rows connected (⟹ $\Delta = c_x$, shown as the ramp from the stop-loss lesson's forward exercise), the $dt$ rows connected (⟹ the PDE). FigureSequence (3 frames: expand, match $dW$, match $dt$). The lesson's signature.
- draw: The seven ideal conditions as a numbered contract card — one line each, with forward-pointers ("#2 constant σ — broken in module 7") as small badges. Original.
- draw: The 1973 slippage — the option value curve with tangent at $S = 15$; the \$5 up/down moves landing ON the curve but off the tangent, both gaps = \$0.75, shaded. Inspired by BS 1973 p.641's numbers (and Fig 4.5.1's geometry).
- draw: The PDE read as a cash-flow balance — each term boxed with its meaning (time decay / funding of the stock leg / convexity earnings / interest on the book), arrows into a zero-sum ledger. Voita rule 7.
- draw: Boundary conditions panel — the $(t, x)$ strip with the terminal payoff drawn at $t = T$, the two spatial boundaries annotated; the solution surface hinted as a mesh. Original.

## EXERCISE PLAN
1. Warm-up: verify by direct differentiation that $c(t,x) = x$ and $c(t,x) = e^{rt}$... solve the PDE trivially (the stock and the money market are solutions) — and say why the terminal condition is what selects the call.
2. Derivation skipped: run the same term-matching derivation for a dividend-paying stock ($dS = (\alpha - q)S\,dt$-adjusted wealth equation... continuous yield $q$) and obtain the modified PDE $c_t + (r - q)xc_x + \tfrac12\sigma^2x^2c_{xx} = rc$.
3. Boundary probe: $\sigma \to 0$: the PDE becomes first-order; solve it by characteristics for the call and check the answer is the forward-intrinsic bound of module 1 — the model's degenerate edge lands exactly on the model-free bound.
4. Claim to refute: "the derivation assumed the hedger knows $\mu$; a wrong $\mu$ estimate breaks the hedge." Refute by inspection: $\mu$ cancels in the $dW$ matching before the PDE forms; state precisely which inputs the hedge DOES need (σ, r — and flag σ's own fragility toward module 7).
5. Proof comprehension: name the exact step where self-financing is used, and where smoothness of $c$ is used; exhibit what goes wrong at $t = T$ for the call's kink (why the PDE holds for $t < T$ only).
6. Mixed/spaced (E3): re-derive the one-period binomial's $\Delta = \frac{V_u - V_d}{S_u - S_d}$ as the discrete difference quotient of $c_x$ and check numerically (50-step tree vs $c_x$) that the tree's root delta converges to $N(d_1)$-like values.
7. FORWARD (E7): take the PDE, substitute $c(t,x) = e^{-r(T-t)}u(t,x)$ and compute the PDE $u$ satisfies; note $u$'s equation says "expected growth at rate $r$, no discounting" — the expectation reading. Solution: $u(t,x) = \tilde E[\text{payoff} \mid S_t = x]$ — the statement made exact by Feynman–Kac in module 6 → Ref risk-neutral-valuation.

## ARC
- Inherits: the Itô toolkit (ito-formula), the second-order verdict (stop-loss-paradox), the wealth equation (multiperiod-binomial).
- Contributes: the continuous hedging argument in full: the delta rule, the PDE, the drift's disappearance, the model's numbered contract.
- Hands off: the PDE's solution as an object — the formula, its anatomy, its Greeks → black-scholes-formula.
- Spine step: "The one-period hedging argument survives the limit intact…" (step 5).
