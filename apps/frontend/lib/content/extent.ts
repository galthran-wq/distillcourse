import type { Course, Lesson } from "./schema";

/** A lab's `est_minutes` is nominal; its `est_hours` is what it takes. */
export function lessonMinutes(lesson: Lesson): number {
  return lesson.lab !== undefined ? lesson.lab.est_hours * 60 : lesson.est_minutes;
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
  const minutes = lessons.reduce((sum, lesson) => sum + lessonMinutes(lesson), 0);
  return {
    parts: course.modules.length,
    lessons: lessons.length,
    hours: Math.round(minutes / 60),
  };
}
