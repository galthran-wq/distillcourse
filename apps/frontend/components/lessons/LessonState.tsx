"use client";

import { createContext, useContext } from "react";
import { Button } from "@/components/ui";
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
    <Button
      variant="ghost"
      size="icon"
      active={state.bookmarked}
      onClick={() => bookmark(!state.bookmarked)}
      aria-label={state.bookmarked ? "Remove bookmark" : "Bookmark this lesson"}
    >
      <svg
        viewBox="0 0 16 16"
        aria-hidden
        className="size-4"
        fill={state.bookmarked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      >
        <path d="M3.75 2.75h8.5v10.5L8 10.25l-4.25 3z" />
      </svg>
    </Button>
  );
}

export function LessonRating() {
  const { state, rate } = useContext(Context);
  if (state === null) return null;

  return (
    <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-6">
      <span className="text-sm text-soft">Was this lesson useful?</span>
      <div className="flex items-center gap-2">
        {([1, -1] as const).map((value) => (
          <Button
            key={value}
            size="sm"
            active={state.rating === value}
            onClick={() => rate(value)}
          >
            {value === 1 ? "Yes" : "No"}
          </Button>
        ))}
      </div>
    </div>
  );
}
