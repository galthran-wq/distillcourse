// `lesson:<course>/<lesson>` — the identity the index gives a lesson
// (index-export.ts) and the key the backend stores every bit of user state
// under: a reading event, a rating, a bookmark and a search hit all name a
// lesson with this string, so it is composed in exactly one place.
// Mirrors app/content/locators.py on the backend.
export const LESSON_PREFIX = "lesson:";

export function lessonKey(courseSlug: string, lessonSlug: string): string {
  return `${LESSON_PREFIX}${courseSlug}/${lessonSlug}`;
}

/** A place inside a lesson: the lesson key with the section's anchor on it. */
export function sectionKey(
  courseSlug: string,
  lessonSlug: string,
  anchor: string | null,
): string {
  const key = lessonKey(courseSlug, lessonSlug);
  return anchor === null || anchor === "" ? key : `${key}#${anchor}`;
}

// The same grammar as app/content/locators.py, including its bounds: a locator
// the tutor writes into an answer is matched against this before it becomes a
// link, so widening it here widens what a message can point the reader at.
const SLUG = "[a-z0-9-]{1,80}";
const LESSON_SECTION = new RegExp(
  `^${LESSON_PREFIX}(${SLUG})/(${SLUG})(?:#([^\\s#]{1,200}))?$`,
);

// Corpora that have no page on the site: the tutor may cite them, and the
// reader can only be shown where the claim came from.
const SOURCE_CORPORA = ["research:", "pdf:"];

export interface LessonLocator {
  /** The lesson it names, under the key the rest of the platform uses. */
  key: string;
  anchor: string | null;
}

export function parseLessonLocator(locator: string): LessonLocator | null {
  const match = LESSON_SECTION.exec(locator);
  if (match === null) return null;
  const [, course, lesson, anchor] = match;
  return { key: lessonKey(course, lesson), anchor: anchor ?? null };
}

export function isSourceLocator(locator: string): boolean {
  return SOURCE_CORPORA.some((corpus) => locator.startsWith(corpus));
}
