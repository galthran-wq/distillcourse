"use client";

import { createStore } from "@/lib/store";

export interface Quote {
  /** What the reader selected, as one line. */
  text: string;
  /** Where they selected it: a lesson locator carrying the section's anchor. */
  locator: string;
}

// Set from the lesson and read by the composer — two trees with no common
// ancestor, and the selection has to outlive the navigation that may open the
// panel.
const pending = createStore<Quote | null>(null);

export function setQuote(quote: Quote): void {
  pending.set(quote);
}

export function dropQuote(): void {
  pending.set(null);
}

export function useQuote(): Quote | null {
  return pending.use();
}

/**
 * The selection this message carries, if any, and it carries it once.
 *
 * Sent as a field of the request beside the reader's position rather than
 * pasted into the message here: the backend puts it above the question inside
 * an `<untrusted>` fence (`app/harness/prompts.learner_quote`), which is the
 * one mitigation the design names for quoted content and is worth nothing if
 * the client writes it — a selection containing the closing tag would end the
 * fence and put the rest of itself back in the learner's voice.
 */
export function takeQuote(): Quote | null {
  const quote = pending.get();
  pending.set(null);
  return quote;
}

const FENCE = /^<untrusted source="learner-quote">\n([\s\S]*?)\n<\/untrusted>\n\n/;

/**
 * A stored message as the panel shows it: the fence the backend wrote around
 * the quoted passage is provenance for the model, not something to read, and
 * what is inside it is already a markdown blockquote.
 */
export function unfenced(text: string): string {
  return text.replace(FENCE, "$1\n\n");
}
