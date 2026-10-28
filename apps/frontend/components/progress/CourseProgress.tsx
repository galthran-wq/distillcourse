"use client";

import type { ReadableLesson } from "@/lib/content/visibility";
import { useCourseProgress } from "@/lib/progress/context";
import ReadCount from "./ReadCount";

/** The course page's header line; absent for a course the reader has not started. */
export default function CourseProgress({
  course,
  lessons,
}: {
  course: string;
  lessons: ReadableLesson[];
}) {
  const progress = useCourseProgress(course, lessons);
  if (progress === null) return null;
  return (
    <div className="mt-4">
      <ReadCount course={course} progress={progress} />
    </div>
  );
}
