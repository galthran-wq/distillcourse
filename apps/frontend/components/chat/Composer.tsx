"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { CloseIcon, SendIcon } from "@/components/chat/icons";
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
  const field = useRef<HTMLTextAreaElement>(null);
  const ready = !disabled && text.trim() !== "";

  // One row until the message needs more, up to the cap the class sets — and
  // the field's own scrollHeight is the only measure of what it needs, which
  // is only the truth once the height it was given is released. scrollHeight
  // is the content box plus its padding, and the height set here is a
  // border-box height, so the border has to be added back or the field is
  // permanently two pixels short of its own text.
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
    onSubmit(text.trim());
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    // Enter sends, shift+Enter breaks the line — a chat input, not a form field.
    if (event.key === "Enter" && !event.shiftKey) submit(event);
  }

  return (
    <form onSubmit={submit} className="border-t border-line p-3">
      {/* The column the transcript above it is set in. */}
      <div className="mx-auto max-w-2xl">
        {quote !== null && (
          <div className="mb-2 flex items-start gap-2 rounded-sm border border-line border-l-2 border-l-accent bg-panel py-1.5 pr-1 pl-2.5">
            <p className="line-clamp-2 flex-1 pt-1.5 text-[13px] text-soft">
              {quote.text}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={dropQuote}
              aria-label="Drop the quoted passage"
              className="shrink-0"
            >
              <CloseIcon className="size-3.5" />
            </Button>
          </div>
        )}
        <div className="relative">
          <textarea
            ref={field}
            value={text}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            aria-label="Message the tutor"
            placeholder={disabled ? "the tutor is answering…" : "Ask about this section"}
            className={`${FIELD_CLASS} max-h-36 min-h-11 resize-none overflow-y-auto pr-12`}
          />
          <Button
            type="submit"
            variant="solid"
            size="icon"
            disabled={!ready}
            aria-label="Send"
            className="absolute right-0.5 bottom-0.5"
          >
            <SendIcon />
          </Button>
        </div>
      </div>
    </form>
  );
}
