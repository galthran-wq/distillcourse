import type { ReadableLesson } from "../progress/summary";
import { STATUS_RANK, type LoadedLesson } from "./load";

/**
 * The single visibility rule. It lives outside site.ts (which is
 * `server-only`) so that build scripts — the content index export above all —
 * can apply the very predicate the site renders with instead of a copy that
 * drifts.
 *
 * Production renders `published` lessons only. Dev — and any deployment with
 * CONTENT_PREVIEW=1 (the personal-server staging mode) — also renders
 * `drafted` and `reviewed` so the authoring loop can review in the real site.
 * `planned` lessons are listed as upcoming but never render.
 */
export function previewMode(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.CONTENT_PREVIEW === "1"
  );
}

export function isReadable(lesson: LoadedLesson): boolean {
  const min = previewMode() ? STATUS_RANK.drafted : STATUS_RANK.published;
  return STATUS_RANK[lesson.lesson.status] >= min && lesson.mdx !== undefined;
}

/** What a reader can open, in course order: what reading progress counts over. */
export function readableLessons(lessons: LoadedLesson[]): ReadableLesson[] {
  return lessons
    .filter(isReadable)
    .map(({ lesson }) => ({ slug: lesson.slug, title: lesson.title }));
}
