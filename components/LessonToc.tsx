"use client";

import { useEffect, useState } from "react";
import type { TocEntry } from "@/lib/content/toc";

export default function LessonToc({ toc }: { toc: TocEntry[] }) {
  // Initialize to the first heading so something is highlighted on mount.
  const [active, setActive] = useState<string | null>(toc[0]?.id ?? null);

  useEffect(() => {
    const order = toc.map((t) => t.id);
    const headings = order
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (headings.length === 0) return;

    // Track the set of headings currently inside the top-quarter band and
    // deterministically highlight the one earliest in ToC order. When the
    // band is empty (e.g. mid-section prose), keep the previous active id.
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        const first = order.find((id) => visible.has(id));
        if (first !== undefined) setActive(first);
      },
      { rootMargin: "-5% 0px -75% 0px" },
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [toc]);

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
