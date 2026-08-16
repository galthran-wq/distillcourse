"use client";

import { useState } from "react";
import { ChevronIcon } from "@/components/chat/icons";
import { LABEL_CLASS } from "@/components/ui/styles";
import { STREAM_THROTTLE_MS, useThrottledValue } from "@/lib/ui/throttle";

/**
 * A reasoning trace, in a disclosure above the answer it precedes — the way
 * ChatGPT and Claude show thinking. Open while the model is still writing it
 * (`active`), then collapsed once, on the edge to done, so the answer proper is
 * what stays on screen; the reader can reopen it. The text is a trace, not
 * prose: rendered plain, newlines kept, no markdown or KaTeX — and throttled
 * the same way the answer is, so a long trace never saturates the thread either.
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

  const shown = useThrottledValue(text, STREAM_THROTTLE_MS, active);
  // Nothing to disclose until the first reasoning token lands.
  if (text === "") return null;

  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex items-center gap-1 text-faint transition-colors hover:text-soft"
      >
        <ChevronIcon
          className={`size-3.5 transition-transform duration-(--motion-fast) ${
            open ? "" : "-rotate-90"
          }`}
        />
        <span className={LABEL_CLASS}>Reasoning</span>
      </button>
      {open && (
        <div className="mt-1 border-l border-line pl-3 text-[13px] leading-relaxed whitespace-pre-wrap text-faint">
          {shown}
        </div>
      )}
    </div>
  );
}
