# Research brief: balance-sheet-and-cash-flow (Balance sheet and cash flow, linked)

status: planned
module: startup-finance
type: core
goal: Construct the balance sheet and cash flow statement that articulate with a given P&L, and locate cash death inside a profitable income statement

Statements, part 2 of 2 — the system view. Business words: balance
sheet, cash flow statement, working capital. Academic layer:
articulation identities (conservation laws); indirect-method
reconciliation. Dig-deeper: Berk & DeMarzo ch.2 (toc-only); Dropbox
S-1 F-pages (full).

## ARC (L10)

- **Inherits:** the P&L and the deferred-revenue account (previous
  lesson's forward exercise: "where do the cash and the liability
  live?").
- **Contributes:** Spine step 15's system claim: three statements,
  one machine — every P&L flow casts a stock shadow; the indirect
  cash flow statement reconciles profit to cash; and the machine
  exhibits the course's sharpest solvency fact: profitable companies
  die of working capital.
- **Hands off:** the full 24-month machine (financial-model), the
  survival read on its cash line (burn-runway), and the adversarial
  read of a real one (wework-s1-reading).

## Sources to consult

- **Berk & DeMarzo ch.2 (TOC + highlights)** — statement anatomy and
  articulation order; structure only.
- **Dropbox S-1 (FULL, cached)** — the real-statement layer:
  - GM 33% (2015) → 54% → 67% (2017) tied to the infrastructure
    migration — cost structure visible across statements (COGS down,
    capex up, capital leases on the balance sheet).
  - FCF flip: −$63.9M (2015) → +$305.0M (2017); FCF = CFO − capex
    (their own definition).
  - Deferred revenue as customer financing (subscription prepay).
- **WeWork S-1 F-pages (FULL)** — the negative example held for its
  own lesson; here only the articulation fact that financing inflows
  ($2.66B) coexisted with falling cash (investing −$2.48B) in 2018 —
  one table row as a teaser.
- **Janz template (cached post)** — the Summary-tab conventions (cash
  as the output line; no interest/tax except payroll) the model
  lesson inherits.
- **Skok** — working-capital advantage of annual prepay (cash
  arrives before cost).

## Key points the lesson must cover

1. **The balance sheet as state**: assets = liabilities + equity;
   the course case's accounts (cash, AR, prepaid hosting; deferred
   revenue, accrued comp; paid-in capital, retained earnings) — a
   SMALL chart of accounts, deliberately.
2. **Articulation**: net income → retained earnings; revenue vs AR
   and deferred revenue; expenses vs prepaids and accruals; capex vs
   PP&E and depreciation — each P&L line paired with its
   balance-sheet shadow in one table.
3. **The indirect cash flow statement**: CFO = net income + non-cash
   ± Δworking-capital; investing; financing; the three-section logic
   and why the indirect method is a reconciliation, not a cash
   ledger.
4. **Cash death while profitable** (the lesson's set piece): a
   growing company invoicing net-60 with rising AR — monthly P&L
   positive, cumulative cash negative and diverging; the working-
   capital consumption formula (ΔWC ≈ growth × collection lag ×
   revenue rate); where the SaaS prepay model INVERTS it (negative
   working capital = customers finance growth).
5. **Real statements read once**: Dropbox's margin migration and FCF
   flip across the three statements — choices (build datacenters)
   visible as statement geometry (COGS↓, capex↑, leases on the
   sheet).

## Set pieces and worked examples to recreate

- The course case's first linked quarter: given the P&L from last
  lesson + opening balance sheet, produce the closing balance sheet
  and the indirect CF statement; verify cash ties (the articulation
  drill, fully worked).
- The profitable-death model: services company, 8%/mo growth, net-60
  collections, 15% margin — month-by-month table to the cash zero;
  then the SAME growth with annual prepay — cash grows. Two runs,
  one lever.
- Dropbox's 2015–2017 three-statement mini-panel (their filed
  numbers): GM series, capex, FCF flip.
- WeWork's one-row teaser: raised $2.66B, cash fell — held for the
  application lesson.

## Pitfalls / subtleties

- Keep the chart of accounts minimal — this is not a bookkeeping
  course; every account exists because the case needs it.
- Depreciation enters here (non-cash add-back) — one clean example;
  full D&A policy discussion stays out.
- Direct vs indirect method: one sentence acknowledging the direct
  method exists; everything filed is indirect.
- Do not moralize "cash is king" — state the conservation laws and
  let the profitable-death table argue.

## FIGURE PLAN

1. `draw:` single `<Figure>` — the three-statement machine: P&L
   (flows) feeding the balance sheet (stocks) with the CF statement
   drawn as the reconciliation pipe between opening and closing
   cash; arrows labeled with the articulation identities.
2. `draw:` `<FigureSequence>` (4 frames) — one quarter articulated:
   frame 1 P&L result; frame 2 balance-sheet shadows move (AR,
   deferred, accruals); frame 3 the CF statement assembles NI +
   non-cash ± ΔWC; frame 4 closing cash ties to the balance sheet.
   One statement per frame.
3. `draw:` single `<Figure>` — the profitable-death chart: monthly
   net income (positive bars) vs cumulative cash (diving line) for
   the net-60 case; the annual-prepay variant overlaid rising —
   working capital as the whole difference.
4. `draw:` single `<Figure>` — working-capital sign map: collection
   lag vs billing model (monthly/annual-prepay/net-60) with the
   cash-consuming and cash-generating regions shaded; SaaS prepay
   marked in the negative-WC region.
5. `draw:` single `<Figure>` — Dropbox mini-panel: GM% 33→54→67, capex
   bars, FCF line flipping sign — three filed series, one story
   (drawn from filed numbers; no capture needed — the S-1 prints no
   such combined chart).

## EXERCISE PLAN

1. Warm-up: from a given P&L (revenue 100, expenses 80, of which
   depreciation 10) and ΔAR +15, ΔDeferred +20, Δaccruals +5 —
   compute CFO by the indirect method. (The reconciliation once.)
2. Boundary probe: a company with zero growth — show ΔWC → 0 and
   CFO → net income + D&A; growth is exactly what makes profit and
   cash diverge; state the identity linking the divergence to the
   growth rate.
3. Claim to refute: "We're profitable, so we can't run out of money."
   Build the net-60 counterexample to a stated cash-zero month;
   then name the two levers (terms, growth rate) and compute the
   growth ceiling given a cash balance — the lesson's sharpest
   deliverable.
4. Derivation the lesson skipped: prove cash conservation formally —
   ΔCash = NI + non-cash − ΔNWC − capex + financing — from the
   balance-sheet identity differenced; every term named.
5. Research-shaped: from Dropbox's filed figures (revenue 603.8→
   1,106.8, FCF −63.9→+305.0, GM 33→67%), decompose the FCF swing
   into margin improvement vs revenue growth vs capex change
   (approximate decomposition; state assumptions) — which lever
   dominated?
6. FORWARD (E7): the linked quarterly model, extended by hand for
   two more quarters, already predicts the month cash crosses zero
   under the base plan. Solution: automating exactly this — drivers
   in, statements out, cash-zero month highlighted — is the
   financial model, next lesson; `<Ref>` financial-model.
7. Spaced (E3): deferred revenue rose $20 this quarter — reconcile
   with the previous lesson's identity (billings vs revenue) and
   state what the balance's GROWTH says about bookings momentum
   (Zynga's declining-deferred signal, Ref zynga-channel-collapse).
