"use client";

import type { ReadableLesson } from "@/lib/content/visibility";
import { useCourseProgress } from "@/lib/progress/context";

/** ` · 7 of 23 read` on the course's quiet line, once the reader has started it. */
export default function CourseReadCount({
  course,
  lessons,
}: {
  course: string;
  lessons: ReadableLesson[];
}) {
  const progress = useCourseProgress(course, lessons);
  if (progress === null) return null;
  return (
    <>
      {" · "}
      <span className="font-medium text-ink">{progress.read}</span> of{" "}
      <span className="font-medium text-ink">{progress.total}</span> read
    </>
  );
}
