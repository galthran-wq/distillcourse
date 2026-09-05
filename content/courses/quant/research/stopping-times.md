# Stopping times and optional sampling — research brief

Lesson: `stopping-times` (module: american-options, core, planned). NEW.
Goal: Distinguish stopping times from foresight rules and prove that stopping preserves the martingale property.

## Sources
- Shreve I §4.3: stopping times, stopped processes, Theorems 4.3.2/4.3.3 (Optional Sampling I and II), and above all Figs 4.3.1–4.3.6 — the six-diagram build-up whose pair 4.3.5/4.3.6 (discounted stock stopped at a stopping time vs at a NON-stopping time) is, per the reader summary, "the didactic core of why the stopping-time condition matters". Recreate that pair faithfully in house style.
- Shreve II §8.2 (Def 8.2.1, Thm 8.2.4) for the continuous statement — cited as the later restatement, not developed.
- Hull §19.3's stop-loss rule mentioned in one forward sentence (a rule that IS adapted but whose cost analysis needs module 4) — do not develop.

## Key points
1. Definition: $\tau: \Omega \to \{0,\dots,N\} \cup \{\infty\}$ with $\{\tau = n\}$ decided by the first $n$ tosses. Canonical example: first passage of $S$ below a level. Near-miss (playbook-math): $\rho$ = "the time one step before the path's maximum" — well-defined per path, NOT a stopping time; name the clause it violates.
2. Stopped process $X_{n \wedge \tau}$ defined and drawn: the path freezes at $\tau$.
3. Optional sampling proved in the finite setting: a martingale stopped at a stopping time is a martingale (proof via the sum decomposition $X_{(n+1)\wedge\tau} - X_{n\wedge\tau} = \mathbb 1_{\{\tau > n\}}(X_{n+1} - X_n)$ and adaptedness of the indicator — the one-line engine made visible); supermartingale version stated alongside (it is what module-3 pricing uses).
4. The foresight counterexample carried numerically: stop the discounted stock "at its maximum over the tree" — compute the stopped expectation, show it strictly exceeds $S_0$; the same computation at first-passage stopping shows equality. Fairness is destroyed exactly by peeking.
5. Why pricing needs this: an American option's buyer chooses $\tau$; the seller must be hedged against every ADAPTED $\tau$, and only adapted ones — the class over which module 3's sup runs. Stated as the hand-off.

## Set pieces & gems
- Shreve's Fig 4.3.5/4.3.6 pair — the stopped-fair vs stopped-with-foresight comparison, the lesson's centerpiece, recreated as a two-panel house figure with the expectations computed underneath.
- The "one step before the max" rule as the memorable non-example.
- The indicator decomposition identity as the proof's single moving part — dissected in place.

## Pitfalls
- Do not phrase optional sampling as "you can't beat a fair game" without the hypothesis inventory: bounded horizon here (finite $N$) makes the theorem clean; the infinite-horizon caveat (doubling strategies) gets ONE remark and a pointer, not a theory.
- $\{\tau = n\}$ vs $\{\tau \le n\}$ measurability — equivalent on the tree; fix one and note the equivalence in the ledger.
- Keep the sup-over-$\tau$ pricing formula OUT of this lesson (next lesson's opening move); this lesson ends at the theorem.

## FIGURE PLAN
- draw: Stopping time as a frontier on the tree — the $N=4$ tree with the nodes where $\tau$ has struck shaded, the frontier property visible (once struck, all descendants struck); beside it the non-example whose "frontier" depends on the future. Single Figure, inspired by Shreve Fig 4.3.1.
- draw: A stopped path — one path with the freeze at $\tau$: values ride, then flatline; twin panel with a later $\tau$. FigureSequence (2 frames). Inspired by Fig 4.3.2.
- draw: The 4.3.5/4.3.6 pair — discounted stock tree, stopped at first-passage (expectations level, computed in place) vs stopped at the foresight rule (expectation rises, the profit circled warning-color). The lesson's signature figure.
- draw: The proof's engine — $X_{(n+1)\wedge\tau} - X_{n\wedge\tau} = \mathbb 1_{\{\tau>n\}}(X_{n+1}-X_n)$ dissected: the three cases ($\tau \le n$, $\tau = n+1$, $\tau > n+1$) as three mini-paths, each showing which side vanishes. Voita rule 7.
- draw: The admissible class — a schematic of "all exercise rules" with the adapted subset shaded; two labeled points (first passage; the peeking rule outside); caption: American pricing optimizes over the shaded set only. Original, forward-looking.

## EXERCISE PLAN
1. Warm-up: for the standard 3-period tree, list the value of $\tau$ = "first time $S_n \le 2$" on all eight paths and verify the frontier property.
2. Claim to refute: "τ = the last time the stock is above 4 is a legitimate exercise rule — it only uses observed prices." Refute: 'last' quantifies over the future; exhibit two paths agreeing through time 1 where the rule disagrees at time 1.
3. Derivation skipped: prove the supermartingale version of optional sampling from the martingale proof — locate the single inequality that changes.
4. Boundary probe: $\tau \equiv N$ and $\tau \equiv 0$ — check both are stopping times and that the theorem degenerates to trivial identities; state what each endpoint will mean for an American option (never exercise / exercise immediately).
5. Numeric (foresight profit): compute $E[(1+r)^{-\rho}S_\rho]$ for the peek-at-the-max rule on the 2-period tree under $\tilde P$ and measure the manufactured excess over $S_0$ in dollars.
6. FORWARD (E7): for the American put payoff $G_n = \max(4 - S_n, 0)$ on the 2-period tree, compute $\tilde E[(1+r)^{-\tau}G_\tau]$ for ALL stopping times (there are finitely many; enumerate the frontier sets) and report the maximizer. Solution: the maximum just computed is the American price, and the maximizing $\tau$ is the first time price = payoff — the next lesson proves both in general → Ref american-derivatives.

## ARC
- Inherits: martingales and the pricing formula (martingales-risk-neutral-pricing); the tree's filtration language (coin-toss-probability).
- Contributes: the class of admissible exercise rules, and the theorem that stopping cannot break fairness — the two ingredients American pricing consumes.
- Hands off: with the class defined and the theorem proved, the American price can be defined and computed → american-derivatives.
- Spine step: "An American claim adds a choice…" (step 3).
