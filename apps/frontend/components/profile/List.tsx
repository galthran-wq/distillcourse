// The three shapes every list on the profile is built from.
import Link from "next/link";
import type { LessonLink } from "@/lib/content/site";

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="mb-2 font-mono text-[11px] uppercase tracking-wider text-faint">
        {title}
      </h2>
      {children}
    </section>
  );
}

export interface Listed {
  lesson: string;
  link?: LessonLink;
  note: string;
}

/**
 * A titled list of lessons, or one line saying there are none. Everything on
 * the profile that is "these lessons, each with a note" — the feed under the
 * activity grid is not: its lines are cut into days, each with a heading.
 */
export function LessonList({
  title,
  empty,
  rows,
}: {
  title: string;
  empty: string;
  rows: Listed[];
}) {
  return (
    <Section title={title}>
      {rows.length === 0 ? (
        <p className="text-sm text-faint">{empty}</p>
      ) : (
        <ul>
          {rows.map((row) => (
            <LessonRow key={row.lesson} {...row} />
          ))}
        </ul>
      )}
    </Section>
  );
}

export function LessonRow({
  link,
  lesson,
  note,
}: {
  link?: LessonLink;
  lesson: string;
  note: string;
}) {
  return (
    <li className="flex items-baseline justify-between gap-4 border-b border-line py-3">
      <span className="min-w-0">
        {link === undefined ? (
          // A lesson can leave the site (unpublished, renamed) while the row
          // that names it stays; it is shown rather than linked.
          <span className="text-faint">{lesson}</span>
        ) : (
          <Link href={link.href} className="hover:text-accent">
            {link.title}
          </Link>
        )}
        {link !== undefined && (
          <span className="ml-3 font-mono text-[11px] text-faint">{link.course}</span>
        )}
      </span>
      <span className="shrink-0 font-mono text-[11px] text-faint">{note}</span>
    </li>
  );
}
