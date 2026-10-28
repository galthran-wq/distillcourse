"use client";

import { LABEL_CLASS } from "@/components/ui/styles";
import type { ReadableLesson } from "@/lib/content/visibility";
import { useCourseProgress } from "@/lib/progress/context";

/**
 * One row of the course's contents, banded when it is where the reader begins:
 * the first readable lesson until there is progress to go on — which is also
 * what the server renders, so a first-time reader sees nothing move — then the
 * next unread one, and no row at all once everything readable is read.
 */
export default function StartHere({
  course,
  lessons,
  slug,
  children,
}: {
  course: string;
  lessons: ReadableLesson[];
  slug: string;
  children: React.ReactNode;
}) {
  const progress = useCourseProgress(course, lessons);
  const marked = progress === null ? lessons[0] : progress.next;
  if (marked?.slug !== slug) {
    return <li className="list-none border-b border-line/60 last:border-b-0">{children}</li>;
  }
  return (
    <li className="-mx-3 list-none rounded-sm bg-panel px-3 pt-2.5">
      {/* `!`: LABEL_CLASS carries text-faint, and two colour utilities
          resolve by stylesheet order, where faint wins. */}
      <p className={`${LABEL_CLASS} text-ink!`}>
        {progress === null ? "Start here" : "Continue here"}
      </p>
      {children}
    </li>
  );
}
