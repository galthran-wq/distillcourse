"use client";

import { useEffect } from "react";
import { anchorUnder, clearPosition, setPosition } from "@/lib/lesson/position";

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
  // changes, and re-running the listeners for a new reference is pointless.
  const ids = headings.join(" ");

  useEffect(() => {
    const order = ids === "" ? [] : ids.split(" ");
    // Looked up once: the ids are what the effect is keyed on, so the elements
    // they name do not change under it, and a scroll handler has no business
    // walking the document.
    const found = order.flatMap((id) => {
      const heading = document.getElementById(id);
      return heading === null ? [] : [{ id, heading }];
    });

    const measure = (): void => {
      const tops = found.map(({ id, heading }) => ({
        id,
        top: heading.getBoundingClientRect().top,
      }));
      const below =
        document.documentElement.scrollHeight - window.scrollY - window.innerHeight;
      setPosition({
        course,
        lesson,
        anchor: anchorUnder(tops, window.innerHeight, below),
      });
    };

    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    // Not every move of a heading is a scroll or a resize: an image settling,
    // a figure hydrating or a details block opening shifts the page under a
    // reader who has not touched it, and leaves the store naming a section
    // they are no longer in.
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);

    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      observer.disconnect();
      clearPosition(course, lesson);
    };
  }, [course, lesson, ids]);

  return null;
}
