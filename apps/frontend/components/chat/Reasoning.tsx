"use client";

import { useState } from "react";
import { ChevronIcon } from "@/components/chat/icons";
import { CHIP_CLASS } from "@/components/ui/styles";

/**
 * A reasoning trace, in a disclosure above the answer it precedes — the way
 * ChatGPT and Claude show thinking. Open while the model is still writing it
 * (`active`), then collapsed once, on the edge to done, so the answer proper is
 * what stays on screen; the reader can reopen it. The text is a trace, not
 * prose: rendered plain, newlines kept, no markdown or KaTeX. The stream is
 * throttled at the source (`ChatPanel`'s `experimental_throttle`), so a long
 * trace does not saturate the thread either.
 */
export default function Reasoning({ text, active }: { text: string; active: boolean }) {
  const [open, setOpen] = useState(active);
  // Follow `active` on its edges — open while the block is being written,
  // collapse once when it finishes — while leaving the reader free to toggle it
  // in between. Adjusting state during render off a remembered prop is React's
  // own pattern for this, and it avoids a setState-in-effect cascade.
  const [was, setWas] = useState(active);
  if (active !== was) {
    setWas(active);
    setOpen(active);
  }

  // Nothing to disclose until the first reasoning token lands.
  if (text === "") return null;

  return (
    <div className="mb-2">
      {/* The chip is the site's small outlined control that names a thing
          (ui/styles); here it names the trace it hides. */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={`${CHIP_CLASS} inline-flex gap-1 px-1.5 py-0.5`}
      >
        <ChevronIcon
          className={`size-3 transition-transform duration-(--motion-fast) ${
            open ? "" : "-rotate-90"
          }`}
        />
        Reasoning
      </button>
      {open && (
        <div className="mt-1 border-l border-line pl-3 text-[13px] leading-relaxed whitespace-pre-wrap text-faint">
          {text}
        </div>
      )}
    </div>
  );
}
