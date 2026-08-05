// `lesson:<course>/<lesson>` — the identity the index gives a lesson
// (index-export.ts) and the key the backend stores every bit of user state
// under: a reading event, a rating, a bookmark and a search hit all name a
// lesson with this string, so it is composed in exactly one place.
// Mirrors app/content/locators.py on the backend.
export const LESSON_PREFIX = "lesson:";

export function lessonKey(courseSlug: string, lessonSlug: string): string {
  return `${LESSON_PREFIX}${courseSlug}/${lessonSlug}`;
}
