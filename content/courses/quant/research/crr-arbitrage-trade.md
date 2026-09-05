# The CRR arbitrage trade, reproduced — research brief

Lesson: `crr-arbitrage-trade` (module: binomial-model, core, planned). NEW. MODULE 2 APPLICATION (L16 — a paper's central worked result reproduced).
Goal: Demonstrate Cox–Ross–Rubinstein's dynamic hedge against a mispriced call by reproducing it and verifying the locked-in profit path by path.

## Sources
- CRR 1979 §4 "Riskless Trading Strategies" (pp.12–16, lines 586–826): the full worked case — S=80, n=3, K=80, u=1.5, d=0.5, r=1.1, C=34.065 vs market 36; Steps 1–4 of the trade (sell the call at 36, invest 34.065 in the replicating strategy, pocket 1.935, rebalance at every node through the STOCK); the guaranteed profit compounding to $2.341$; the second worked example where rebalancing through the mispriced CALL destroys the profit (lines 795–826); the "foolish counterparty" argument (lines 738–761: irrational exercise only improves the hedger's position).
- Shreve I §1.2–1.3 for the replication theorem being exercised; §1.5 Notes for attribution framing.
- Hull §13 for the u/d conventions comparison (only if needed for a remark).
- Primary-source artifact: the CRR title page capture (optionpricin-title-page).

## Key points
1. Setup restated from the paper with its exact numbers; the value tree and Δ tree carried over from module 2's lesson (Ref, don't recompute in prose — the tables appear as a figure).
2. The trade, step by step, along the paper's rosy path: cash ledger at every date — call sold 36, hedge funded 34.065, surplus 1.935 banked at 1.1 per period; at every node the rebalance is SELF-FINANCING (cash from stock sales = cost of stock buys, exactly); terminal settlement nets to zero; profit = $1.935 \times 1.1^3 = 2.575$… — CHECK against the paper's own 2.341 figure; the paper banks at specific dates — reproduce the paper's number and show the accounting that yields it. This is the application's "reproduce the published number" core.
3. The same trade along a falling path — the point that the profit is path-independent because the hedge never misses (Theorem 1.2.2 doing its work).
4. The negative result, given equal weight: adjusting the position through additional (mispriced) calls at intermediate dates hands the mispricing back — the arbitrageur ends up owing. Rule extracted: rebalance through the underpriced/fairly-priced instrument only. This is a genuine, documented practitioner error, not a strawman (L13 slot).
5. The robustness result: if the call's buyer exercises early or forgets to exercise, the hedger's position only improves (dominance argument, two lines).
6. Departures from idealisation (L16): rebalancing allowed only at tree dates; zero transaction costs (each rebalance trades real shares — count the turnover and price it at 10bp to show the profit erodes); $u, d$ known — a wrong $u$ leaks risk (one numeric probe).

## Set pieces & gems
- The paper's own Steps 1–4 narrative, reformatted as a dated cash ledger — the artifact of the lesson.
- The rebalance-through-calls counterexample — the rare published "here is the wrong way, in dollars".
- The foolish-counterparty argument as a boxed Remark.
- Title-page capture as the historical anchor (source image below).

## Pitfalls
- The arithmetic must be EXACT and match the paper (34.065, 1.935, 0.719 at the root, terminal profit as printed); any deviation must be explained (rounding conventions) — reproducing a published number is the genre.
- Do not re-teach backward induction; this lesson consumes it (Ref multiperiod-binomial) and spends its length on the LEDGER and the two cautionary variants.
- Transaction-cost probe is an estimate, not a model — one paragraph, order-of-magnitude framing (L12b).

## APPLICATION spec (L16)
- Artifact: CRR (1979) §4's dynamic arbitrage trade — the founding paper's own demonstration that the binomial price is enforceable, reproduced to the cent.
- Module results used: Theorem 1.2.2 (replication), backward induction and the Δ process (multiperiod-binomial), the martingale/pricing formula for the fair value 34.065 (martingales-risk-neutral-pricing), self-financing bookkeeping.
- Departures from idealisation: discrete rebalance dates only, zero transaction costs (priced at 10bp in a probe), known $u, d$; the paper's own warnings (wrong-instrument rebalancing, counterparty behavior) presented as scope conditions.

## FIGURE PLAN
- source: optionpricin-title-page — the CRR 1979 title/abstract page; save as `crr-title-1979`; the reader must see the title, the three authors, and the JFE dating; placement: float right beside the opening paragraphs — the paper as object.
- draw: The trade ledger — a dated table-figure along the rosy path: columns = date, stock price, Δ held, shares traded, cash account, call liability, net; the invariant row (net = banked surplus growing at 1.1) highlighted. The lesson's signature visual.
- draw: FigureSequence (3 frames): the same ledger's date-1 rebalance in close-up — frame 1 pre-rebalance positions; frame 2 the stock trade (shares and cash arrows, netting to zero); frame 3 post-rebalance, hedge restored. One change per frame.
- draw: Two-path comparison — terminal profit computed along the rosy path and a falling path, side-by-side mini-ledgers, identical bottom line. Voita rule 8 (two near-identical panels, payoff as tally).
- draw: The wrong-way rebalance — the same close-up frame but the adjustment done through calls at market (mispriced) values; the leaking cash flow colored warning; bottom line negative. Paired against the correct frame.

## EXERCISE PLAN
1. Warm-up: rerun the ledger along the path down-up-down; confirm the terminal profit matches the paper's guaranteed figure.
2. Research-shaped: the paper claims the profit is locked regardless of path — verify by writing the eight path-ledgers compactly (or arguing from Thm 1.2.2) and reproduce CRR's compounded-profit number exactly, documenting the banking convention required to get it.
3. Claim to refute: "if the market call stays overpriced at every date, the arbitrageur should add to the position at each node — more mispricing, more profit." Use the paper's own counterexample logic: adding through mispriced calls at LATER dates re-imports the mispricing; identify the step in the ledger where the loss enters.
4. Boundary probe: transaction costs at 10bp per share traded — total the share turnover along the rosy path, price it, and find the mispricing threshold (in dollars on the 36 quote) below which the arbitrage stops clearing.
5. Mixed/spaced (E3): compute the fair value 34.065 a third way — as $\tilde E[(1.1)^{-3}V_3]$ with binomial weights (martingales lesson) — and reconcile all three computations in one table.
6. FORWARD (E7): suppose the counterparty may exercise the call at ANY date (American). Recompute the hedger's exposure using the foolish-counterparty argument and state what property of the call ($S$ pays no dividend, payoff convex) makes early exercise harmless. Solution: that property is Theorem 4.5.1, next module's result → Ref american-derivatives.

## ARC
- Inherits: everything module 2 built — replication theorem, backward induction, pricing formula, self-financing.
- Contributes: the module cashed out on the primary source: the founding paper's own trade reproduced, its two published warnings (wrong-instrument rebalancing, counterparty behavior) understood as consequences of the theory.
- Hands off: the counterparty's exercise right was waved off by convexity — pricing that right properly, when it has value, is module 3.
- Spine step: "Chaining one-period replications backward through a tree prices every claim…" (step 2, closing item).
