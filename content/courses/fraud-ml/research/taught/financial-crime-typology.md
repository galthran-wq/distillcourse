# financial-crime-typology — ledger

**Problem.** Five crimes reach a bank as "financial crime" (stolen card numbers
online, account takeover, laundering drug cash into apartments, a student
mule, sanctions evasion via a relative's firm): which can a classifier learn?
Answer: each is a different point in four coordinates (unit, label source,
label delay, signal structure); card fraud and account takeover have a
victim who complains, so near-complete labels within weeks; account takeover
lives in the entity's history; laundering
and mules in connections, with STR labels late or never (mule accounts
sooner, within months); a direct payment to a listed party is list matching
under a legal duty, not classification, but the opening's evasion through an
unlisted related firm is a graph link labelled only by an STR, late or never,
i.e. laundering's coordinates.

## Explained
- Card loop's four facts (payment unit, victim's dispute, δ, card history) carry over only partly — intro
- Five traits (uncommon, well considered, concealed, time-evolving, organised) and the difficulty each hands the detector (well considered = aimed at the checks the fraudster knows about; a known check gets avoided); imbalance playbook covers only "uncommon" — §Rarity is one difficulty out of five
- KeyFact: ask which trait dominates before tuning class weights; if not rarity, the fix is in features, labels or unit — same §
- Definition: coordinates of a detection problem — unit, label source, label delay, signal structure (single record / entity history / connections) — §Four questions the card loop answered without asking
- Card-present (lost/stolen, counterfeit/skimmed, card not received; aside, with how each subtype's label arrives: counterfeit late, fraudster-ordered card unreported) vs card-not-present (number, expiry, security code, billing address used remotely; no chip, no PIN); CNP row carries less signal (no chip/PIN evidence), numbers stolen in bulk and sold on = organised trait, links across cards — §Card fraud: a label that does arrive
- Worked example: relative risk per euro = loss share / volume share; CNP ≥ ~6.7× card-present (worldwide 2018); channel as a strong row field; remote-only base rate several times the card-wide 0.04% (comparison with the 0.25%-by-count e-commerce stream left to the exercise: same order of magnitude, value vs count) — same §
- Card label: dispute + investigator call (Ref to fraud-detection-system §What the model gets back), near-complete because the victim looks; signal = row (resellable goods, many places) + card history (thief spends fast) — same §
- Account takeover: fraudster has the customer's access, payment alone not abnormal — §Account takeover
- Telecom call-record table (cloned phone; Boston night 34–39 s calls vs NY daytime minutes) — same §
- Definition: superimposed fraud (added to a legitimate account's stream) vs subscription fraud (account opened to defraud); application fraud = card subscription shape; stolen card number = superimposed — same §
- Unit for account takeover = account stream; signal = departure from own past; label = complaint, weeks — same §
- Money laundering defined; placement / layering / integration; each frame-2 transfer ordinary alone, odd only together (shop deposits more cash than its trade; money through company X at once); four analysis levels (transaction, account, business, ring); single bank sees only its part — §Laundering: a crime with no one to complain
- Aside: trade-based placement (erythromycin $1,694/g imported vs $0.08/g exported) — same §
- STR (EU) = SAR (US), filed with the financial intelligence unit; suspicion, not verdict; most laundering never labelled (silence-as-genuine meaningless, Ref to fraud-detection-system §Silence read as genuine); labelled positives skew to the clumsy because able launderers drop a method once it gets detected; delay years — same §
- Structuring/smurfing: splitting below the $10,000 Bank Secrecy Act (1970) reporting threshold; >10M reports in 1994, ~0.5% flagged suspicious — §Structuring and mules
- Money mule: real account used to receive and pass on money, often students; signal = rapid in/out, window sums, links — same §
- EU €1,000 rule: every transfer carries payer/payee names and account numbers; above €1,000 the banks must verify them and the payer's bank must be able to supply address or date/place of birth; applies to single or linked transfers (2023/1113 Art 5(2)(a) quoted) — same §
- Threshold as a readable decision boundary (KeyFact); well-considered and time-evolving traits in starkest form — same §
- Mule label: STR, but within months, because rapid in/out and daily sums trip monitoring; names the (possibly unwitting) mule; organisers found years later or never — same § (### Where the mule label comes from)
- Sanctions/restrictive measures: designated-persons lists, freeze duty, screening required (2023/1113 recital 18, Art 23); direct payment to a listed party: unit = counterparty, label = list, known before payment, no tunable threshold, no top-k ranking; ML only to score fuzzy name matches — §Sanctions evasion: a list, and the way around it (### A direct payment)
- Evasion through an unlisted related firm (the opening's case): well-considered reply to a published list; screening correctly returns no hit; unit = link in ownership/payment graph (shared owner, director, address, account; funds passed on); label = STR if anyone finds the link, late or never; laundering's coordinates. KeyFact: perfect screening and zero evasion detection are compatible — same § (### The cousin's firm)
- Typology table, six rows (sanctions split into listed-party hit and related-firm evasion) × unit, label source, delay, signal, dominant traits; label gets later/less complete as the victim disappears (mules months, organisers/laundering/evasion years or never; listed-party hit apart, but it is the case the evader avoids); evidence moves outward; the two move together because the crimes with no complainant are the organised ones. KeyFact: a metric on one crime does not transfer to another, because it is measured against different labels — §The typology: five crimes, four coordinates

## Notation
- δ reused from fraud-detection-system (verification latency). No new symbols.

## Running cases
- Worldwide 2018: CNP 54% of card-fraud losses on < 15% of card spending → ≥ 6.7× risk per euro
- SEPA 2018: €1.8 bn card fraud, CNP 79% of value, fraud = 0.037% of card value (~€4.9 tn total); in-body exercise: remote ≈ 0.19%, card-present ≈ 0.009% (assuming 15% remote spending), ~2 fraudulent per 1,000 €50 remote payments
- Telecom subscriber call records (12 calls, 5 fraudulent from Boston; destinations Chelsea MA, Yonkers NY, East Boston MA)
- Laundering sequence: cash → shop account (bank A) → shell co. X (bank B) + nominee (bank C) → shell co. X (bank D) → apartment
- Structuring figure: $25,000 one deposit vs 5 × $4,900 mule deposits → $24,500 destination
- Exercise: structuring diamond S → M1..M4 ($4,900) → D ($4,700) = scatter-gather (forward to fraud-as-a-graph)
- Exercise: AMLworld-style transitive taint $100 → $50 → $25
- Exercise: δ per crime — sanctions listed-party hit: no δ (list known in advance); related-firm evasion: STR, fixed δ captures almost nothing; mules: within months

## Assumed
- fraud-detection-system: layered loop, feedbacks/disputes, δ, silence read as genuine (Ref id silence-read-as-genuine-is-a-decision-not-a-fact), k ≈ 100, 0.25% Belgian e-commerce stream
- classical-ml: classifiers, imbalance playbook (resampling, class weights)

## Left open
- Price of alerts and misses → economics-of-detection
- What synthetic/public datasets can label → canonical-datasets
- Entity-history features → transaction-aggregates, behavioural-profiles
- Laundering motifs as graph shapes (scatter-gather etc.) → fraud-as-a-graph, communities-and-components
- Adversary moving below a boundary → adversarial-classification
- What counts as linked, payee-side checks, travel-rule fields, screening inputs → transfer-of-funds-crypto; STR duties → aml-transaction-monitoring-duty
- Label clocks as a pipeline → label-maturation
