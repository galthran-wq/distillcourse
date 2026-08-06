"use client";

import type { FormEvent, KeyboardEvent } from "react";
import { Button } from "@/components/ui";
import { FIELD_CLASS } from "@/components/ui/styles";
import { dropQuote, useQuote } from "@/lib/chat/quote";
import { setDraft, useDraft } from "@/lib/chat/stored";

interface Props {
  /** A run is in flight: the chat takes one at a time. */
  disabled: boolean;
  onSubmit: (text: string) => void;
}

export default function Composer({ disabled, onSubmit }: Props) {
  // Outside the component, so that an unsent message survives a reload.
  const text = useDraft();
  const quote = useQuote();
  const ready = !disabled && text.trim() !== "";

  function submit(event: FormEvent): void {
    event.preventDefault();
    if (!ready) return;
    setDraft("");
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
          <Button
            variant="ghost"
            size="sm"
            onClick={dropQuote}
            aria-label="Drop the quoted passage"
            className="px-2"
          >
            ×
          </Button>
        </div>
      )}
      <textarea
        value={text}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        rows={2}
        aria-label="Message the tutor"
        placeholder={disabled ? "the tutor is answering…" : "Ask about this section"}
        className={`${FIELD_CLASS} resize-none`}
      />
      <Button type="submit" variant="solid" size="sm" disabled={!ready} className="mt-2 w-full">
        Send
      </Button>
    </form>
  );
}
