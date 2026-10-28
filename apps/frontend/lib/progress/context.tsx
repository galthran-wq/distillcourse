"use client";

import { createContext, useContext, useMemo } from "react";
import { useSignedIn } from "@/lib/auth/signed-in";
import { useAuth } from "@/lib/auth/store";
import { getProgress } from "./api";
import { byLesson, type Standings } from "./summary";

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
  const auth = useAuth();
  const [standings] = useSignedIn(getProgress, course);
  // Signing out has to take the marks off the page even though the answer
  // that was loaded is still in hand.
  const visible = auth.status === "signed-in" ? standings : null;
  const held = useMemo(() => (visible === null ? null : byLesson(visible)), [visible]);
  return <Context.Provider value={held}>{children}</Context.Provider>;
}

/** Keyed by `<course>/<slug>`; `null` while there is nothing to show. */
export function useProgress(): Standings | null {
  return useContext(Context);
}
