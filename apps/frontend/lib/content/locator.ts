// `lesson:<course>/<lesson>` — the identity the index gives a lesson
// (index-export.ts) and the key the backend stores every bit of user state
// under: a reading event, a rating, a bookmark and a search hit all name a
// lesson with this string, so it is composed in exactly one place.
// Mirrors app/content/locators.py on the backend.
export const LESSON_PREFIX = "lesson:";

export function lessonKey(courseSlug: string, lessonSlug: string): string {
  return `${LESSON_PREFIX}${courseSlug}/${lessonSlug}`;
}

/** `<course>/<lesson>`: the lesson key without its corpus, as `GET /progress` names it. */
export function lessonPath(courseSlug: string, lessonSlug: string): string {
  return lessonKey(courseSlug, lessonSlug).slice(LESSON_PREFIX.length);
}

/**
 * The id `<Conclusion>` renders with. It is a component rather than a heading,
 * so rehype-slug never assigns it and the content index has to be told it
 * exists — from here, so the page and the index cannot name it differently.
 */
export const CONCLUSION_ANCHOR = "conclusion";

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

const COURSE = new RegExp(`^course:(${SLUG})$`);

/** A corpus of the index (index-export.ts) — the prefix of every locator. */
export type Corpus = "lesson" | "research" | "concept" | "course";

// What the reader gets for a locator in each corpus: a page of the site to
// open, or a source that can only say where the claim came from. The tutor
// cites what a tool returned and `search_content` searches every corpus by
// default, so all of them have to be here — exhaustive over `Corpus` on
// purpose, so a corpus added to the index does not compile until it is
// given a rendering.
const RENDERING: Record<Corpus, "page" | "source"> = {
  lesson: "page",
  course: "page",
  research: "source",
  concept: "source",
};

const SOURCE_CORPORA = Object.entries(RENDERING)
  .filter(([, rendering]) => rendering === "source")
  .map(([corpus]) => `${corpus}:`);

export interface LessonParts {
  course: string;
  lesson: string;
  anchor: string | null;
}

/**
 * A `lesson:` locator taken apart. The one place the grammar above is read
 * backwards, for the callers that want the two slugs rather than the key they
 * compose into — the `@`-autocomplete, which offers a course before it offers
 * a lesson of it.
 */
export function lessonParts(locator: string): LessonParts | null {
  const match = LESSON_SECTION.exec(locator);
  if (match === null) return null;
  const [, course, lesson, anchor] = match;
  return { course, lesson, anchor: anchor ?? null };
}

export interface LessonLocator {
  /** The lesson it names, under the key the rest of the platform uses. */
  key: string;
  anchor: string | null;
}

export function parseLessonLocator(locator: string): LessonLocator | null {
  const parts = lessonParts(locator);
  if (parts === null) return null;
  return { key: lessonKey(parts.course, parts.lesson), anchor: parts.anchor };
}

/** The course a `course:` locator names, or null when it names something else. */
export function parseCourseLocator(locator: string): string | null {
  const match = COURSE.exec(locator);
  return match === null ? null : match[1];
}

export function isSourceLocator(locator: string): boolean {
  return SOURCE_CORPORA.some((corpus) => locator.startsWith(corpus));
}
