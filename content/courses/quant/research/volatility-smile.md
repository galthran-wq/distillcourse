# The volatility smile and surface — research brief

Lesson: `volatility-smile` (module: volatility-smile, core, planned). NEW.
Goal: Analyze the smile, skew, and term structure as measured facts and infer what they say about the market's implied distribution.

## Sources
- Hull Ch.20 in full: §20.1 (same smile for calls/puts — inherited, Ref), §20.2 (FX: the U-smile, Table 20.1's evidence that real FX tails beat lognormal — the % of moves beyond k·σ table; Business Snapshot 20.1's mid-80s traders who ate the mispricing until the market learned), §20.3 (equities: the downward skew, existing only since 1987; Business Snapshot 20.2 "Crashophobia" — Rubinstein's name and mechanism), §20.4 (moneyness/delta conventions in one Remark), §20.5 (term structure + Table 20.2's volatility surface as the calibration object), §20.7 (BS as interpolation tool — "the role of the model"), §20.8 + Table 20.3 (the anticipated-jump bimodal case: the volatility FROWN, worked numbers $50 \to 42/58$).
- Gatheral Ch.3 (the SPX surface's shape; skew flattening with maturity) and Ch.5's Table 5.1 with the 5-cent bid computed at 13.7σ (the "why jumps are needed" argument — the strongest single datum against any diffusion; the number "zero to ~40 decimal places" under a diffusion).
- implied-density's extracted fat-tailed density — the same information in density coordinates (Ref; the two lessons are one fact in two charts).
- Cont 2001 (heavy tails under P as the physical shadow — one bridge sentence; module 8 owns it).

## Key points
1. The reveal, staged: the previous lesson's forward exercise drew IV vs strike for one expiry — not flat. Now the full documentation: equity index skew (IV falling ~1 vol point per ~1% strike at short maturities), FX smile (symmetric U), the surface across (K, T) with skew flattening as $\sqrt{1/T}$-ish (stated as observation, not theory). All presented as MEASURED FACTS with real numbers, per the design intent ("the volatility smile as a measured fact").
2. The dictionary between smile and density (the module's analytical core): IV(K) flat ⟺ lognormal; both wings raised ⟺ both tails fat (FX); left wing raised ⟺ left tail fat + right thin (equities). Derived semi-quantitatively via Breeden–Litzenberger (Ref implied-density): wing IV ↑ ⟹ OTM price ↑ ⟹ more tail mass. The frown completes the dictionary: bimodal density (anticipated jump) ⟹ inverted smile — Hull Table 20.3's numbers reproduced.
3. History as evidence: no equity skew before October 1987, permanent skew after (the portfolio-insurance application's residue — Ref, C5 spiral); crashophobia named; the skew steepens when markets fall (stated).
4. The jump datum: Gatheral's 5-cent bid on a 13.7σ put — under ANY diffusion reaching that strike overnight is impossible-to-40-decimals, yet a market maker PAYS for it; conclude: the short-expiry wing prices discontinuous moves; no σ(S,t) tinkering fully absorbs it (the honest boundary the next lesson must respect).
5. What survives: the formula as bijection/quoting map (last lesson's distinction now load-bearing); the model as "sophisticated interpolation tool" (Hull §20.7) — BS demoted from physics to coordinates, and the surface promoted to the actual market object. The taxonomy of repairs named for the road ahead: local vol (next lesson — fits by construction), stochastic vol and jumps (named, fenced as beyond the course, with the completeness cost from martingale-representation-ftap cited — the second noise source breaks the hedge's existence).

## Set pieces & gems
- Hull Table 20.1's FX-tails evidence (empirical % of moves > kσ vs lognormal's prediction) — the smile's physical-measure counterpart in one table.
- Business Snapshot 20.1 — the alpha-decay story: traders who saw the fat tails before the smile priced them; the market LEARNED the smile.
- The frown (Table 20.3): a bimodal density producing IV peaking ATM at 69% and dying at the outcomes — the dictionary's stress test.
- The 5-cent bid computation — reproduce the 13.7σ arithmetic explicitly.

## Pitfalls
- Keep P and $\tilde P$ separate even while using physical-tail evidence (Table 20.1) to motivate risk-neutral smile shapes; the wedge (premia) is real and module 8's subject — one disciplined Remark.
- The smile is in IV COORDINATES; a smile is not itself an arbitrage (each point is one consistent price) — refute the documented misreading "the smile is an inconsistency traders can arbitrage" (L13): the inconsistency is with the MODEL, not within the PRICES; static-arbitrage constraints (butterfly/calendar, Ref implied-density and forward to local-volatility) are the actual tradeable lines.
- Numbers need frames: "1 vol point per 1%" with the maturity attached; the surface's units (total variance vs IV) fixed once.
- Do not open Heston/SVJ mechanics; named with one clause each (the spx-surface application shows Heston's failure empirically without needing its formulas).

## FIGURE PLAN
- draw: The reveal — one expiry's IV-vs-strike from the SPX data (the forward exercise's plot, now annotated): the skew line, ATM marked, the flat-BS line dashed for contrast. The lesson's opening figure.
- draw: The dictionary — three-row panel: density (left) ⟷ smile (right) for lognormal/flat, fat-both-tails/U-smile, fat-left/skew; the frown as a fourth row with the bimodal density. FigureSequence (4 frames, one row appearing per frame). The lesson's signature; inspired by Hull Figs 20.1–20.4 + Table 20.3.
- draw: The surface — IV over (moneyness, expiry) as a small mesh with two slices pulled out (a smile at short T, a flatter one at long T); Table 20.2's structure in house style. Single Figure.
- draw: The skew's birthday — a two-panel before/after 1987 schematic: flat-ish IV pre-crash vs skewed post- (axes and shape only, labeled as schematic of the documented record), the portfolio-insurance lesson Ref'd in the caption. Original.
- draw: The 13.7σ arithmetic — the overnight move to the 5-cent put's strike measured in σ√Δt units: the number line from 0 to 14σ with the normal tail probability annotated at 2, 5, 10, 13.7σ (1e-40 territory); the 5-cent bid stamped at the end. Original, from Gatheral Ch.5.
- draw: The repair taxonomy — three branches off "constant σ fails": σ(S,t) (deterministic — next lesson, keeps completeness), σ stochastic (second noise — hedge existence lost, Ref ftap), jumps (QV argument breaks differently); each branch with its one-line cost. Original, forward-looking.

## EXERCISE PLAN
1. Warm-up: from five (strike, IV) pairs of the September 2005 SPX expiry, compute the skew slope in vol-points per 1% moneyness and per unit of $d_2$.
2. Derivation skipped: make the dictionary quantitative in one direction — show that raising the IV at strike $K$ by δσ raises $C(K)$ by vega·δσ and hence raises the density's mass near $K$'s wing via the Breeden–Litzenberger second difference; compute the sign pattern for a raised left wing.
3. Boundary probe: reproduce Hull Table 20.3's frown — price options at 5–6 strikes off the two-point density {42, 58}, invert each for IV, and plot; confirm the peak-and-collapse shape and locate where IV is undefined (quotes outside the corridor).
4. Claim to refute: "the smile means some strikes are cheap and some expensive — buy the low-IV ones, sell the high-IV ones, and wait." Refute: each IV is a coordinate of one internally consistent price; the trade is a bet on dynamics, not an arbitrage; exhibit the static-arbitrage tests (butterfly/calendar) that WOULD be violations and check the SPX data passes them.
5. Research-shaped: reproduce the 13.7σ computation from Gatheral's chain (index level, strike 1160, ATM σ ≈ 11%, one trading day) and state the diffusion probability it implies; then compute what jump intensity (one crash per X years of size 5%+) would rationalize a 5-cent bid — order of magnitude only.
6. Mixed/spaced (E3): using implied-density's pipeline on the same expiry, verify the extracted density's fat left tail and the skew are the same fact: recompute the density from the SMILE-interpolated prices and compare tails against the raw-price extraction.
7. FORWARD (E7): take the two-expiry surface slice and ask: what single function σ(S,t) would a tree/PDE need so that short-dated options see high local vol after down-moves? Sketch the qualitative σ(S,t) shape (higher at low S). Solution: the object just sketched is the local volatility surface; Dupire's formula computes it exactly from the quotes → Ref local-volatility.

## ARC
- Inherits: the inversion and the quoting-map distinction (implied-volatility); the extracted non-lognormal density (implied-density); 1987's residue (portfolio-insurance-1987).
- Contributes: the measured indictment — smile, skew, surface, frown, and the jump datum — organized by the smile⟷density dictionary; the model demoted to coordinates, the surface promoted to data.
- Hands off: how far a one-factor diffusion can bend to fit the surface — exactly, by construction — and where it provably cannot → local-volatility.
- Spine step: "Inverting Black–Scholes on market quotes should return one number…" (step 7).
