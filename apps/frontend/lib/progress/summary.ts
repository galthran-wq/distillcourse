import type { Standing } from "./api";

/** A lesson the reader can open, in course order. Planned lessons are never one. */
export interface ReadableLesson {
  slug: string;
  title: string;
}

export interface CourseProgress {
  read: number;
  total: number;
  /** The first readable lesson in course order not yet read; absent once all are. */
  next?: ReadableLesson;
  /** Epoch milliseconds of the latest visit to any of its lessons. */
  lastSeen: number;
}

export type Standings = Map<string, Standing>;

export function byLesson(standings: Standing[]): Standings {
  return new Map(standings.map((standing) => [standing.lesson, standing]));
}

/**
 * How far the reader is through one course, counted over what can be read;
 * `null` for a course they have not started, which shows nothing at all.
 */
export function courseProgress(
  course: string,
  lessons: ReadableLesson[],
  standings: Standings,
): CourseProgress | null {
  const mine = lessons.map((lesson) => standings.get(`${course}/${lesson.slug}`));
  const seen = mine.filter((standing) => standing !== undefined);
  if (seen.length === 0) return null;
  return {
    read: seen.filter((standing) => standing.state === "read").length,
    total: lessons.length,
    next: lessons.find((_, i) => mine[i]?.state !== "read"),
    lastSeen: Math.max(...seen.map((standing) => Date.parse(standing.last_seen))),
  };
}

/**
 * Started courses first, most recently read first; the rest keep the order
 * they came in.
 */
export function startedFirst<T>(
  courses: T[],
  progressOf: (course: T) => CourseProgress | null,
): T[] {
  const started = courses
    .map((course) => ({ course, progress: progressOf(course) }))
    .filter((entry) => entry.progress !== null)
    .sort((a, b) => b.progress!.lastSeen - a.progress!.lastSeen)
    .map((entry) => entry.course);
  return [...started, ...courses.filter((course) => !started.includes(course))];
}
