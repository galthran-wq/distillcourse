import { lessonPath } from "@/lib/content/locator";
import type { ReadableLesson } from "@/lib/content/visibility";
import type { Standing } from "./api";

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
  const mine = lessons.map((lesson) => standings.get(lessonPath(course, lesson.slug)));
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

export interface ModuleFolds {
  /** The module that opens by default; `null` once every one is read. */
  open: number | null;
  /** Per module: it has something to read and all of it is read. */
  done: boolean[];
}

/**
 * Which of a course's modules open by default: the one holding where the
 * reader picks up. Before there is any progress to go on — anonymous, not
 * started, not answered yet — that is the first module, which is also what
 * the server renders, so a first-time reader sees nothing move. A planned
 * lesson is not in `modules` and so never keeps a module from being done.
 */
export function moduleFolds(
  course: string,
  modules: ReadableLesson[][],
  standings: Standings | null,
): ModuleFolds {
  const progress = standings && courseProgress(course, modules.flat(), standings);
  if (!standings || !progress) return { open: 0, done: modules.map(() => false) };
  const read = (lesson: ReadableLesson) =>
    standings.get(lessonPath(course, lesson.slug))?.state === "read";
  const { next } = progress;
  return {
    open: next === undefined ? null : modules.findIndex((lessons) => lessons.includes(next)),
    done: modules.map((lessons) => lessons.length > 0 && lessons.every(read)),
  };
}
