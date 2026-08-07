"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { SendIcon } from "@/components/chat/icons";
import { PendingQuote, QuoteRow } from "@/components/chat/Quotes";
import { Button } from "@/components/ui";
import { FIELD_BOX_CLASS } from "@/components/ui/styles";
import { useQuotes, type Quote } from "@/lib/chat/quote";
import { setDraft, useDraft } from "@/lib/chat/stored";

interface Props {
  /** A run is in flight: the chat takes one at a time. */
  disabled: boolean;
  /** The passages come with the text: they are what the question is about. */
  onSubmit: (text: string, quotes: Quote[]) => void;
}

export default function Composer({ disabled, onSubmit }: Props) {
  // Outside the component, so that an unsent message survives a reload.
  const text = useDraft();
  const quotes = useQuotes();
  const field = useRef<HTMLTextAreaElement>(null);
  const ready = !disabled && text.trim() !== "";

  // One row until the message needs more, up to the cap the class sets — and
  // the field's own scrollHeight is the only measure of what it needs, which
  // is only the truth once the height it was given is released. scrollHeight
  // is the content box plus its padding, while the height set here is a
  // border-box height, so whatever the box adds outside the padding is added
  // back or the field is permanently short of its own text.
  const fit = useCallback((): void => {
    const box = field.current;
    if (box === null) return;
    box.style.height = "auto";
    box.style.height = `${box.scrollHeight + box.offsetHeight - box.clientHeight}px`;
  }, []);

  useLayoutEffect(fit, [text, fit]);

  // How many rows the draft wraps into is a function of the field's width, and
  // the panel changes that width over `--motion-base` rather than at the
  // moment it is told to: measuring when the panel expands measures the old
  // width and sticks the field at the height that answer gives. The width
  // arriving is the event, so the field's own box is what to watch — every
  // step of the resize, and the browser window's too. Height changes are this
  // measurement's own doing and would only feed it back into itself.
  useEffect(() => {
    const box = field.current;
    if (box === null) return;
    let width = box.clientWidth;
    const observer = new ResizeObserver(() => {
      if (box.clientWidth === width) return;
      width = box.clientWidth;
      fit();
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, [fit]);

  function submit(event: FormEvent): void {
    event.preventDefault();
    if (!ready) return;
    setDraft("");
    onSubmit(text.trim(), quotes);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    // Enter sends, shift+Enter breaks the line — a chat input, not a form field.
    if (event.key === "Enter" && !event.shiftKey) submit(event);
  }

  return (
    <form onSubmit={submit} className="border-t border-line p-3">
      {/* The column the transcript above it is set in. */}
      <div className="mx-auto max-w-2xl">
        {quotes.length > 0 && (
          <QuoteRow>
            {quotes.map((quote) => (
              // By value: two chips are two different passages — the store
              // admits no duplicate — and nothing is inserted between them.
              <PendingQuote key={`${quote.locator}\n${quote.text}`} quote={quote} />
            ))}
          </QuoteRow>
        )}
        {/* The field is the box, not the textarea: the send button sits in it
            beside the text rather than floating over the corner of it, and the
            border and the ring belong to the two of them together. */}
        <div className={FIELD_BOX_CLASS}>
          <textarea
            ref={field}
            value={text}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            aria-label="Message the tutor"
            placeholder={disabled ? "the tutor is answering…" : "Ask about this section"}
            // Nothing of its own: no fill, no line, and not the site's focus
            // ring — the box carries all three, and the height matches the
            // send button beside it so one line of text sits level with it.
            className="max-h-36 min-h-10 flex-1 resize-none overflow-y-auto bg-transparent px-2.5 py-2.5 text-sm text-ink placeholder:text-faint focus:outline-none"
          />
          <Button
            type="submit"
            variant="solid"
            size="icon"
            disabled={!ready}
            aria-label="Send"
          >
            <SendIcon />
          </Button>
        </div>
      </div>
    </form>
  );
}
