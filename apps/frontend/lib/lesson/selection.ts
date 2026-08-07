import { sectionKey } from "@/lib/content/locator";
import { sectionAnchor } from "@/lib/lesson/anchor";

// Enough for a passage, not for the chapter a dragged pointer can cover.
const MAX_CHARS = 600;

export interface Passage {
  text: string;
  /** Where it was selected: a lesson locator carrying the section's anchor. */
  locator: string;
  /** Viewport coordinates of the selection: its edges and its horizontal centre. */
  top: number;
  bottom: number;
  left: number;
}

/** Nothing is selected: no range, a bare caret, or whitespace alone. */
export function selectionEmpty(): boolean {
  const selection = window.getSelection();
  return (
    selection === null ||
    selection.rangeCount === 0 ||
    selection.isCollapsed ||
    selection.toString().trim() === ""
  );
}

/**
 * What the reader has selected in the lesson they are on, or nothing. The text
 * is one line: it is quoted into a chat message, where a blank line would end
 * the quote and hand the rest to the tutor as the reader's own words.
 */
export function selectedPassage(course: string, lesson: string): Passage | null {
  const selection = window.getSelection();
  if (selection === null || selectionEmpty()) return null;
  const text = selection.toString().replace(/\s+/g, " ").trim();

  const range = selection.getRangeAt(0);
  const start = range.startContainer;
  const element = start instanceof Element ? start : start.parentElement;
  // Only the lesson text is quotable: a locator names a place in the material,
  // and the header, the navigation and the panel itself are not in it.
  if (element === null || element.closest(".prose-lesson") === null) return null;

  const box = range.getBoundingClientRect();
  return {
    text: text.length > MAX_CHARS ? `${text.slice(0, MAX_CHARS)}…` : text,
    locator: sectionKey(course, lesson, sectionAnchor(element)),
    top: box.top,
    bottom: box.bottom,
    left: box.left + box.width / 2,
  };
}

// The button that offers the passage is placed against the selection rather
// than laid out, so its height is fixed here and set on the element: a clamp
// cannot be computed from a height layout has not produced yet.
export const BUTTON_HEIGHT = 28;
const GAP = 8;

/**
 * Where that button goes: above the selection when there is room, below it
 * otherwise, and inside the viewport either way. A selection dragged past the
 * fold starts above the viewport — the browser scrolls under the held pointer
 * — so `top` is routinely negative, and a button placed off-screen is one the
 * reader cannot press.
 */
export function buttonPosition(passage: Passage): { top: number; left: number } {
  const above = passage.top - GAP - BUTTON_HEIGHT;
  const lowest = window.innerHeight - GAP - BUTTON_HEIGHT;
  const top = above >= GAP ? above : Math.min(passage.bottom + GAP, lowest);
  return { top: Math.max(top, GAP), left: passage.left };
}
