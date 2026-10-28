"use client";

import Link from "next/link";
import type { ReadableLesson } from "@/lib/content/visibility";
import { useCourseProgress } from "@/lib/progress/context";
import ReadCount from "./ReadCount";

/**
 * The course page's header line: how far the reader is, or — for a course
 * they have not started, and for anyone not signed in — where to begin.
 */
export default function CourseProgress({
  course,
  lessons,
}: {
  course: string;
  lessons: ReadableLesson[];
}) {
  const progress = useCourseProgress(course, lessons);
  const first = lessons[0];
  if (progress !== null) {
    return (
      <div className="mt-4">
        <ReadCount course={course} progress={progress} />
      </div>
    );
  }
  if (first === undefined) return null;
  return (
    <div className="mt-4">
      <Link
        href={`/courses/${course}/lessons/${first.slug}`}
        className="text-[0.9rem] text-accent hover:underline"
      >
        Start with: {first.title}
      </Link>
    </div>
  );
}
