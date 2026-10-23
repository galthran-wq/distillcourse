# A typology of financial crime as learning problems — research brief

Lesson: `financial-crime-typology` (module: problem, core, planned). NEW. Second lesson — still an opener (C3): the win is a filled table, not a derivation.
Goal: Classify the major financial-crime types — card fraud, account takeover, laundering, mules, sanctions evasion — by the learning problem each poses.

## Sources
- Baesens Ch1 "Fraud!" pp.2–4: the five-trait definition (uncommon, well-considered, imperceptibly concealed, time-evolving, carefully organised), each trait → a detection challenge; Table 1.1 fraud categories (credit card application vs behavioural, insurance, money laundering, telecom superimposition/cloning, identity theft, click fraud…); the fraud triangle (one sentence, no more); Ch1 pp.19–22 three technique families and adoption order; Ch1 pp.24–26 card patterns a model learns (small purchase then big; many online in a short period; spend as much as fast as possible).
- Handbook Ch2.2: card-present vs card-not-present; lost/stolen, counterfeit, not received; CNP credential theft; CNP 54% of losses on < 15% of volume (Nilson 2019); 79% of SEPA fraud value by 2018 (ECB 2020).
- Bolton & Hand 2002 Sec. 3 (card fraud types incl. application and bankruptcy fraud; behavioural profiles; "jam jarring"), Sec. 4 (money laundering: scale, late discovery, little ground truth, structuring/smurfing against the $10,000 rule, placement/layering/integration, four analysis levels transaction/account/business/ring), Sec. 5 (telecom: subscription vs superimposed fraud; ghosting, tumbling), Sec. 6 (intrusion: misuse vs anomaly).
- Altman et al. 2023 Sec. 1 and 3.3 (laundering cycle, nine criminal sources, labels radically incomplete — most laundering undetected; Danske Bank), Sec. 7 (card fraud has near ground truth from cardholder feedback; AML has nothing equivalent).
- Weber et al. 2019 Sec. 1.1 (FinCEN 2019 guidance, KYC / know your customer's customer), Sec. 3 (industry AML false-positive rates above 90%).
- Reg. 2023/1113 Rec 30 (why crypto has no threshold: structuring, many one-time addresses) — one sentence, forward to the extra lesson.
- Akoglu Sec. 5.2 (auction fraud roles: fraudster, accomplice, honest — heterophily) and 5.6 (blackhole/volcano) — one line each as "organised" examples.

## Key points
1. Baesens' five traits mapped to five ML difficulties: uncommon → imbalance and scarce labels; well-considered/concealed → camouflage (adversary, module 8) and class overlap; time-evolving → drift (module 7); organised → relational structure (module 6); many forms → no single family (modules 4–7).
2. The card family: card-present (lost/stolen, counterfeit) vs card-not-present (credential theft, remote); CNP dominates losses. Application fraud vs behavioural fraud; account takeover as superimposition fraud (the fraudster's transactions mixed into the legitimate stream — Bolton & Hand's telecom term, transferred).
3. The AML family: placement, layering, integration; the unit of suspicion is a pattern across transactions and accounts, not a row; four levels (transaction, account, business, ring); structuring as adaptation to a threshold; labels are STRs and convictions, arriving years later and incomplete.
4. Mules and rings: accounts that receive and forward; the organised trait; motifs preview (fan-in/out, cycles) → module 6.
5. Sanctions evasion and screening: a matching problem against designation lists, not a learning problem per se; the travel rule supplies the fields (extra lesson).
6. The table that is the lesson's output: type × (unit of decision, positive rate, label source, label delay, completeness, structure, adversary speed). Card fraud: transaction / 0.1–0.5% / dispute+investigation / days–13 months / near-complete / per-card sequence / fast. AML: account or pattern / unknown, tiny / STR+conviction / months–years / radically incomplete / graph / slow and deliberate. ATO: session or transaction / rare / dispute / days / partial / sequence / fast.

## Set pieces & gems
- "Bandit" call records (Baesens Table 1.2, from Fawcett & Provost): each call unremarkable alone, anomalous against the subscriber's own pattern — the superimposition picture; reuse the idea with card transactions.
- The erythromycin trade-price anomaly ($1,694/g imported vs $0.08/g exported) — Bolton & Hand Sec. 4 — as the one-line laundering example (trade-based).
- Structuring: reports exceeded 10 million in 1994 worth ~$500bn, ~0.5% flagged — the pessimistic view that only incompetent launderers are detected.
- Altman's transitive taint ($100 → $50 → $25 all laundering) against real banks' labels — the completeness contrast.
- Provost's anecdotes (criminals pay initial bills then ramp; roving calling dens): adversary speed differs by crime type.

## Pitfalls
- No statistics tourism: at most two framing numbers (CNP share; AML false-positive rate) — each must carry its frame in the sentence.
- Do not write a criminology lesson (fraud triangle gets one sentence); the output is the learning-problem table.
- "Sanctions screening" is matching, not ML — say so; do not invent a learning problem for it.

## FIGURE PLAN
- draw: The five traits → five difficulties as a two-column binding diagram (trait on the left, the module that addresses it on the right, thin label lines). Single figure; key image.
- source: reproducible-s1-sepa-fraud-volume-per-type — stem `sepa-fraud-by-channel`; the reader must see CNP's bar overtaking POS and ATM year by year while the fraud-share line stays flat near 0.04%; float right beside the card-present/CNP paragraph (the ECB measured series a redrawing would invent).
- draw: Superimposition vs subscription fraud: a timeline of one account's events with a few fraudulent ones interleaved (superimposed) vs an account whose every event is fraudulent — two near-identical panels joined by an arrow. Inspired by Bolton & Hand Sec. 5's distinction.
- draw: The laundering cycle as placement → layering → integration over a tiny account graph, with the four analysis levels (transaction, account, business, ring) as nested brackets. Inspired by Bolton & Hand Sec. 4 and Altman Fig. 4 (redrawn in house style; the vendor flowchart is not sourced).
- draw: `<FigureSequence>` (4 frames): a probe-then-spend card attack — (1) small test charge, (2) large purchase, (3) burst of online purchases, (4) card blocked, dispute filed 40 days later — the label clock in the last frame. Inspired by Baesens Ch1 pp.25–26 patterns.
- draw: The typology table as a figure (rows: card CNP, ATO, AML, mule ring, sanctions; columns: unit, rate, label source, delay, completeness, structure) — the lesson's deliverable, filled.

## EXERCISE PLAN
1. Warm-up: from "CNP is 54% of losses on under 15% of volume" compute the ratio of per-transaction loss rates CNP : card-present.
2. Classification (interleaved): six short case descriptions (a cloned card at an ATM, a login from a new device followed by a transfer, three accounts passing EUR 9,900 between them, a merchant charging stolen numbers) — assign each to a type AND to the row of the table, naming the cue that decides.
3. Claim to refute: "Money laundering is card fraud with larger amounts, so a per-transaction classifier trained on STR labels will detect it." Break it on unit, label completeness and delay; name which trait fails.
4. Boundary probe: a crime type with complete, instant labels and no adversary — which difficulties disappear and what classical-ml tool suffices; argue why no real financial crime is that case.
5. Derivation: using Bolton & Hand's "only incompetent launderers are detected" reading, show formally that if detection depends on a fixed threshold T, the launderer's optimal split of amount A is ⌈A/T⌉ transfers just under T, and what statistic (count of near-threshold amounts per account) would reveal it — the structuring signal.
6. FORWARD (E7): write down, for a card and for an account in the table, the time at which a label becomes known relative to the transaction, and sketch a training window ending today that contains no wrongly-labelled genuine rows → lands on `delayed-labels-prequential`'s delay block.
7. Research-shaped: read AMLworld's Table 8 numbers (19,461 of 100,604 laundering transactions in the eight patterns) and estimate what recall a motif-matching rule set could reach at most — and what that implies for the "organised" trait.

## ARC
- Inherits: the five-layer loop and the label mechanics (fraud-detection-system).
- Contributes: the typology table — which difficulties each crime type brings, with the trait each comes from.
- Hands off: base rates and budgets (economics-of-detection); the datasets that instantiate each row (canonical-datasets); superimposition → sequences (module 7); organised → graphs (module 6); labels incomplete → label-maturation.
- Spine step 1 (as above): the detector inside the loop.
