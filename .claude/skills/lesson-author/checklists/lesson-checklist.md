# Lesson checklist (lesson-author self-review)

Report PASS/FAIL for each, with a quoted line as evidence where sensible.

## Clarity first (L0 — a FAIL here outweighs everything below)
0. Newcomer test: reading as someone who knows only the prerequisites and
   every earlier lesson of the course, nothing re-explained that an earlier
   lesson already taught, list every point where they get lost — term before
   explanation, conclusion before problem, arrangement without its reason,
   leap between sentences, a source name. Zero left?
0a. Every arrangement, procedure, metric or convention arrives as the
   answer to a stated problem, with its "because"?
0b. No source (author, book, paper) named anywhere in the body, exercises
   and solutions included; `source-in-prose` silent?
0c. Each thing said once (L0f): no first sentence restating its heading,
   no section recap, no paragraph re-saying the previous one, no preview;
   tightening pass done; the closing is a `<Conclusion>` before
   `## Exercises` and the only summary?

0d. Every quoted result (a model's AUC, AP, a benchmark row) comes after
   the reader has been told what was fitted, on what data and split, and
   how it was scored — here or in an earlier lesson that a `<Ref>` names;
   nothing borrowed from an experiment a later lesson sets up (L0g)?

## Structure (validator also checks the mechanical parts)
1. Opens with the opening statement verbatim, and it is the PROBLEM in
   plain words — not the lesson's conclusion compressed; nothing after it
   talks about the lesson or the course itself.
2. Sections follow the material's own logic; a reader scanning only the
   headings and environment labels sees the chapter's skeleton.
3. Every `<Exercise>` has a complete `<Solution>`; `<References>` closes the
   lesson with real, verifiable sources.
4. Visuals carry ideas; zero decoration.

## Craft (validator cannot check — be honest)
5. Is every environment honest — definitions actually precise, theorems
   actually stated with hypotheses, proofs actually proofs (or clearly
   labeled sketches)?
6. Does a concrete instance precede every general formula (L4)?
7. Is all notation used later? (Unused notation = cut.)
8. Do most exercises require producing something, and is at least one
   genuinely parallel to a worked example (E2, L7)?
9. Does the review exercise actually require the earlier concept, not just
   mention it (E3)?
10. Do solutions show the full path, to the worked-example standard (E4)?
11. Is the chapter substantial — would it hold its own next to a good
    textbook's treatment of the same topic at this level?
12. Hunt the whole lesson for slop (L9): filler, hype, intensifiers, empty
    transitions, restating summaries, idiom for mechanism, invented
    personas, teasers, self-answering rhetorical questions. Zero found?
13. Could any sentence be deleted without losing a fact or a step of the
    explanation? (If yes, delete it — but never delete a step the
    newcomer needs.)
