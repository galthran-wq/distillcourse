"use client";

import { ChevronIcon } from "@/components/chat/icons";
import { LABEL_CLASS } from "@/components/ui/styles";
import type { ReadableLesson } from "@/lib/content/visibility";
import { useProgress } from "@/lib/progress/context";
import { moduleFolds } from "@/lib/progress/summary";

export interface ModuleFold {
  slug: string;
  readable: ReadableLesson[];
  /** Every lesson in it is still to be written: shaded, and nothing more. */
  planned: boolean;
  heading: React.ReactNode;
  extent: React.ReactNode;
  lessons: React.ReactNode;
}

/** The mark on every fold of the course page, turned down while it is open. */
export function FoldChevron() {
  return (
    <ChevronIcon className="size-3 shrink-0 self-center -rotate-90 text-faint transition-transform duration-(--motion-fast) group-open/fold:rotate-0" />
  );
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
      <summary
        className={`flex cursor-pointer list-none flex-wrap items-baseline gap-x-3 gap-y-1 py-1 [&::-webkit-details-marker]:hidden ${mod.planned ? "text-faint" : ""}`}
      >
        {mod.heading}
        {folds.done[i] && (
          // `!`: LABEL_CLASS carries text-faint, and two colour utilities
          // resolve by stylesheet order, where faint wins.
          <span className={`${LABEL_CLASS} text-accent!`}>✓ done</span>
        )}
        <span className="ml-auto flex items-baseline gap-3 text-[0.8rem] tabular-nums text-faint">
          {mod.extent}
          <FoldChevron />
        </span>
      </summary>
      {mod.lessons}
    </details>
  ));
}
