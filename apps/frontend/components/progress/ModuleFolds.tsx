"use client";

import { LABEL_CLASS } from "@/components/ui/styles";
import type { ReadableLesson } from "@/lib/content/visibility";
import { useProgress } from "@/lib/progress/context";
import { moduleFolds } from "@/lib/progress/summary";

export interface ModuleFold {
  slug: string;
  readable: ReadableLesson[];
  /** The module's heading: its number and title. */
  heading: React.ReactNode;
  /** How much is in it, set to the right of the heading. */
  extent: React.ReactNode;
  lessons: React.ReactNode;
}

/**
 * The course's modules, each folded unless it holds where the reader picks
 * up. Folded is only hidden: the lesson rows are in the HTML either way. The
 * default is worked out afresh on every visit, and a reader's own clicks are
 * theirs until they leave.
 */
export default function ModuleFolds({
  course,
  modules,
}: {
  course: string;
  modules: ModuleFold[];
}) {
  const folds = moduleFolds(
    course,
    modules.map((mod) => mod.readable),
    useProgress(),
  );
  return modules.map((mod, i) => (
    <details key={mod.slug} open={i === folds.open} className="fold group/fold mt-5 first:mt-0">
      <summary className="flex cursor-pointer list-none flex-wrap items-baseline gap-x-3 gap-y-1 py-1 [&::-webkit-details-marker]:hidden">
        {mod.heading}
        {folds.done[i] && (
          <span className={`${LABEL_CLASS} text-accent`}>✓ done</span>
        )}
        <span className="ml-auto flex items-baseline gap-3 font-mono text-[11px] text-faint">
          {mod.extent}
          <span
            aria-hidden
            className="inline-block transition-transform duration-(--motion-fast) group-open/fold:rotate-90"
          >
            ›
          </span>
        </span>
      </summary>
      {mod.lessons}
    </details>
  ));
}
