"use client";

import { createStore } from "@/lib/store";

export interface Quote {
  /** What the reader selected, as one line. */
  text: string;
  /** Where they selected it: a lesson locator carrying the section's anchor. */
  locator: string;
}

/**
 * How many passages one message can carry. Past this the reader is sending the
 * lesson rather than referring to it. The backend holds the same bound
 * (`app/harness/prompts.QUOTE_COUNT`), since a cap a client keeps is not a cap.
 */
export const MAX_QUOTES = 8;

// Set from the lesson and read by the composer — two trees with no common
// ancestor, and the selections have to outlive the navigation that may open the
// panel.
const pending = createStore<Quote[]>([]);

function same(one: Quote, other: Quote): boolean {
  return one.text === other.text && one.locator === other.locator;
}

/**
 * Attach a passage to the message being written. Selecting the same passage
 * twice is not two references to it, and at the cap the oldest goes rather than
 * the add being refused: the reader is looking at the passage they just
 * selected, not at the one they attached eight selections ago.
 */
export function addQuote(quote: Quote): void {
  const held = pending.get();
  if (held.some((one) => same(one, quote))) return;
  pending.set([...held, quote].slice(-MAX_QUOTES));
}

export function dropQuote(quote: Quote): void {
  pending.set(pending.get().filter((one) => !same(one, quote)));
}

export function useQuotes(): Quote[] {
  return pending.use();
}

/**
 * The selections this message carries, and it carries them once.
 *
 * Sent as a field of the request beside the reader's position rather than
 * pasted into the message here: the backend puts each one above the question
 * inside its own `<untrusted>` fence (`app/harness/prompts.learner_quote`),
 * which is the one mitigation the design names for quoted content and is worth
 * nothing if the client writes it — a selection containing the closing tag
 * would end the fence and put the rest of itself back in the learner's voice.
 */
export function takeQuotes(): Quote[] {
  const quotes = pending.get();
  pending.set([]);
  return quotes;
}

// One fence per passage, each ending the line before the next begins.
const FENCE = /^<untrusted source="learner-quote">\n([\s\S]*?)\n<\/untrusted>\n\n/;
// What the backend puts under the passage inside that fence: the locator it
// was taken from, as the reference form the tutor writes too.
const CITED = /^([\s\S]*)\n>\n> — \[\[([^\]]+)\]\]$/;

function passage(body: string): Quote {
  const cited = CITED.exec(body);
  // A fence whose body is not in that shape is still the reader's passage —
  // only its origin is lost, and a quote with no locator is shown unlinked.
  const [quoted, locator] = cited === null ? [body, ""] : [cited[1], cited[2]];
  return {
    // Undoes the blockquote the fence body is written as, and the escaping that
    // stopped the selection closing the fence around it.
    text: quoted
      .replace(/^> ?/gm, "")
      .replace(/&lt;untrusted/g, "<untrusted")
      .replace(/&lt;\/untrusted/g, "</untrusted"),
    locator,
  };
}

export interface Quoted {
  quotes: Quote[];
  /** The question itself, with the fences above it taken off. */
  text: string;
}

/**
 * A stored message as the panel shows it: the fences the backend wrote around
 * the referenced passages are provenance for the model, not something to read,
 * so they come back out as the chips the composer attached them as.
 */
export function quoted(text: string): Quoted {
  const quotes: Quote[] = [];
  let rest = text;
  for (let fence = FENCE.exec(rest); fence !== null; fence = FENCE.exec(rest)) {
    quotes.push(passage(fence[1]));
    rest = rest.slice(fence[0].length);
  }
  return { quotes, text: rest };
}
