# Bounds and parity in a real option chain — research brief

Lesson: `option-chain-bounds` (module: arbitrage, core, planned). NEW. MODULE 1 APPLICATION (L16).
Goal: Test no-arbitrage bounds and put–call parity on a real exchange option chain and interpret the deviations.

## Sources
- Hull Ch.1 §1.5: Tables 1.2–1.3, the real CBOE GOOG chain of May 8, 2013 ($S_0 = 871.30$; June/Sep/Dec expiries, six strikes, bid/offer both sides) — the dataset of record for this lesson; the two profit diagrams of Fig 1.3 (long Dec 880 call at 56.30, short Sep 840 put at 31.00).
- Hull Ch.10 §10.1–10.5: option market mechanics needed to read the table — contract size (100 shares), expiration conventions, strike ladders, bid/offer, the OCC. Only what the reading requires (L11: every term anchored at first use).
- Hull Ch.11 §11.4: parity with dividends; §11.3 bounds — the relations under test.
- Merton 1973 §4 (parity is exact only for European; GOOG options are American — the deviation has a theory).

## Key points
1. How to read a chain, taught on the artifact itself: strike ladder rows, calls left / puts right, bid < offer, mid as the working price, June/Sep/Dec expiry columns. Three vocabulary items max per section (L11c).
2. Bounds checked wholesale: every quoted call mid vs $\max(0, S_0 - Ke^{-rT})$ and $S_0$; every put vs its bounds. Result to establish: zero violations at mid — the module's theorems hold in the wild before any model of dynamics is trusted.
3. Parity per strike/expiry: compute $c - p - S_0 + Ke^{-rT}$; it is NOT zero. Decompose the deviation: (a) dividends (GOOG paid none in 2013 — one confounder removed by fact, say so), (b) the American premium on the puts (Merton Thm 13 — parity's European hypothesis genuinely fails here), (c) bid–ask width. Show deviations sit inside the no-arbitrage band $[S_0 - K, S_0 - Ke^{-rT}]$ for American options.
4. The implied quantities: run parity backwards to extract the implied forward and implied financing rate per expiry; compare across expiries — the chain contains its own term structure. This move is rehearsed here and becomes a lab checkpoint in module 7 (`forward-from-parity`).
5. Where the idealisation departs (L16 requirement, stated as a section): frictionless trading → bid–ask spreads that eat the "arbitrage"; European exercise → American quotes; a single borrowing/lending rate → a financing spread. Each departure measured on the chain, not just named.

## Set pieces & gems
- The GOOG chain itself as the lesson's centerpiece (source image below) — the reader works ON the artifact.
- Hull's Fig 1.3 pair (buy the Dec 880 call / write the Sep 840 put) recomputed as worked examples of reading premium, breakeven, and assignment obligation off the chain.
- The bid–ask-eats-the-arbitrage computation: pick the strike with the largest mid-price parity deviation and show the round-trip at bid/offer loses money — "the arbitrage is real but not collectible".

## Pitfalls
- Use MID prices for all theory checks and BID/OFFER for all executability checks; never mix silently.
- $r$ for May 2013: use ~0.25% T-bill; results are insensitive — say so rather than fussing.
- Do not claim American parity is violated arbitrage — it is parity's hypothesis that fails; the inequality version holds. This is the lesson's refutation slot (L13: "parity failed, the market is inefficient" is the documented misreading).
- Keep this lesson computational-descriptive; no Greeks, no vol — those are later modules.

## APPLICATION spec (L16)
- Artifact: the real CBOE GOOG option chain of May 8, 2013 (Hull Tables 1.2–1.3), read end to end.
- Module results used: dominance bounds (static-bounds-parity), put–call parity, the forward-replication logic (expectation-vs-arbitrage) run backwards to imply financing rates, the American/European distinction.
- Departures from idealisation: bid–ask spreads, American exercise, discrete strikes/expiries, financing spread — each quantified on the chain.

## FIGURE PLAN
- source: optionsfutur-s1-google-option-quotes — Hull's Tables 1.2–1.3, the genuine dated CBOE quotes; save as `goog-chain-2013`; the reader must be able to read strikes, expiries, and both bid and offer for calls and puts; placement: centered at the top of the reading section — it is the lesson's dataset.
- draw: Anatomy of one chain row — a magnified single row (strike 880) with callouts naming every number (bid, offer, mid, expiry, contract multiplier) and the two option positions it quotes. Single Figure.
- draw: Bounds scatter — call mids vs strike for one expiry plotted between the lower bound and $S_0$; the corridor shaded (reuse of the module's corridor figure, now with real dots inside it). Inspired by the static-bounds figure, spiral per C5.
- draw: Parity residuals — bar chart of $c - p - S_0 + Ke^{-rT}$ per strike for two expiries, with the bid–ask half-width overlaid as a band; bars inside the band read "not collectible". Original.
- draw: The implied forward per expiry — three dots with the $S_0 e^{rT}$ line through them; the deviation labeled with the American-put premium arrow. Original.

## EXERCISE PLAN
1. Warm-up: from the chain, write the exact cash flows of buying one Dec 880 call contract at the offer and the two terminal scenarios of Hull Fig 1.3 — reproduce the breakeven 936.30.
2. Research-shaped (required by the lesson's genre): compute the parity residual for all six strikes of the September expiry; identify the strike where it is largest and test executability at bid/offer. State what would count as a genuine violation.
3. Claim to refute: "the September 840 line violates parity by \$2.10, so the market is leaving money on the table." Refute using the American-put premium and the round-trip at quoted prices; name the failed hypothesis (European exercise) rather than the failed market.
4. Boundary probe: deep-in-the-money calls — find the strike where the call mid sits closest to its lower bound and explain which bound becomes tight as $K \to 0$ and why time value vanishes there.
5. Mixed/spaced (E3): using lesson 3's machinery, treat the nearest expiry's 870/880 strikes as an effective two-state model: back out the $u, d$ the quotes imply and check $0 < d < 1+r < u$.
6. FORWARD (E7): for the December expiry, plot the call mid against strike and estimate the second difference $\frac{C(K+h) - 2C(K) + C(K-h)}{h^2}$ at three interior strikes; note all three are positive. Solution: positive second differences are the butterfly no-arbitrage condition, and $e^{rT}$ times this quantity is a probability density the course extracts in module 6 → Ref implied-density.

## ARC
- Inherits: the full module — arbitrage, bounds, parity, the one-period price.
- Contributes: the module's theorems held against a dated market artifact; the friction inventory that separates theorem from trade.
- Hands off: the chain prices many strikes at once — a fact that returns with force in module 7; next module scales replication from one period to many.
- Spine step: "A derivative's price is enforced, not estimated…" (step 1, closing item).
