"use client";

import { sectionKey } from "@/lib/content/locator";
import { createStore } from "@/lib/store";

export interface LessonPosition {
  course: string;
  lesson: string;
  /** Slug of the heading the reader is currently under, if the lesson has any. */
  anchor: string | null;
}

// Where the reader is, kept outside React because two unrelated trees consume
// it: the table of contents highlights it, and the chat widget — mounted in
// the root layout, far from any lesson — sends it with every message.
const position = createStore<LessonPosition | null>(null);

export function setPosition(next: LessonPosition): void {
  // Measured on every scroll event, so most calls carry the position the store
  // already holds; writing it anyway would re-render every consumer at the
  // frame rate of the scroll.
  const current = position.get();
  if (
    current?.course === next.course &&
    current.lesson === next.lesson &&
    current.anchor === next.anchor
  ) {
    return;
  }
  position.set(next);
}

export function clearPosition(course: string, lesson: string): void {
  const current = position.get();
  // Leaving a lesson must not erase the position of the one just entered: on a
  // navigation both lessons are mounted for a moment, in no guaranteed order.
  if (current?.course !== course || current.lesson !== lesson) return;
  position.set(null);
}

export interface HeadingTop {
  id: string;
  /** Its distance from the top of the viewport, as the browser reports it. */
  top: number;
}

// Where in the viewport a reader is taken to be reading.
const READING_LINE = 0.25;
// How close to the bottom of the document counts as the bottom of it: browsers
// report fractional scroll offsets, so an exact zero never arrives.
const FOOT = 2;

/**
 * Which heading the reader is under, measured from the page: the last one at
 * or above the reading line, and the first while they are still above it —
 * the top of a lesson is where its opening section is about to be read.
 *
 * Measured rather than tracked as headings cross a band, because a band only
 * ever sees the headings a slow enough scroll carries through it: a flick, a
 * jump to an anchor and every scroll back upwards leave the reader in a
 * section the band was never told about.
 */
export function anchorUnder(
  headings: readonly HeadingTop[],
  height: number,
  below: number,
): string | null {
  // At the foot of the page, and only there, the line drops to the bottom of
  // the viewport: no scrolling is left to bring the closing section up to a
  // quarter down, and it is on screen and being read all the same. Sliding it
  // over the whole last screenful instead would report that section while the
  // reader is still a section above it.
  const line = below <= FOOT ? height : height * READING_LINE;
  let current: string | null = headings[0]?.id ?? null;
  for (const heading of headings) {
    if (heading.top > line) break;
    current = heading.id;
  }
  return current;
}

/** The reader's position in the locator namespace the harness tools speak. */
export function currentLocator(): string | null {
  const current = position.get();
  if (current === null) return null;
  return sectionKey(current.course, current.lesson, current.anchor);
}

export function useLessonPosition(): LessonPosition | null {
  return position.use();
}
