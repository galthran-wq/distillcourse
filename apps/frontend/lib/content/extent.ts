import type { Course, Lesson } from "./schema";

/** A lab's `est_minutes` is nominal; its `est_hours` is what it takes. */
export function minutesOf(lessons: Lesson[]): number {
  return lessons.reduce(
    (sum, lesson) =>
      sum + (lesson.lab !== undefined ? lesson.lab.est_hours * 60 : lesson.est_minutes),
    0,
  );
}

export interface CourseExtent {
  parts: number;
  lessons: number;
  hours: number;
}

/**
 * The course as planned, not as written so far: planned lessons count, so a
 * reader is never told how much of it exists yet.
 */
export function courseExtent(course: Course): CourseExtent {
  const lessons = course.modules.flatMap((mod) => mod.lessons);
  return {
    parts: course.modules.length,
    lessons: lessons.length,
    hours: Math.round(minutesOf(lessons) / 60),
  };
}
