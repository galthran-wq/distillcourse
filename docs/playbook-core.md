# Playbook — universal core

The domain-independent layer of the course mechanics. Two companion layers
build on it: `docs/voita-playbook.md` (exposition mechanics — structure,
density, figures) and the domain overlays `docs/playbook-math.md` /
`docs/playbook-history.md`. The constitution (`docs/pedagogy.md`) states the
binding rules; this file records where they come from and how to apply them.

Provenance: two independent statistical dissections — Lena Voita's "NLP
Course For You" (July 2026) and the full 52-episode CrashCourse US History
corpus (July 2026) — plus a literature audit of learning-science and
domain-didactics research (July 2026, effect sizes cited below). Where the
two reference courses converge independently, we treat the shared invariant
as a law of the genre, not a house style.

## Convergent invariants (found in BOTH reference corpora)

1. **Format contract.** Every unit of a course has the same shape — the same
   slots, in the same order, every time. Voita: identical section kinds and
   named blocks per page. CrashCourse: 47 episodes with an unvaried slot
   sequence down to ritual phrasing. Strict typing is what carries
   engagement, not what limits it. → pedagogy L2, L5, E1.
2. **The unit is a claim, not a topic.** A lesson is one move in an argument;
   a heading is a claim or a precise question, never a label. → L10, playbook
   Writing principle 2.
3. **Flaw-first progression.** New material enters as the fix for a named
   flaw: Voita introduces each mechanism as the repair of the previous one's
   stated failure; CrashCourse opens on the reader's own misconception and
   dismantles it. Same operator at two scales. Research: refutation texts
   beat plain correct exposition, g=.41 (44 comparisons, ~3.9k learners) —
   but only for GENUINE, prevalent misconceptions; invented strawmen are
   noise. → L13.
4. **Recap as transition.** A seam restates the fact it builds on (one
   sentence, with a Ref), then builds. Transitions carry facts, not filler.
   → L10b, L11d.
5. **Concrete before general — conditionally.** Both corpora ground the
   general in a computed or narrated instance first. Research verdict:
   experience-first when a short case exposes a genuine need; formal-first
   is legitimate when every term is already familiar and precision itself is
   the lesson. Neither order is a universal law. → L4.
6. **Ritual tail.** Exercises, then references; verdict, then hand-off. The
   reader always knows where the unit ends and what carries forward. → E1,
   L8, L10c.
7. **No unbound tokens.** The deepest shared law. A symbol, number, term, or
   name may not appear without its binding — the thing that lets the reader
   evaluate it:

   | Token | Binding | Where enforced |
   |---|---|---|
   | formula | dissected in place, tied to the running example | voita-playbook figures 3, 7; playbook-math |
   | number | comparison / denominator / consequence in the same sentence | L12; playbook-history |
   | term | defined at first use, ≤3 new per section | L9, L11c |
   | place / event | anchored (locator, date, what-happened clause) | L11a–b |
   | source | provenance stated where provenance is content | L8a |

8. **Serial continuity.** A spine the course argues along; every unit names
   what it inherits and what it hands off. Voita: roadmap sentences and
   cross-links. CrashCourse: "you'll remember from last week…" plus a
   forward hook, every episode. → course `spine`, L10.

## The science core (what the literature adds)

Effect sizes are standardized (d or Hedges' g); boundary conditions matter
more than the point estimates.

- **Seductive details harm** (retention d≈.30, transfer d≈.48; harms shrink
  with unlimited time but never invert). The operational rule is the
  **counterfactual deletion test**: if deleting a detail would not impair an
  objective, an inference, a later exercise, or a disciplinary judgment —
  cut it, or move it to a clearly labeled optional aside. Interest must
  attach to the central idea, not compete with it. → L12.
- **Retrieval beats restudy** (g≈.50) and **spacing beats massing** (d≈.54;
  spaced retrieval g≈.74). Every core idea gets ≥3 encounters: its own
  lesson, 1–2 lessons later, and near the module/course end — later
  encounters as retrieval-plus-application, never verbatim repetition.
  → E3, C5.
- **Interleaving** (overall g=.42; mathematics cluster-RCT d=.83): once a
  method is established, later exercises mix CONFUSABLE types without
  naming the required method — the learner's first task is "which kind of
  problem is this, and what cues decide?". Mixing unrelated topics is not
  interleaving. → E3, domain overlays.
- **Self-explanation prompts** (g=.55) work when they target a specific
  inference at a decision point ("which assumption makes this step legal?",
  "how does the author's audience change the evidentiary value?") and fail
  as generic "explain your answer" boxes. 1–3 sentences, then a model
  answer for comparison. → E2, domain overlays.
- **Refutation schema** (when a genuine misconception exists): state the
  correct claim or a warning first → one concise statement of the
  misconception → explicit rejection → causal explanation of WHY it fails →
  replacement model → discriminating example → delayed retrieval. Emphasize
  the correct model typographically, never the myth. → L13.
- **Essential content lives on the path the reader actually walks.** Survey
  data: 89% of students use worked examples, 25% read introductions.
  Indispensable intuition goes inside examples, tasks, and feedback — never
  exclusively in a preface. Motivation is a **specific intellectual need**
  (a question current tools cannot answer, a surprising contrast) — not a
  utility claim ("X is important in AI"), which can depress interest.
- **Guidance prompts, never replaces.** Directive multimedia annotation
  (e-Proofs negative result) produced worse retention than plain text by
  displacing the reader's own organization. Every interactive affordance
  must demand a prediction, selection, or explanation before it reveals.
  → D-rules, domain overlays.

## Register modulation (layout, not adjectives)

Importance is marked by a shift of device, not by intensifiers. The visual
grammar is stable — one style per role (definition, claim, example, warning,
exercise, optional aside) — and NEVER the same container for essential and
optional material. Gravity is signaled by *withdrawing* apparatus: shorter
sentences, no asides, no folds, plain figures. If everything is emphasized,
nothing is. → L14.

## Reversal seams

Where the record or the mathematics breaks the reader's natural expectation,
the seam must say so: state the expectation, then break it ("from X one
would expect Z; the record shows the opposite"), in the dry register — no
manufactured drama, and no reversal where the material contains none.
Itinerary seams ("this section takes up…") are reserved for genuinely
neutral hand-offs. → L10b.

## The selection direction (workflow, not prose)

Evidence is pulled by the argument, never pushed by the source. The writer
drafts the argument skeleton FIRST — claims, seams, keeper facts — and only
then quarries the research brief for the specific evidence each claim needs.
A brief is a quarry, not a checklist: coverage of its facts is not a goal,
and a fact that no claim needs does not enter the prose. This inverts the
failure mode where available facts generate sentences. → lesson-author
workflow step 3.
