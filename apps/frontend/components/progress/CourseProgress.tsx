"use client";

import Link from "next/link";
import { LABEL_CLASS } from "@/components/ui/styles";
import { useProgress } from "@/lib/progress/context";
import {
  courseProgress,
  type CourseProgress as Progress,
  type ReadableLesson,
} from "@/lib/progress/summary";

/**
 * `7 of 23 read` and where to pick up. `relative` so that inside a card whose
 * title link covers the whole card, this link still takes its own clicks.
 */
export function ReadCount({ course, progress }: { course: string; progress: Progress }) {
  return (
    <span className="relative flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <span className={LABEL_CLASS}>
        {progress.read} of {progress.total} read
      </span>
      {progress.next !== undefined && (
        <Link
          href={`/courses/${course}/lessons/${progress.next.slug}`}
          className="text-[0.9rem] text-accent hover:underline"
        >
          Continue: {progress.next.title}
        </Link>
      )}
    </span>
  );
}

/** The course page's header line; absent for a course the reader has not started. */
export default function CourseProgress({
  course,
  lessons,
}: {
  course: string;
  lessons: ReadableLesson[];
}) {
  const standings = useProgress();
  const progress = standings === null ? null : courseProgress(course, lessons, standings);
  if (progress === null) return null;
  return (
    <div className="mt-4">
      <ReadCount course={course} progress={progress} />
    </div>
  );
}
