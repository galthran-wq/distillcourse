# fraud-detection-system — ledger

**Problem.** Where can a learned model sit in a card-payment flow with a 1–2 s
authorisation deadline, ~100 investigator cases/day and labels that arrive late
or never? Answer: fast precise checks before the answer, the model after it as
a ranking cut at k, labels on two clocks, a loop in which the model chooses its
own fast labels, nightly retraining beside hand-edited rules.

## Explained
- Deadline budget: 1–2 s end to end, most of it the round trip terminal → card network → issuer → back; the issuer's checks get a few ms — §The deadline splits the work in two
- Terminal checks (request + lookup of stored account values: PIN, attempts, card status, balance, limit; deny) — same §
- Blocking rule: if-then on the request alone, before the answer, refuses the payment; example "IF internet transaction AND unsecured website THEN deny" — same §
- Why a block must be nearly always right: 1% false alarms on ~399,000 genuine = ~4,000 refused customers/day, 4 per fraud in the stream — §Why a block has to be nearly always right
- Feature augmentation (history features, dozens of them: counts/sums over hour/day/week/month, weekly spend, last location, merchant's recent fraud) — §Where a learned model fits: after the answer
- Why the model does not refuse: precision decides (~85 of its top 100 cards genuine; a threshold high enough leaves only a sliver). Time does not rule it out alone (stored count + 1, overnight averages can be ready); the deadline only limits what runs before the answer to values ready at request time and ms evaluation; since the model may not refuse, it runs after the answer where features are recomputed with the payment and model size is free — §Could the model refuse payments?
- Model scores the already-accepted payment in near real time; can block the card (a second's delay costs nothing: bursts over minutes/hours) and raise alerts, cannot refuse the scored payment — same §
- Block vs alert (alert refuses nothing, asks a person) — same §
- Issuer = the bank that issued the card — §The deadline splits the work in two
- Aside: a model inside the deadline (one Belgian processor, precomputed profiles, nightly re-estimation) works only with features ready before the request and a blocking-grade threshold — §Where a learned model fits
- Investigators' unit is the card (one call settles all recent payments; frauds ≈ 3× compromised cards every day, figure of 3 weeks); capacity k ≈ 100 cards/day — §A hundred cases a day
- Thresholded yes/no fails: 1% FPR → ~4,000 flags vs 100 calls; output used as ranking, alerts A_t = payments on the top-k cards — §Ranking, then cutting at the capacity
- k set by headcount; a better model buys a more precise top k; logistic regression ~15 fraud cards in top 100 vs 0.25 for 100 random cards (about 60×, in cards on both sides; <1 holds for any card count above 30,000) — same §
- Scoring rule (first defined here, not in the clock figure; score from history features, alerts join the queue; example "previous transaction in a different continent AND < 1 h → 0.95"); rules: fast to change, readable, deletable, only known patterns; model: many features nonlinear, not editable, only retrained — §Rules beside the model
- The five-row table is one bank's arrangement; the constraints fix the order (fast+precise before the answer, slower ranking after, people at the end, labels back) — same § KeyFact
- Feedbacks F_t: recent payments of alerted cards, labelled same day; compromised card blocked — §What the model gets back
- Disputes days–weeks; PSD2 Art 71 13-month window (forward pointer only); silence read as genuine after δ — same §
- Definition: verification latency δ; delayed samples D_{t−δ}; F_{t−δ} ⊂ D_{t−δ} — same §
- Silence-as-genuine is a modelling decision; negatives mean "not reported within δ" — §Silence read as genuine is a decision
- Fast labels are selected by yesterday's model; class mix distorted (~15 of 100 alerted cards compromised vs 0.25 of 100 random cards, ~60× overstated); random calls too costly (100 random cards hold a quarter of a compromised card) — §The fast labels are a sample the model chose
- Nightly retraining on F_t + D_{t−δ} + older data; rules edited any day; fraud cycle detection→investigation→confirmation→prevention, retraining-frequency factors — §How often the model changes

## Notation
- T_t: payments of day t; k: alerts (cards) per day (≈100); A_t: payments on the top-k cards of day t
- F_t: feedbacks of day t; δ: verification latency (examples use δ = 7); D_{t−δ}: delayed samples of day t−δ, received at day t

## Running cases
- Belgian e-commerce stream 2018: ~400,000 payments/day, ~1,000 frauds (0.25%), ~300 compromised cards (~3 frauds/card), k = 100 → at most a third of compromised cards reachable
- Assumed card count: ~120,000 distinct cards pay per day (a little over 3 payments/card; stated as an assumption, not a source figure) → compromised cards = 1 in 400 cards
- Logistic regression: ~15 compromised cards in daily top 100; 100 random cards 0.25 (≈60×)
- Threshold with 1% FPR: ~4,000 genuine flags/day
- End of day t, δ = 7: ~7,000 frauds in last 7 days, ~300 labelled (45/day)
- In-body exercise: 2M payments/day, 0.1% fraud, 4/card, 25×12 = 300 calls → 500 cards, 60% reachable, ~20,000 false flags (67×)
- Exercise: uneven spread (50 cards × 10 frauds, 250 × 2), k = 100 → 333 frauds settled at random among compromised, 600 max, 200 min; card reachability stays 1/3
- Exercise: perfect ranking, δ = 7 → ~2,100 of 7,000 labelled, 70% unseen (vs 95% for logistic regression)
- Forward simulation (exercise): 10,000 rows/day, 1% fraud, top-100 labels; training fraud share ~3% day 1, ~10% day 5, ~14% day 10

## Assumed
- classical-ml: classifier with a probability output, logistic regression (no earlier lesson in this course)

## Left open
- Which crimes have which label clocks → financial-crime-typology
- Pricing alerts and misses → economics-of-detection
- Precision at the budget / card precision as metrics → alert-budget-metrics
- Validation under the label delay → delayed-labels-prequential
- Learning despite selected feedbacks → alert-feedback-selection-bias
- Label sources in detail, 13-month disputes → label-maturation
- The clocks as an architecture → real-time-scoring-architecture
