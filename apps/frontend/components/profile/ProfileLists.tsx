"use client";

import Link from "next/link";
import { useSignedIn } from "@/lib/auth/signed-in";
import { useAuth } from "@/lib/auth/store";
import type { LessonLink } from "@/lib/content/site";
import { day } from "@/lib/day";
import { getProfile } from "@/lib/lessons/api";
import Activity from "./Activity";
import { LessonRow, Section } from "./List";

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

  return (
    <>
      <Activity lessons={lessons} />
      {profile !== null && (
        <>
          {/* Every lesson once, by when it was last opened — the feed above
              answers "which days", this answers "which lessons". */}
          <Section title="recently read">
            {profile.history.length === 0 ? (
              <p className="text-sm text-faint">No lessons read yet.</p>
            ) : (
              <ul>
                {profile.history.map((visit) => (
                  <LessonRow
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
                  <LessonRow
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
      )}
    </>
  );
}
