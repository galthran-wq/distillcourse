"use client";

import { createContext, useContext, useMemo } from "react";
import { useSignedIn } from "@/lib/auth/signed-in";
import type { ReadableLesson } from "@/lib/content/visibility";
import { getProgress } from "./api";
import { byLesson, courseProgress, type CourseProgress, type Standings } from "./summary";

const Context = createContext<Standings | null>(null);

/**
 * One request for every progress mark under it. The pages are prerendered, so
 * the marks arrive after hydration; until then — and for an anonymous reader,
 * always — there is no answer and nothing is drawn.
 *
 * `course` empty asks for every course.
 */
export function ProgressProvider({
  course = "",
  children,
}: {
  course?: string;
  children: React.ReactNode;
}) {
  const [standings] = useSignedIn(getProgress, course);
  const held = useMemo(() => (standings === null ? null : byLesson(standings)), [standings]);
  return <Context.Provider value={held}>{children}</Context.Provider>;
}

/** Keyed by `lessonPath`; `null` while there is nothing to show. */
export function useProgress(): Standings | null {
  return useContext(Context);
}

/** `null` while there is nothing to show and for a course not started. */
export function useCourseProgress(
  course: string,
  lessons: ReadableLesson[],
): CourseProgress | null {
  const standings = useProgress();
  return standings === null ? null : courseProgress(course, lessons, standings);
}
