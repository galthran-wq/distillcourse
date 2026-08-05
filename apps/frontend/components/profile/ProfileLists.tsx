"use client";

import Link from "next/link";
import { useSignedIn } from "@/lib/auth/signed-in";
import { useAuth } from "@/lib/auth/store";
import type { LessonLink } from "@/lib/content/site";
import { day } from "@/lib/day";
import { getProfile } from "@/lib/lessons/api";

function Row({ link, lesson, note }: { link?: LessonLink; lesson: string; note: string }) {
  return (
    <li className="flex items-baseline justify-between gap-4 border-b border-line py-3">
      <span className="min-w-0">
        {link === undefined ? (
          // A lesson can leave the site (unpublished, renamed) while the row
          // that names it stays; the key is shown rather than a dead link.
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="mb-2 font-mono text-[11px] uppercase tracking-wider text-faint">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function ProfileLists({
  lessons,
}: {
  lessons: Record<string, LessonLink>;
}) {
  const auth = useAuth();
  const [profile] = useSignedIn(getProfile);

  if (auth.status === "anonymous") {
    return (
      <p className="mt-6 text-sm text-soft">
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>{" "}
        to keep a reading history and bookmarks.
      </p>
    );
  }
  if (profile === null) return null;

  return (
    <>
      <Section title="recently read">
        {profile.history.length === 0 ? (
          <p className="text-sm text-faint">No lessons read yet.</p>
        ) : (
          <ul>
            {profile.history.map((visit) => (
              <Row
                key={visit.lesson}
                lesson={visit.lesson}
                link={lessons[visit.lesson]}
                note={
                  visit.completed_at === null
                    ? day(visit.last_seen)
                    : `${day(visit.last_seen)} · completed`
                }
              />
            ))}
          </ul>
        )}
      </Section>

      <Section title="bookmarks">
        {profile.bookmarks.length === 0 ? (
          <p className="text-sm text-faint">Nothing bookmarked.</p>
        ) : (
          <ul>
            {profile.bookmarks.map((bookmark) => (
              <Row
                key={bookmark.lesson}
                lesson={bookmark.lesson}
                link={lessons[bookmark.lesson]}
                note={day(bookmark.created_at)}
              />
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
