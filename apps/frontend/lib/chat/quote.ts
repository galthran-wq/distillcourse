"use client";

import { setStoredQuotes, storedQuotes, useStoredQuotes } from "@/lib/chat/stored";

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

/**
 * Whatever was found, as passages. What is read back here was written by an
 * older version of this code, by the message the widget itself sent, or by
 * hand into the browser's storage, so neither the shape nor the count of it is
 * given.
 */
function asQuotes(value: unknown): Quote[] {
  if (!Array.isArray(value)) return [];
  return (value as unknown[])
    .filter(
      (one): one is Quote =>
        typeof one === "object" &&
        one !== null &&
        typeof (one as Quote).text === "string" &&
        typeof (one as Quote).locator === "string",
    )
    .slice(-MAX_QUOTES);
}

// Set from the lesson and read by the composer — two trees with no common
// ancestor, and the selections have to outlive the navigation that may open the
// panel. Stored beside the draft rather than held in memory: they and the
// question being written are one unsent message (`lib/chat/stored`).
function held(): Quote[] {
  return parse(storedQuotes());
}

function parse(json: string): Quote[] {
  try {
    return asQuotes(JSON.parse(json));
  } catch {
    // Nothing attached — the store spells absence "" — or something unreadable.
    return [];
  }
}

function put(quotes: Quote[]): void {
  setStoredQuotes(JSON.stringify(quotes));
}

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
  const quotes = held();
  if (quotes.some((one) => same(one, quote))) return;
  put([...quotes, quote].slice(-MAX_QUOTES));
}

export function dropQuote(quote: Quote): void {
  put(held().filter((one) => !same(one, quote)));
}

export function useQuotes(): Quote[] {
  return parse(useStoredQuotes());
}

// What the message in flight took with it. The composer is emptied as the
// request is built, and the request can still fail after that — the cap
// refuses it, the connection drops — with nowhere else to recover them from.
let spent: Quote[] = [];

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
  spent = held();
  put([]);
  return spent;
}

/**
 * The message they went with never got through. They go back on the composer,
 * ahead of anything selected since and under the same cap — the question is
 * still there to be asked again, and re-selecting eight passages is not what a
 * refusal should cost.
 */
export function restoreQuotes(): void {
  if (spent.length === 0) return;
  const since = held().filter((one) => !spent.some((taken) => same(taken, one)));
  put([...spent, ...since].slice(-MAX_QUOTES));
  spent = [];
}

/**
 * The passages a message was sent with, off the copy the composer built. Until
 * the stored form of it comes back — fences and all — that copy is all the
 * transcript has, and a message that shows its references only after a reload
 * is a message that lost them.
 */
export function attachedQuotes(metadata: unknown): Quote[] {
  if (typeof metadata !== "object" || metadata === null) return [];
  return asQuotes((metadata as { quotes?: unknown }).quotes);
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
  const [blockquote, locator] = cited === null ? [body, ""] : [cited[1], cited[2]];
  return {
    // Undoes the blockquote the fence body is written as, and the escaping that
    // stopped the selection closing the fence around it. The ampersand comes
    // out last, the order the backend escaped it in reversed: a passage that
    // spells out `&lt;untrusted` is text, not a tag. Messages stored before
    // that escaping still read, since undoing it is a no-op on them.
    text: blockquote
      .replace(/^> ?/gm, "")
      .replace(/&lt;untrusted/g, "<untrusted")
      .replace(/&lt;\/untrusted/g, "</untrusted")
      .replace(/&amp;/g, "&"),
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
