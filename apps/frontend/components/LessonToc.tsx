"use client";

import { useLessonPosition } from "@/lib/lesson/position";
import type { TocEntry } from "@/lib/content/toc";

export default function LessonToc({ toc }: { toc: TocEntry[] }) {
  // Before the spy's first report, highlight the first heading so the column
  // is never blank.
  const active = useLessonPosition()?.anchor ?? toc[0]?.id ?? null;

  return (
    <nav className="lesson-toc mt-10" aria-label="Contents">
      <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-faint">
        Contents
      </p>
      {toc.map((h) => (
        <a
          key={h.id}
          href={`#${h.id}`}
          className={`${h.depth === 3 ? "toc-h3 " : ""}${active === h.id ? "active" : ""}`}
        >
          {h.text}
        </a>
      ))}
    </nav>
  );
}
