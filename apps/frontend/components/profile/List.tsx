// The two shapes every list on the profile is built from.
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
