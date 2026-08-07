"use client";

import { useEffect } from "react";
import { clearPosition, setPosition } from "@/lib/lesson/position";

interface Props {
  course: string;
  lesson: string;
  /** Heading ids in document order — the same ones the ToC links to. */
  headings: string[];
}

/**
 * The scroll spy: publishes which section the reader is in. Renders nothing —
 * the ToC and the chat widget both read the store it writes.
 */
export default function LessonPosition({ course, lesson, headings }: Props) {
  // The prop is a fresh array on every render; the ids are what actually
  // changes, and re-running the observer for a new reference is pointless.
  const ids = headings.join(" ");

  useEffect(() => {
    const order = ids === "" ? [] : ids.split(" ");
    setPosition({ course, lesson, anchor: order[0] ?? null });

    // Track the set of headings currently inside the top-quarter band and
    // deterministically report the one earliest in document order. When the
    // band is empty (e.g. mid-section prose), keep the previous one.
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        const first = order.find((id) => visible.has(id));
        if (first !== undefined) setPosition({ course, lesson, anchor: first });
      },
      { rootMargin: "-5% 0px -75% 0px" },
    );
    for (const id of order) {
      const heading = document.getElementById(id);
      if (heading !== null) observer.observe(heading);
    }

    return () => {
      observer.disconnect();
      clearPosition(course, lesson);
    };
  }, [course, lesson, ids]);

  return null;
}
