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
import MentionPalette, {
  MENTIONS_ID,
  MentionRow,
  mentionRowId,
} from "@/components/chat/Mentions";
import { PendingQuote, QuoteRow } from "@/components/chat/Quotes";
import { Button } from "@/components/ui";
import { FIELD_BOX_CLASS, FIELD_BOX_INPUT_CLASS } from "@/components/ui/styles";
import { matchCommands, type Command } from "@/lib/chat/commands";
import { asked, mentions, typingAt, write, type Mention } from "@/lib/chat/mention";
import { useQuotes, type Quote } from "@/lib/chat/quote";
import { setDraft, useDraft } from "@/lib/chat/stored";
import { useLessons } from "@/lib/content/links";
import { useSections } from "@/lib/content/sections";
import { useDismiss } from "@/lib/ui/dismiss";

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
  const lessons = useLessons();
  const sections = useSections();
  const field = useRef<HTMLTextAreaElement>(null);
  const column = useRef<HTMLDivElement>(null);
  const ready = !disabled && text.trim() !== "";

  // What either list offers is the draft read at the caret, not a state of its
  // own. Whether one is up at all is one, and typing is what puts it there:
  // the draft outlives the tab, and a line the reader comes back to a day
  // later was not typed just now and opens nothing. It goes away like any
  // other menu here — Escape or a press away from it — and sending is the
  // third way.
  const [offered, setOffered] = useState(false);
  const [chosen, setChosen] = useState(0);
  // Where in the draft the reader is: an `@` is a reference only while the
  // caret is still inside it.
  const [caret, setCaret] = useState(0);
  const commands = matchCommands(text);
  // A command is the whole draft, so the two lists cannot both have rows —
  // but the commands are read first, and are what a bare `/` means.
  const typing = commands.length > 0 ? null : typingAt(text, caret);
  const places = typing === null ? [] : mentions(typing, lessons, sections);
  // Which of the two lists is up, answered once. What the field says about it,
  // how far the arrows walk, which row Enter takes and what taking it does all
  // read off this — so a third list is one more branch here rather than one
  // more condition at each of six places that have to agree.
  const list =
    commands.length > 0
      ? {
          id: PALETTE_ID,
          rows: commands.length,
          rowId: (row: number) => commandRowId(commands[row]),
          take: (row: number) => pick(commands[row]),
          palette: (row: number) => (
            <CommandPalette commands={commands} active={row} onPick={pick} />
          ),
        }
      : {
          id: MENTIONS_ID,
          rows: places.length,
          rowId: mentionRowId,
          take: (row: number) => insert(places[row]),
          palette: (row: number) => (
            <MentionPalette mentions={places} active={row} onPick={insert} />
          ),
        };
  const open = offered && list.rows > 0 && !disabled;
  // The list shortens as the reader types; the highlight cannot outrun it.
  const active = Math.min(chosen, list.rows - 1);

  useDismiss(open, column, setOffered);

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

  // Choosing from the list rewrites the middle of the draft, and React puts
  // the caret at the end of a value it did not put there — so the field is
  // told where it goes instead: the end of the reference, which is where the
  // next keystroke belongs, the `/` or `#` that goes a level deeper as much as
  // the rest of the sentence.
  //
  // The choice rather than the position it asks for: a row chosen out of a
  // list of one writes back the text that was already there — `@amer` taken
  // where it already reads `@us-history/indigenous-america` — and neither that
  // draft nor that position is a value an effect reruns for. Every choice is
  // its own object, so every one of them lands.
  const [taken, setTaken] = useState<{ caret: number } | null>(null);

  useLayoutEffect(() => {
    if (taken === null) return;
    field.current?.focus();
    field.current?.setSelectionRange(taken.caret, taken.caret);
  }, [taken]);

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
    setOffered(false);
    // The references the reader wrote go as the `[[locator]]` the harness
    // resolves; the `@` form is what the composer shows, not what is asked.
    onSubmit(asked(message, lessons), quotes);
  }

  // The one place a message leaves the composer, so an open list is answered
  // for here rather than at each of the two ways in: a slash on its own is
  // nothing the tutor could answer, and the send button sits under the list as
  // much as the Enter key does.
  function submit(event: FormEvent): void {
    event.preventDefault();
    if (open) return list.take(active);
    if (!ready) return;
    send(text.trim());
  }

  // Chosen from the palette rather than typed out: the same message either
  // way, so the widget goes on parsing one command out of one line of text.
  function pick(command: Command): void {
    send(`/${command}`);
  }

  /** A place chosen from the list, written over the reference being typed. */
  function insert(place: Mention): void {
    if (typing === null) return;
    const written = write(text, typing, place);
    setDraft(written.draft);
    // Both ends of it: the number the list reads the draft at, and the field
    // the effect above hands it to.
    setCaret(written.caret);
    setTaken({ caret: written.caret });
    // A reference is finished: the list has said what it had to say, and the
    // reader carries on with the sentence — or types `/` and it comes back.
    setOffered(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    // The arrows walk the list while it is up, and the caret stays where it
    // is. Escape is not handled here: `useDismiss` above takes it, the way it
    // does for every other menu on this site.
    if (open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      return setChosen((active + step + list.rows) % list.rows);
    }
    // Enter sends, shift+Enter breaks the line — a chat input, not a form
    // field. What it sends with a list up is `submit`'s to say.
    if (event.key === "Enter" && !event.shiftKey) submit(event);
  }

  function type(draft: string, at: number): void {
    setDraft(draft);
    setCaret(at);
    // Typing is what opens a list, and what takes a dismissal back.
    setOffered(true);
    // A different list, so the highlight starts at the top of it again.
    setChosen(0);
  }

  return (
    <form onSubmit={submit} className="border-t border-line p-3">
      {/* The column the transcript above it is set in, and what a list opens
          against: over the whole composer, the attached passages included,
          since it is about the line being written rather than them. It is the
          list's extent too — a press anywhere in here is aimed at the message
          being written and leaves the list up. */}
      <div ref={column} className="relative mx-auto max-w-2xl">
        {open && list.palette(active)}
        {quotes.length > 0 && (
          <QuoteRow>
            {quotes.map((quote) => (
              // By value: two chips are two different passages — the store
              // admits no duplicate — and nothing is inserted between them.
              <PendingQuote key={`${quote.locator}\n${quote.text}`} quote={quote} />
            ))}
          </QuoteRow>
        )}
        <MentionRow draft={text} />
        {/* The field is the box, not the textarea: the send button sits in it
            beside the text rather than floating over the corner of it, and the
            border and the ring belong to the two of them together. */}
        <div
          className={FIELD_BOX_CLASS}
          // The box is wider and taller than the text in it — its padding, the
          // gap, and the column over the send button once the draft wraps. All
          // of that reads as the field, and used to be textarea surface where a
          // press put the caret; it still is.
          onMouseDown={(event) => {
            if (event.target !== event.currentTarget) return;
            event.preventDefault();
            field.current?.focus();
          }}
        >
          <textarea
            ref={field}
            value={text}
            onChange={(event) => type(event.target.value, event.target.selectionStart)}
            // Every other way the caret moves: the arrows, a click into the
            // middle of the line, a drag over it.
            onSelect={(event) => setCaret(event.currentTarget.selectionStart)}
            onKeyDown={onKeyDown}
            rows={1}
            aria-label="Message the tutor"
            // The field stands in for the list hanging over it: it keeps the
            // focus, so it is what says the list is open and which row of it
            // Enter would take. Only while it is — the rest of the time this
            // is a message field and has nothing to say about a list.
            role={open ? "combobox" : undefined}
            aria-expanded={open || undefined}
            aria-controls={open ? list.id : undefined}
            aria-activedescendant={open ? list.rowId(active) : undefined}
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
