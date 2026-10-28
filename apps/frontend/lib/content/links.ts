"use client";

import { createContext, useContext } from "react";
import { lessonParts } from "@/lib/content/locator";
import type { LessonLink } from "@/lib/content/site";

/** Every lesson the site renders, keyed by its `lesson:` locator. */
export type Lessons = Record<string, LessonLink>;

/**
 * The build knows which lessons exist and what they are called; the tutor only
 * writes locators, so this is what a reference in a message is resolved
 * against. Empty by default: a locator then stays text rather than becoming a
 * link to a page that is not there.
 */
const context = createContext<Lessons>({});

export const LessonsProvider = context.Provider;

export function useLessons(): Lessons {
  return useContext(context);
}

/**
 * Every course with a readable lesson, slug to title, in the site's order.
 * The lesson set is all the client is handed, and each lesson names its course.
 */
export function courseNames(lessons: Lessons): Map<string, string> {
  const named = new Map<string, string>();
  for (const [key, link] of Object.entries(lessons)) {
    const path = lessonParts(key);
    if (path !== null && !named.has(path.course)) named.set(path.course, link.course);
  }
  return named;
}
