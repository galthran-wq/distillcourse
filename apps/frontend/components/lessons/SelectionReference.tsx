"use client";

import { useEffect, useState } from "react";
import { setQuote } from "@/lib/chat/quote";
import { openPanel } from "@/lib/chat/stored";
import {
  BUTTON_HEIGHT,
  buttonPosition,
  selectedPassage,
  type Passage,
} from "@/lib/lesson/selection";

/** Offers the passage the reader selected to the tutor, with its locator. */
export default function SelectionReference({
  course,
  lesson,
}: {
  course: string;
  lesson: string;
}) {
  const [passage, setPassage] = useState<Passage | null>(null);

  useEffect(() => {
    const update = (): void => setPassage(selectedPassage(course, lesson));
    document.addEventListener("pointerup", update);
    document.addEventListener("keyup", update);
    return () => {
      document.removeEventListener("pointerup", update);
      document.removeEventListener("keyup", update);
    };
  }, [course, lesson]);

  if (passage === null) return null;

  return (
    <button
      type="button"
      // Without this the press clears the selection, and the button unmounts
      // before the click it was pressed for is delivered.
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => {
        setQuote({ text: passage.text, locator: passage.locator });
        // Quoting a passage is asking about it: the question is written in the
        // panel, so it comes up with the quote already in the composer.
        openPanel();
        setPassage(null);
        window.getSelection()?.removeAllRanges();
      }}
      style={{ ...buttonPosition(passage), height: BUTTON_HEIGHT }}
      className="fixed z-40 flex -translate-x-1/2 items-center rounded-sm border border-line bg-paper px-2.5 text-[12px] text-soft shadow-card transition-colors duration-(--motion-fast) hover:border-accent hover:text-accent"
    >
      reference in chat
    </button>
  );
}
