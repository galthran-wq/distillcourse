"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import CommandPalette, {
  PALETTE_ID,
  commandRowId,
} from "@/components/chat/CommandPalette";
import { SendIcon } from "@/components/chat/icons";
import { PendingQuote, QuoteRow } from "@/components/chat/Quotes";
import { Button } from "@/components/ui";
import { FIELD_BOX_CLASS, FIELD_BOX_INPUT_CLASS } from "@/components/ui/styles";
import { matchCommands, type Command } from "@/lib/chat/commands";
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

  // The palette is the draft read as a command, not a state of its own: what
  // is typed decides what it lists and so whether it is there at all. The one
  // thing it remembers is having been dismissed, which the next keystroke
  // takes back — typing is what opened it.
  const [dismissed, setDismissed] = useState(false);
  const [chosen, setChosen] = useState(0);
  const commands = matchCommands(text);
  const open = commands.length > 0 && !dismissed && !disabled;
  // The list shortens as the reader types; the highlight cannot outrun it.
  const active = Math.min(chosen, commands.length - 1);

  // One row until the message needs more, up to the cap the class sets — and
  // the field's own scrollHeight is the only measure of what it needs, which
  // is only the truth once the height it was given is released. scrollHeight
  // is the content box plus its padding, and so is the border-box height set
  // here: the border is the surrounding box's, not this control's.
  const fit = useCallback((): void => {
    const box = field.current;
    if (box === null) return;
    box.style.height = "auto";
    box.style.height = `${box.scrollHeight}px`;
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

  function send(message: string): void {
    setDraft("");
    onSubmit(message, quotes);
  }

  function submit(event: FormEvent): void {
    event.preventDefault();
    if (!ready) return;
    send(text.trim());
  }

  // Chosen from the palette rather than typed out: the same message either
  // way, so the widget goes on parsing one command out of one line of text.
  function pick(command: Command): void {
    send(`/${command}`);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    // While the palette is up these keys are its: the caret stays where it is,
    // and Escape is spent here rather than reaching the expanded panel, which
    // would take the Escape as being told to collapse.
    if (open) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const step = event.key === "ArrowDown" ? 1 : commands.length - 1;
        return setChosen((active + step) % commands.length);
      }
      if (event.key === "Escape") {
        event.stopPropagation();
        return setDismissed(true);
      }
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        return pick(commands[active]);
      }
    }
    // Enter sends, shift+Enter breaks the line — a chat input, not a form field.
    if (event.key === "Enter" && !event.shiftKey) submit(event);
  }

  function type(draft: string): void {
    setDraft(draft);
    setDismissed(false);
    // A different list, so the highlight starts at the top of it again.
    setChosen(0);
  }

  return (
    <form onSubmit={submit} className="border-t border-line p-3">
      {/* The column the transcript above it is set in, and what the palette
          opens against: over the whole composer, the attached passages
          included, since it is about the line being written rather than them. */}
      <div className="relative mx-auto max-w-2xl">
        {open && <CommandPalette commands={commands} active={active} onPick={pick} />}
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
            onChange={(event) => type(event.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            aria-label="Message the tutor"
            // The field stands in for the palette hanging over it: it keeps the
            // focus, so it is what says the list is open and which row of it
            // Enter would run. Only while it is — the rest of the time this is
            // a message field and has nothing to say about a list.
            role={open ? "combobox" : undefined}
            aria-expanded={open || undefined}
            aria-controls={open ? PALETTE_ID : undefined}
            aria-activedescendant={open ? commandRowId(commands[active]) : undefined}
            placeholder={disabled ? "the tutor is answering…" : "Ask about this section"}
            // Geometry only: the fill, the line and the ring are the box's.
            // The height matches the send button beside it, so one line of
            // text sits level with it.
            className={`${FIELD_BOX_INPUT_CLASS} max-h-36 min-h-10 flex-1 resize-none overflow-y-auto px-2.5 py-2.5`}
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
