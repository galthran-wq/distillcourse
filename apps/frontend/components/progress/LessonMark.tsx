"use client";

import { LABEL_CLASS } from "@/components/ui/styles";
import { useProgress } from "@/lib/progress/context";

/** ✓ for a lesson read, a hollow dot for one started, nothing for one unopened. */
export default function LessonMark({ lesson }: { lesson: string }) {
  const state = useProgress()?.get(lesson)?.state;
  if (state === undefined) return null;
  return state === "read" ? (
    <span className={`${LABEL_CLASS} text-accent`} title="Read">
      ✓
    </span>
  ) : (
    <span
      className="inline-block size-2 rounded-full border border-accent"
      title="Started"
    />
  );
}
