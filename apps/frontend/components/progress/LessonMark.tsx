"use client";

import { LABEL_CLASS } from "@/components/ui/styles";
import { useProgress } from "@/lib/progress/context";

/** ✓ for a lesson read, a hollow dot for one started, nothing for one unopened. */
export default function LessonMark({ lesson }: { lesson: string }) {
  const state = useProgress()?.get(lesson)?.state;
  if (state === undefined) return null;
  return state === "read" ? (
    <span role="img" aria-label="Read" title="Read" className={`${LABEL_CLASS} text-accent`}>
      ✓
    </span>
  ) : (
    <span
      role="img"
      aria-label="Started"
      title="Started"
      className="inline-block size-2 rounded-full border border-accent"
    />
  );
}
