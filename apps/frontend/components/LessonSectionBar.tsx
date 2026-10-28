"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { ChevronIcon } from "@/components/chat/icons";
import {
  LABEL_CLASS,
  MENU_ROW_CLASS,
  POPOVER_CLASS,
} from "@/components/ui/styles";
import type { TocEntry } from "@/lib/content/toc";
import { articleProgress, sectionAt, useLessonPosition } from "@/lib/lesson/position";
import { useDismiss } from "@/lib/ui/dismiss";
import { oncePerFrame } from "@/lib/ui/frame";

interface Props {
  /** The lesson's two-digit number, as its header prints it. */
  number: string;
  toc: TocEntry[];
}

/**
 * Where the reader is, for a screen too narrow for the contents column: the
 * section they are in, how far through the lesson, and the contents one press
 * away. Placed right under the lesson header, which it stands in for once the
 * header has scrolled away: what it watches is the header's bottom edge, a
 * line with no box of its own, so the page's layout does not change for it.
 */
export default function LessonSectionBar({ number, toc }: Props) {
  const edge = useRef<HTMLDivElement>(null);
  const [past, setPast] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      // Out of view is past it only when it went out over the top.
      setPast(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(edge.current as HTMLDivElement);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={edge} aria-hidden />
      {past && toc.some((h) => h.depth === 2) && (
        <Bar number={number} toc={toc} edge={edge} />
      )}
    </>
  );
}

function Bar({
  number,
  toc,
  edge,
}: {
  number: string;
  toc: TocEntry[];
  edge: RefObject<HTMLDivElement | null>;
}) {
  const anchor = useLessonPosition()?.anchor ?? null;
  const section = sectionAt(toc, anchor);
  const sections = toc.filter((h) => h.depth === 2);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useDismiss(open, root, setOpen);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const article = edge.current?.closest("article");
    if (article == null) return;
    const measure = (): void => {
      const box = article.getBoundingClientRect();
      setProgress(articleProgress(box.top, box.height, window.innerHeight));
    };
    const { schedule, cancel } = oncePerFrame(measure);
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancel();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [edge]);

  return (
    <div
      ref={root}
      className="fixed inset-x-0 top-0 z-30 border-b border-line bg-paper pt-[env(safe-area-inset-top)] transition-opacity duration-(--motion-fast) starting:opacity-0 lg:hidden"
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex w-full items-baseline gap-3 px-6 py-2.5 text-left"
      >
        <span className="shrink-0 text-[11.5px] tabular-nums text-faint">
          {section === null ? number : `${number} · §${section.ordinal}`}
        </span>
        <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-ink">
          {section?.entry.text ?? "Contents"}
        </span>
        <ChevronIcon
          className={`size-3.5 shrink-0 self-center text-faint transition-[rotate] duration-(--motion-fast) ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <span
        aria-hidden
        className="absolute -bottom-px left-0 h-px bg-ink"
        style={{ width: `${progress * 100}%` }}
      />
      {open && (
        <nav
          aria-label="Contents"
          className={`${POPOVER_CLASS} inset-x-0 top-full max-h-[70vh] origin-top overflow-y-auto p-1.5`}
        >
          <p className={`flex justify-between px-2.5 pt-1.5 pb-2 ${LABEL_CLASS}`}>
            <span>Contents</span>
            <span>
              {sections.length} {sections.length === 1 ? "section" : "sections"}
            </span>
          </p>
          {toc.map((h) => (
            <a
              key={h.id}
              href={`#${h.id}`}
              onClick={() => setOpen(false)}
              className={`${MENU_ROW_CLASS} items-baseline ${
                h.id === anchor ? "font-semibold text-ink" : "text-soft"
              }`}
            >
              <span className="w-[1.6rem] shrink-0 tabular-nums text-faint">
                {h.depth === 2 ? sectionAt(toc, h.id)?.ordinal : ""}
              </span>
              <span className={h.depth === 3 ? "pl-3" : undefined}>{h.text}</span>
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}
