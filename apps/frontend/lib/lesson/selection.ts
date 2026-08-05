import { sectionKey } from "@/lib/content/locator";
import { sectionAnchor } from "@/lib/lesson/anchor";

// Enough for a passage, not for the chapter a dragged pointer can cover.
const MAX_CHARS = 600;

export interface Passage {
  text: string;
  /** Where it was selected: a lesson locator carrying the section's anchor. */
  locator: string;
  /** Viewport coordinates of the top centre of the selection. */
  top: number;
  left: number;
}

/**
 * What the reader has selected in the lesson they are on, or nothing. The text
 * is one line: it is quoted into a chat message, where a blank line would end
 * the quote and hand the rest to the tutor as the reader's own words.
 */
export function selectedPassage(course: string, lesson: string): Passage | null {
  const selection = window.getSelection();
  if (selection === null || selection.isCollapsed || selection.rangeCount === 0) {
    return null;
  }
  const text = selection.toString().replace(/\s+/g, " ").trim();
  if (text === "") return null;

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
    left: box.left + box.width / 2,
  };
}
