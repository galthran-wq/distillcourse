"use client";

import { useEffect, useState } from "react";
import { CHIP_CLASS } from "@/components/ui/styles";
import { addQuote } from "@/lib/chat/quote";
import { openPanel } from "@/lib/chat/stored";
import {
  BUTTON_HEIGHT,
  buttonPosition,
  selectedPassage,
  selectionSpans,
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
    // Offering a passage waits for the gesture to end — half a drag is not
    // what the reader means to quote — but withdrawing the offer cannot wait
    // for anything. A press that lands elsewhere collapses the selection, and
    // whether it does so before or after the pointerup read above is the
    // browser's business; the collapse itself only ever fires this.
    const withdraw = (): void => {
      if (!selectionSpans(window.getSelection())) setPassage(null);
    };
    document.addEventListener("pointerup", update);
    document.addEventListener("keyup", update);
    document.addEventListener("selectionchange", withdraw);
    return () => {
      document.removeEventListener("pointerup", update);
      document.removeEventListener("keyup", update);
      document.removeEventListener("selectionchange", withdraw);
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
        // Added, not set: a question can be about two passages, and the second
        // selection is a second reference rather than a correction of the first.
        addQuote({ text: passage.text, locator: passage.locator });
        // Quoting a passage is asking about it: the question is written in the
        // panel, so it comes up with the quote already in the composer.
        openPanel();
        setPassage(null);
        window.getSelection()?.removeAllRanges();
      }}
      style={{ ...buttonPosition(passage), height: BUTTON_HEIGHT }}
      // A chip, floating at the selection rather than sitting in a row — so it
      // brings its own placement and the shadow that lifts it off the prose.
      className={`${CHIP_CLASS} fixed z-40 -translate-x-1/2 px-2.5 shadow-card`}
    >
      reference in chat
    </button>
  );
}
