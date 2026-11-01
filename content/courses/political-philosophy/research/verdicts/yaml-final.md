# course.yaml changes — the-argument-assembled (final lesson)

Proposed by the brief rewrite of `research/the-argument-assembled.md` (phase C, part D). Not applied: the orchestrator merges these into `course.yaml`. Slug, status, prerequisites, concepts and the lesson list are unchanged.

## the-argument-assembled — goal

Old:
```
goal: "Explain how each tradition the course has read answers its four questions — who should rule, whether inequality is natural, what holds a people together and why civilizations decline, and why the West — and judge which answers survived their objections"
```

New:
```
goal: "Judge the course's four questions — who should rule, whether inequality is natural, what holds a people together and why civilizations decline, and why the West — by assembling the module verdicts, and weigh against its strongest objections the answer they add up to: that a free state cannot survive on liberal principles alone"
```

## the-argument-assembled — opening

Old:
```
opening: "Twenty-four centuries of answers to four questions have gone past. The lesson lays them out as the chain of moves it was — each thinker answering the one before — and asks which answers were refuted, which were abandoned without refutation, and which are still standing in the arguments of the 2020s. It ends where the course's own problems remain open."
```

New:
```
opening: "Sixteen disputes have been put to the record, from Sparta's helots to Hungary's election of April 2026, and each has a verdict with a grade. Set side by side, they answer four older questions — who should rule, whether inequality is natural, what holds a people together and why civilizations decline, why the West — and the one the history leads to: whether a free state can survive on liberal principles alone. Each answer must hold under the same tests whichever side gave it, and the last must hold against its four strongest objections."
```

## the-argument-assembled — key_ideas

Old:
```
key_ideas:
  - "Who should rule — knowledge (Plato), nature and the middle (Aristotle), the mixed people (Polybius, Cicero, the Federalist), the sovereign (Bodin, Hobbes), consent (Locke), the general will (Rousseau), inheritance (Burke), the organized minority (Mosca, Michels), the decider (Schmitt), the disposition (Oakeshott)"
  - "Is inequality natural — Aristotle's ladder and its difficulty, Augustine's slavery by sin, Hobbes's equality of ability, Rousseau's artificial inequality, Maurras's protective inequality, Rawls's natural lottery, the envy charge and its reply, the hereditarian debate"
  - "What holds a people together and why it fails — a shared god, a shared way of life, a language, a descent, a shared enemy, a daily plebiscite, a contract; decline as organism, failed response, mixture, exhaustion"
  - "Why the West — the exceptionalist case and the chain-of-exchange thesis, with the borrowing ledger and the explanation debate as the evidence"
  - "What stays open — the Böckenförde question, and the reader's own position stated against the strongest objection to it"
```

New:
```
key_ideas:
  - "How an answer is weighed — against its strongest objection, its forecasts against the record, its consistency with the evidence — graded established, strong, on balance or open, by the same tests for left and right"
  - "Who should rule — a settled last word that a composite body can hold and law can bind; a removable minority under law; a wide franchise that did not end liberty; rule by knowledge untested, the decider without a criterion"
  - "Is inequality natural — abilities differ and predict outcomes, but no argument from that difference to a right of rule has survived; the genetic share of group gaps open, with two limits established"
  - "What holds a people together and why civilizations decline — a received loyalty a free state uses and does not make; the bond by blood refuted; the liberal forecasts that the bond would form by itself failed; decline by mechanism, not by law"
  - "Why the West — a lead older than 1800 and younger than the Greeks, built on borrowings; late luck and ancient inheritance both fail on timing; the cause open"
  - "The thesis — liberal freedom is real and worth keeping but does not found itself (on balance) — tested against Rawls, Carens, MacIntyre and Habermas, and what evidence would change it"
```

## the-argument-assembled — notes

Old:
```
notes: "Synthesis (type: synthesis); no new material. Every claim is a Ref to the lesson that established it. Per the tone: no verdict handed down — the last exercise asks the reader to state their own position and its strongest objection."
```

New:
```
notes: "Synthesis (type: synthesis); no new material. Every claim is a Ref to the lesson that established it, with the grade research/verdicts/REGISTER.md gives it; the course verdict is the register's 'Course verdict' section, and the thesis is quoted exactly as the last paragraph of the intro words it. Liberal and left forecast checks stand beside the right-wing ones in every question. The last exercise asks the reader to attack the thesis at its weakest clause and say what evidence would overturn it."
```

## the-argument-assembled — est_minutes

Old:
```
est_minutes: 40
```

New:
```
est_minutes: 45
```

Note: the brief plans about 8,000 words of body, 55–60 minutes of reading. The schema allows up to 60; values above 45 trigger the lint warning (`lib/content/lint.ts`, 5–45 guidance). 45 is proposed to stay inside the guidance. If the written lesson runs past ~6,500 words of body, the human decides between (a) accepting `est_minutes: 55` with the warning, or (b) splitting the lesson in two — the method and the four questions in one, the thesis and its objections in a second. A split adds a lesson and a slug, which only the human may do.
