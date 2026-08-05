"use client";

import { useSyncExternalStore } from "react";

import { lessonKey } from "@/lib/content/locator";

export interface LessonPosition {
  course: string;
  lesson: string;
  /** Slug of the heading the reader is currently under, if the lesson has any. */
  anchor: string | null;
}

// Where the reader is, kept outside React because two unrelated trees consume
// it: the table of contents highlights it, and the chat widget — mounted in
// the root layout, far from any lesson — sends it with every message.
let position: LessonPosition | null = null;
const listeners = new Set<() => void>();

export function setPosition(next: LessonPosition): void {
  position = next;
  listeners.forEach((listener) => listener());
}

export function clearPosition(course: string, lesson: string): void {
  // Leaving a lesson must not erase the position of the one just entered: on a
  // navigation both lessons are mounted for a moment, in no guaranteed order.
  if (position?.course !== course || position.lesson !== lesson) return;
  position = null;
  listeners.forEach((listener) => listener());
}

/** The reader's position in the locator namespace the harness tools speak. */
export function currentLocator(): string | null {
  if (position === null) return null;
  const anchor = position.anchor === null ? "" : `#${position.anchor}`;
  return `${lessonKey(position.course, position.lesson)}${anchor}`;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useLessonPosition(): LessonPosition | null {
  return useSyncExternalStore(
    subscribe,
    () => position,
    () => null,
  );
}
