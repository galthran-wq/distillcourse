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
 * Put the pending selection above the question, attributed to the section it
 * came from. The quote travels inside the message text rather than as a part
 * of its own because what the model is given and what the panel re-renders
 * after a reload are the same string: the stored message is the one the run
 * saw, and the Vercel adapter drops user parts that are not text.
 */
export function attachQuote(text: string): string {
  const quote = pending.get();
  if (quote === null) return text;
  pending.set(null);
  return `> ${quote.text}\n>\n> — [[${quote.locator}]]\n\n${text}`;
}
