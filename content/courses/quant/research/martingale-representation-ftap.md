# Martingale representation and the fundamental theorems — research brief

Lesson: `martingale-representation-ftap` (module: risk-neutral-pricing, core, planned). NEW.
Goal: Explain how martingale representation guarantees a hedge exists and state the two fundamental theorems of asset pricing with their completeness taxonomy.

## Sources
- Shreve II §5.3: Theorem 5.3.1 (martingale representation, one BM — STATED, proof fenced with citation), Corollary 5.3.2, §5.3.2 (hedging with one stock: the hedge extracted, $\Delta(t) = \tilde\Gamma(t)/(\sigma(t)D(t)S(t))$-style, worked for the BS market).
- Shreve II §5.4: the multidimensional statements (referenced, not developed), §5.4.3 existence (First FTAP, Thm 5.4.7) with Example 5.4.4 — the explicit two-stock arbitrage when the market-price-of-risk equations are unsolvable (concrete portfolio given; the dossier's gem "why an inconsistent model is dangerous, not just abstractly disallowed"); §5.4.4 uniqueness (Second FTAP, Thm 5.4.9); the Ch.5 Summary's three-case taxonomy (no RNM / many / exactly one). Appendix C's linear-algebra completion cited as the fence for the second theorem's proof.
- Baxter & Rennie §6.6: Harrison–Pliska with sketch proofs — (i) an EMM forces any zero-cost nonneg strategy to zero value (two lines, reproduce); (ii) hedging every indicator claim forces two EMMs to agree (reproduce the sketch — it is within reach and is the uniqueness intuition).
- Module 2's binomial representation theorem (B&R §2.3, taught in martingales-risk-neutral-pricing) — the discrete twin; Ref as the already-proved case.

## Key points
1. The debt stated (L10a, from the ledger): pricing by expectation presumed a replicating portfolio. Representation pays it: every $\tilde P$-martingale of the BROWNIAN filtration is $M(0) + \int\Gamma\,d\tilde W$. Define $V(t)$ by the pricing formula, discount, it is a martingale, represent it, divide by the stock's volatility term — the hedge $\Delta(t)$ in closed form. Worked for the BS market in full (§5.3.2's computation).
2. The filtration hypothesis is the content: the martingale must be adapted to the BROWNIAN filtration (no extra randomness); a market with a second noise source (a jump, an independent vol driver) breaks the hypothesis and the hedge with it. One paragraph, precise — this sentence is module 7's stochastic-vol tension in embryo.
3. First FTAP: RN measure exists ⟹ no arbitrage (the supermartingale argument, reproduce B&R's two-line sketch — it is the module-2 proof again); converse stated. Example 5.4.4 worked in numbers: two stocks, one BM, market-price-of-risk equations inconsistent ⟹ the explicit arbitrage portfolio — the theorem's teeth.
4. Second FTAP: uniqueness ⟺ completeness; B&R's uniqueness sketch (indicator claims pin the measure). The three-case taxonomy as the module's summary table: no solution (arbitrage — the model is broken), many solutions (incomplete — prices not unique, hedges don't exist for all claims), unique (complete — this course's market).
5. The scoreboard closed: the discrete course proved all of this on the tree (existence by construction, uniqueness by two-state spanning — CRR's necessity theorem was the second FTAP in miniature); the continuous statements are the same theorems with fences where the analysis got hard. One honest table: statement / discrete proof (done) / continuous proof (done, sketched, or cited).

## Set pieces & gems
- Example 5.4.4's explicit arbitrage — mispriced-model money, in numbers.
- The B&R Harrison–Pliska sketches — both within the course's proof budget; the uniqueness one ("hedge every indicator ⟹ measures agree") is genuinely elegant.
- The three-case taxonomy table — the module's takeaway card.
- The "filtration hypothesis is the content" paragraph — where completeness quietly lives.

## Pitfalls
- MRT's proof is genuinely hard (Itô representation via density arguments); fence with citation (Shreve cites Karatzas–Shreve); do NOT reproduce a fake proof.
- Completeness here is model-completeness (one BM, one stock); do not slide into claims about real markets — real markets' incompleteness is exactly module 7–8's terrain (one forward sentence).
- Keep the multidimensional case to a Remark (the volatility MATRIX invertibility condition, stated once) — anti-sprawl.
- "No arbitrage ⟹ EMM exists" in continuous time requires care (admissibility, NFLVR); state the caveat in one sentence with the Delbaen–Schachermayer name, fenced — the honest version of a statement usually oversold.

## FIGURE PLAN
- draw: The hedge extracted — pipeline figure: claim $\to$ pricing formula $\to$ discounted martingale $\to$ representation integrand $\Gamma$ $\to$ $\Delta = \Gamma/(\sigma S \cdot D)$; each arrow labeled by its theorem; the BS-market instance computed underneath. Voita rule 3 (numbered stages). The lesson's signature.
- draw: The filtration hypothesis — two markets: one noise source (every claim's martingale representable — hedgeable, shaded fully) vs two noise sources with one traded asset (a claim's randomness sticking out of the span, unhedged residual marked). Original; echoes module 1's two-state/three-state spanning figure (C5 spiral — same geometry, new depth; caption says so).
- draw: Example 5.4.4 — the two stocks' (σ, excess-return) points off a common ray; the arbitrage portfolio's weights annotated; P&L arrow guaranteed positive. Spiral of girsanov's market-price-of-risk figure.
- draw: The taxonomy — three-panel card: 0 measures (arbitrage: broken model), many (incomplete: price intervals — drawn as a band), 1 (complete: a point); each panel names its FTAP direction. Original.
- draw: The scoreboard — the honest table: seven statements × (discrete: proved in lesson X / continuous: proved | sketched | cited); the course's promise kept, visualized. Original.

## EXERCISE PLAN
1. Warm-up: in the BS market, take the digital claim's price process (from risk-neutral-valuation's exercise) and extract its $\Delta(t)$ via the representation recipe; verify it matches $\partial/\partial S$ of the digital's price.
2. Derivation skipped: reproduce B&R's Harrison–Pliska sketch (i) in full: an EMM makes every admissible zero-cost strategy's discounted value a martingale ⟹ no arbitrage; identify where admissibility (no doubling) is used.
3. Boundary probe: two stocks driven by the SAME BM with proportional coefficients (σ₂ = 2σ₁, α₂ - r = 2(α₁ - r)): show the market-price-of-risk equations are consistent, the second stock is redundant (replicate it from the first), and the measure stays unique — redundancy ≠ incompleteness.
4. Claim to refute: "adding more tradable assets can only help, so a two-stock one-BM market is 'more complete' than one-stock." Refute via Example 5.4.4: an INCONSISTENT extra asset creates arbitrage (0 measures), and a consistent one is redundant; the count that matters is noises vs independent assets.
5. Mixed/spaced (E3): restate CRR's two-state-necessity theorem (module 1) as the discrete Second FTAP: two states + two assets ⟹ unique $\tilde p$ ⟹ complete; three states ⟹ a one-parameter family of measures — exhibit the family for a specific trinomial branch and the interval of no-arbitrage call prices it generates.
6. Research-shaped: for the trinomial branch above, compute the price INTERVAL for a call (sup/inf over the measure family) numerically and the super-replication cost; observe they coincide — the incomplete market's honest quote is a spread.
7. FORWARD (E7): in the incomplete trinomial market, note every measure in the family prices the STOCK and BOND identically but the call differently; ask which single extra quoted instrument would collapse the family to one measure — and observe the market's answer in practice is quoted option prices themselves. Solution: reading the measure OFF quoted options is exactly the next lesson's extraction → Ref implied-density.

## ARC
- Inherits: the pricing formula and its two open debts (risk-neutral-valuation); the discrete representation theorem and CRR's necessity result (modules 1–2).
- Contributes: both debts paid at the statement level with honest fences — hedges exist (representation), the measure is alone (uniqueness ⟺ completeness), and the taxonomy that organizes every model the course meets from here.
- Hands off: the measure is not only a theorem but an observable — extract it from market prices → implied-density; compute with it → monte-carlo-pricing.
- Spine step: "Girsanov's theorem builds the continuous risk-neutral measure the tree promised…" (step 6).
