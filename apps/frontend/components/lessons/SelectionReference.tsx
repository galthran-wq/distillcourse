"use client";

import { useEffect, useState } from "react";
import { openPanel } from "@/lib/chat/panel";
import { setQuote } from "@/lib/chat/quote";
import { selectedPassage, type Passage } from "@/lib/lesson/selection";

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
      style={{ top: passage.top - 8, left: passage.left }}
      className="fixed z-40 -translate-x-1/2 -translate-y-full rounded border border-line bg-paper px-2 py-1 font-mono text-[11px] text-soft shadow-sm hover:border-accent hover:text-accent"
    >
      reference in chat
    </button>
  );
}
