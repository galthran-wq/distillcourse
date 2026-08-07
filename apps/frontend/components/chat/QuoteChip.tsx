"use client";

import Link from "next/link";
import { useId, useRef, useState, type ReactNode } from "react";
import { CloseIcon } from "@/components/chat/icons";
import { CHIP_CLASS, POPOVER_CLASS } from "@/components/ui/styles";
import { dropQuote, type Quote } from "@/lib/chat/quote";
import { linkTo } from "@/lib/chat/references";
import { useLessons } from "@/lib/content/links";
import { reveal } from "@/lib/lesson/anchor";
import { useDismiss } from "@/lib/ui/dismiss";

// The chip's own geometry, on top of the look every chip on the site shares.
const CHIP = `${CHIP_CLASS} min-w-0 gap-1.5 py-1 pr-1.5 pl-2 text-left`;

// A cap rather than a size, and it belongs to whatever the row holds: a short
// passage takes what it needs, a long one is cut off at the point where a row
// of them stops being scannable. One of the two below is a chip, the other a
// chip with a button welded to it.
const WIDTH = "max-w-64";

/**
 * The row a message's passages sit in, above the question in the composer and
 * above it again in the bubble it was sent as — the same row in both places,
 * so a reference does not move when the message goes.
 */
export function QuoteRow({ children }: { children: ReactNode }) {
  return <div className="mb-2 flex flex-wrap gap-1.5">{children}</div>;
}

/**
 * What the chip says: the lesson the passage came from, then its opening
 * words. The section is named by an anchor rather than by a title — the site
 * ships lesson titles to the client, not every heading of every lesson — and
 * an anchor is the slug of a full sentence, which is not a label.
 */
function Label({ quote, title }: { quote: Quote; title?: string }) {
  return (
    <>
      <span aria-hidden className="shrink-0 text-faint">
        §
      </span>
      {title !== undefined && <span className="max-w-24 shrink-0 truncate">{title}</span>}
      <span className="truncate text-faint">“{quote.text}”</span>
    </>
  );
}

/**
 * A passage in a message already sent. It stays pointed at where it was taken
 * from: the lesson page scrolls to that section and marks it, exactly as a
 * reference the tutor writes does.
 */
export function SentQuote({ quote }: { quote: Quote }) {
  const target = linkTo(quote.locator, useLessons());
  const label = <Label quote={quote} title={target?.text} />;

  // A lesson the site no longer renders — a chat older than the course, a
  // lesson withdrawn since — leaves the passage readable with nothing to click.
  if (target === null) return <span className={`${CHIP} ${WIDTH}`}>{label}</span>;
  return (
    <Link
      href={target.url}
      // Client-side, and from the layout the panel lives in: the conversation
      // survives the navigation the click causes.
      onClick={() => reveal(target.url.split("#")[1] ?? null)}
      className={`${CHIP} ${WIDTH}`}
      title={quote.text}
    >
      {label}
    </Link>
  );
}

/**
 * A passage attached to the message being written: it can be read in full and
 * taken off again. The preview is the whole passage, which the chip has no room
 * for and which the reader may have selected several sections ago.
 */
export function PendingQuote({ quote }: { quote: Quote }) {
  const target = linkTo(quote.locator, useLessons());
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const preview = useId();

  useDismiss(open, root, setOpen);

  return (
    <div ref={root} className={`relative flex min-w-0 ${WIDTH}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={preview}
        className={`${CHIP} flex-1 rounded-r-none border-r-0`}
      >
        <Label quote={quote} title={target?.text} />
      </button>
      <button
        type="button"
        onClick={() => dropQuote(quote)}
        aria-label={`Drop the passage “${quote.text}”`}
        className={`${CHIP} shrink-0 rounded-l-none px-1.5`}
      >
        <CloseIcon className="size-3" />
      </button>
      {open && (
        <p
          id={preview}
          // Over the composer rather than under it: the field is at the bottom
          // of the panel, and there is nothing below it to open into.
          className={`${POPOVER_CLASS} bottom-full left-0 mb-1.5 max-h-48 w-72 origin-bottom-left overflow-y-auto p-3 text-[13px] text-soft`}
        >
          {quote.text}
        </p>
      )}
    </div>
  );
}
