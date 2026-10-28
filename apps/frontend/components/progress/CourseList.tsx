"use client";

import Link from "next/link";
import type { ReadableLesson } from "@/lib/content/visibility";
import { useProgress } from "@/lib/progress/context";
import { courseProgress, startedFirst } from "@/lib/progress/summary";
import ReadCount from "./ReadCount";

export interface CourseCard {
  slug: string;
  title: string;
  tagline: string;
  lessons: ReadableLesson[];
}

/** The course list, the reader's own courses first, each with how far they are. */
export default function CourseList({ courses }: { courses: CourseCard[] }) {
  const standings = useProgress();
  const progressOf = new Map(
    courses.map((card) => [
      card,
      standings === null ? null : courseProgress(card.slug, card.lessons, standings),
    ]),
  );

  return (
    <ul className="flex flex-col gap-3">
      {startedFirst(courses, (card) => progressOf.get(card)!).map((card) => {
        const progress = progressOf.get(card)!;
        return (
          <li
            key={card.slug}
            // The title link is stretched over the card rather than wrapping
            // it, so the card can carry a second link (Continue) of its own.
            className="group relative flex flex-col gap-2 rounded-md border border-line bg-paper px-5 py-4 transition-[color,border-color,box-shadow,translate] duration-(--motion-base) hover:-translate-y-0.5 hover:border-faint hover:shadow-card"
          >
            <span className="flex items-baseline justify-between gap-4">
              <Link
                href={`/courses/${card.slug}`}
                className="text-lg font-semibold tracking-tight after:absolute after:inset-0 after:rounded-md group-hover:text-accent"
              >
                {card.title}
              </Link>
              <span
                aria-hidden
                className="shrink-0 text-faint transition-colors duration-(--motion-base) group-hover:text-accent"
              >
                →
              </span>
            </span>
            <span className="text-[0.95rem] text-soft">{card.tagline}</span>
            {progress !== null && (
              <span className="mt-1 flex flex-col gap-2">
                <span aria-hidden className="h-1 rounded-full bg-line">
                  <span
                    className="block h-full rounded-full bg-accent"
                    style={{ width: `${(progress.read / progress.total) * 100}%` }}
                  />
                </span>
                <ReadCount course={card.slug} progress={progress} />
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
