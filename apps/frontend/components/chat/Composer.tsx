"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { FIELD_CLASS } from "@/components/ui/field";
import { dropQuote, useQuote } from "@/lib/chat/quote";

interface Props {
  /** A run is in flight: the chat takes one at a time. */
  disabled: boolean;
  onSubmit: (text: string) => void;
}

export default function Composer({ disabled, onSubmit }: Props) {
  const [text, setText] = useState("");
  const quote = useQuote();
  const ready = !disabled && text.trim() !== "";

  function submit(event: FormEvent): void {
    event.preventDefault();
    if (!ready) return;
    setText("");
    onSubmit(text.trim());
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    // Enter sends, shift+Enter breaks the line — a chat input, not a form field.
    if (event.key === "Enter" && !event.shiftKey) submit(event);
  }

  return (
    <form onSubmit={submit} className="border-t border-line p-3">
      {quote !== null && (
        <div className="mb-2 flex items-start gap-2 border-l-2 border-accent pl-2">
          <p className="line-clamp-3 flex-1 text-[13px] text-soft">{quote.text}</p>
          <button
            type="button"
            onClick={dropQuote}
            aria-label="Drop the quoted passage"
            className="px-1 text-soft hover:text-accent"
          >
            ×
          </button>
        </div>
      )}
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={onKeyDown}
        rows={2}
        aria-label="Message the tutor"
        placeholder={disabled ? "the tutor is answering…" : "Ask about this section"}
        className={`${FIELD_CLASS} mt-0 resize-none`}
      />
      <button
        type="submit"
        disabled={!ready}
        className="mt-2 min-h-9 w-full rounded border border-line text-sm transition-colors hover:border-accent hover:text-accent disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink"
      >
        Send
      </button>
    </form>
  );
}
