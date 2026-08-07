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
  position.set(next);
}

export function clearPosition(course: string, lesson: string): void {
  const current = position.get();
  // Leaving a lesson must not erase the position of the one just entered: on a
  // navigation both lessons are mounted for a moment, in no guaranteed order.
  if (current?.course !== course || current.lesson !== lesson) return;
  position.set(null);
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
