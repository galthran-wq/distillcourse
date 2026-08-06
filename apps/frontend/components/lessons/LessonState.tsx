"use client";

import { createContext, useContext } from "react";
import { CONTROL_CLASS } from "@/components/ui/field";
import { useSignedIn } from "@/lib/auth/signed-in";
import { useAuth } from "@/lib/auth/store";
import {
  getLessonState,
  rateLesson,
  setBookmark,
  type LessonState,
  type Rating,
} from "@/lib/lessons/api";

interface Held {
  state: LessonState | null;
  rate: (value: Rating) => void;
  bookmark: (bookmarked: boolean) => void;
}

const Context = createContext<Held>({
  state: null,
  rate: () => {},
  bookmark: () => {},
});

/**
 * Holds one lesson's rating and bookmark for the two controls that show them —
 * the header toggle and the rating at the end of the page — so both read one
 * answer from one request. Anonymous visitors get no state and no controls.
 */
export function LessonStateProvider({
  lesson,
  children,
}: {
  lesson: string;
  children: React.ReactNode;
}) {
  const auth = useAuth();
  const [state, setState] = useSignedIn(getLessonState, lesson);

  // The button answers the click and the write follows; a failed write puts the
  // previous answer back rather than leaving the page and the database apart.
  async function apply(next: LessonState, write: () => Promise<void>) {
    const previous = state;
    setState(next);
    try {
      await write();
    } catch {
      setState(previous);
    }
  }

  // Signing out has to take the controls off the page even though the state
  // that was loaded is still in hand.
  const visible = auth.status === "signed-in" ? state : null;

  const held: Held = {
    state: visible,
    rate: (value) => {
      if (visible !== null)
        void apply({ ...visible, rating: value }, () => rateLesson(lesson, value));
    },
    bookmark: (bookmarked) => {
      if (visible !== null)
        void apply({ ...visible, bookmarked }, () => setBookmark(lesson, bookmarked));
    },
  };

  return <Context.Provider value={held}>{children}</Context.Provider>;
}

export function BookmarkToggle() {
  const { state, bookmark } = useContext(Context);
  if (state === null) return null;

  return (
    <button
      type="button"
      aria-pressed={state.bookmarked}
      onClick={() => bookmark(!state.bookmarked)}
      className={`${CONTROL_CLASS} ${
        state.bookmarked ? "text-accent" : "text-faint hover:text-accent"
      }`}
    >
      {state.bookmarked ? "bookmarked" : "bookmark"}
    </button>
  );
}

export function LessonRating() {
  const { state, rate } = useContext(Context);
  if (state === null) return null;

  return (
    <div className="mt-10 flex items-center gap-3 border-t border-line pt-6">
      <span className="font-mono text-[11px] tracking-wide text-faint">
        was this lesson useful?
      </span>
      {([1, -1] as const).map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={state.rating === value}
          onClick={() => rate(value)}
          className={`${CONTROL_CLASS} rounded border px-2 py-1 ${
            state.rating === value
              ? "border-accent text-accent"
              : "border-line text-soft hover:border-faint"
          }`}
        >
          {value === 1 ? "yes" : "no"}
        </button>
      ))}
    </div>
  );
}
