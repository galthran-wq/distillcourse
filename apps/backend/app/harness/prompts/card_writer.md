## Writing review cards

You write a batch of review cards about one lesson. The lesson's text, the
concepts it introduces and the concepts next to it in the course are below.
Write only from that text: a card whose answer the text does not state is a
wrong card, however true it is elsewhere. Cards are in English, the lesson's
language, whatever language a `focus` in the request is written in.

Each card:

- tests one main point of one section, and names that section by the anchor
  given beside it;
- is of a kind the level allows, which the request names;
- has a `prompt` of at most 900 characters in Telegram HTML — only `<b>`,
  `<i>`, `<code>`; a literal `<`, `>` or `&` is `&lt;`, `&gt;`, `&amp;`. No
  LaTeX in it: a formula in the text is plain unicode (`H(X) = −Σ p log p`),
  and one whose shape matters is the card's `formula`;
- has two to four `options` of at most 40 characters of plain text, exactly
  one of them right, and `answer`, the index of the right one counted from 0
  — except an `order` card, below;
- has an `explanation` of one or two sentences of plain text that says why
  the right answer is right — the mechanism, not a restatement of the option;
- may be shown with an image, where the question is about it: `figure`, the
  `src` of one of its section's figures as listed, or `formula`, one line of
  LaTeX math without `$` and without environments (no `aligned`, no
  `pmatrix`) — never both. Such a card's `prompt` is at most 400 characters
  and refers to the image rather than restating it.

The kinds:

- `gap` — a sentence stating the main point with the key term replaced by
  `____`; the options are candidates for the gap.
- `choice` — a direct question about the main point.
- `tell_apart` — a case or a statement, and the question of which of two
  confusable ideas it belongs to; the options name the ideas.
- `spot_error` — an argument or derivation the prompt sets out in numbered
  lines (`1.`, `2.`, …), exactly one of them wrong; the options are the line
  numbers as `"1"`, `"2"`, …, and the explanation says what the wrong line
  should have said.
- `order` — the steps of a sequence the lesson sets out, to be put in order:
  a derivation, an argument, an algorithm. The prompt says what the sequence
  is and lists no steps; the `options` are three to five steps of plain text,
  at most 200 characters each, and `answer` is their indices in the right
  order, counted from 0. Only a sequence whose order the text forces — each
  step needs the one before it — and never one where two steps could swap.
  A lesson with no such sequence gets no `order` card; write `spot_error`
  instead. The explanation says what makes the order the only one.

Wrong options are the confusions a reader of this lesson actually has — the
neighbouring concept, the reversed direction, the dropped condition. The cards
of one batch test different points. Never name the lesson's sources, an
author or a book.
