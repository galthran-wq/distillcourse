"use client";

import type { UIMessage } from "ai";
import { useEffect, useState } from "react";
import { ChevronIcon } from "@/components/chat/icons";
import { current, describe, steps, summary } from "@/lib/chat/activity";

// When this browser saw each thought start and finish. The stream carries no
// clock, so this is the only one there is; it outlives the component because
// the transcript is re-rendered from scratch on a chat switch and back.
const timing = new Map<string, { start: number; end?: number }>();

/**
 * What the tutor did before it answered, as one line above the answer: every
 * search, read and thought counted, or — while it streams — the step under
 * way. The reader opens it to see each of them in the order they happened.
 */
export default function Activity({
  messages,
  streaming,
}: {
  /** The model messages one answer is made of. */
  messages: UIMessage[];
  streaming: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    for (const message of messages)
      message.parts.forEach((part, index) => {
        if (part.type !== "reasoning") return;
        const key = `${message.id}:${index}`;
        const seen = timing.get(key);
        if (seen === undefined) {
          if (part.state === "streaming") timing.set(key, { start: Date.now() });
        } else if (part.state === "done" && seen.end === undefined) {
          seen.end = Date.now();
        }
      });
  }, [messages]);

  const all = steps(messages, timing);
  if (all.length === 0) return null;
  const line = (streaming ? current(all) : null) ?? summary(all);

  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="inline-flex max-w-full items-center gap-1 text-[11px] text-faint transition-colors duration-(--motion-fast) hover:text-soft"
      >
        <span className="truncate">{line}</span>
        <ChevronIcon
          className={`size-3 shrink-0 transition-transform duration-(--motion-fast) ${
            open ? "" : "-rotate-90"
          }`}
        />
      </button>
      {open && (
        <ol className="mt-1 space-y-1.5 border-l border-line pl-3 text-[11px] text-faint transition-[opacity,translate] duration-(--motion-base) starting:-translate-y-1 starting:opacity-0">
          {all.map((step, index) => (
            // By position: the steps of an answer are only ever appended to.
            <li key={index} className={step.kind === "thought" ? "whitespace-pre-wrap" : ""}>
              {step.kind === "tool" ? describe(step) : step.text}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
