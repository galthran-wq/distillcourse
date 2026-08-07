"use client";

import { useRef, useState, type ReactNode } from "react";
import { CloseIcon } from "@/components/chat/icons";
import RevealLink from "@/components/chat/RevealLink";
import { CHIP_CLASS, POPOVER_CLASS } from "@/components/ui/styles";
import { dropQuote, type Quote } from "@/lib/chat/quote";
import { linkTo } from "@/lib/chat/references";
import { useLessons } from "@/lib/content/links";
import { useDismiss } from "@/lib/ui/dismiss";

/**
 * A chip in such a row, on top of the look every chip on the site shares. Both
 * rows take it — the passages here and the places the message points at
 * (`components/chat/Mentions`), which sit directly above them in the composer
 * and would read as a second kind of chip if either restyled on its own.
 */
export const ROW_CHIP_CLASS = `${CHIP_CLASS} min-w-0 gap-1.5 py-1 pr-1.5 pl-2 text-left`;

/**
 * A cap rather than a size, and it belongs to whatever the row holds: a short
 * passage takes what it needs, a long one is cut off at the point where a row
 * of them stops being scannable. Kept off the class above because the chip
 * that can be taken off again puts it on the pair of buttons rather than on
 * each of them.
 */
export const ROW_CHIP_WIDTH = "max-w-64";

// How much of a passage a label reads out. The whole of one is a paragraph,
// and a paragraph is not a control's name.
const SPOKEN = 40;

function opening(text: string): string {
  return text.length <= SPOKEN ? text : `${text.slice(0, SPOKEN).trimEnd()}…`;
}

/**
 * The row a message's chips sit in. The passages it quotes take this row above
 * the question in the composer and this row again above the bubble it was sent
 * as, so a passage does not move when the message goes; the places it points
 * at (`components/chat/Mentions`) take a row of their own in the composer only
 * — once sent they are inline in the prose, because that is where they were
 * written.
 *
 * It is also what a preview opens against: a chip that wrapped onto a second
 * row would otherwise open its own preview off the side of a panel that cannot
 * scroll to it.
 */
export function QuoteRow({ children }: { children: ReactNode }) {
  return <div className="relative mb-2 flex flex-wrap gap-1.5">{children}</div>;
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
  const chip = `${ROW_CHIP_CLASS} ${ROW_CHIP_WIDTH}`;

  // A lesson the site no longer renders — a chat older than the course, a
  // lesson withdrawn since — leaves the passage readable with nothing to click.
  if (target === null) return <span className={chip}>{label}</span>;
  return (
    <RevealLink href={target.url} className={chip} title={quote.text}>
      {label}
    </RevealLink>
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

  useDismiss(open, root, setOpen);

  return (
    <div ref={root} className={`flex min-w-0 ${ROW_CHIP_WIDTH}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={`${ROW_CHIP_CLASS} flex-1 rounded-r-none border-r-0`}
      >
        <Label quote={quote} title={target?.text} />
      </button>
      <button
        type="button"
        onClick={() => dropQuote(quote)}
        aria-label={`Drop the passage “${opening(quote.text)}”`}
        // Named per side: the chip's padding is uneven, and its `pl-2` is the
        // later rule of the two, so a shorthand here would lose the left of it.
        className={`${ROW_CHIP_CLASS} shrink-0 rounded-l-none pr-1.5 pl-1.5`}
      >
        <CloseIcon className="size-3" />
      </button>
      {open && (
        <p
          // Over the composer rather than under it: the field is at the bottom
          // of the panel, and there is nothing below it to open into. The width
          // of the row rather than of the chip, for the reason the row gives.
          className={`${POPOVER_CLASS} bottom-full right-0 left-0 mb-1.5 max-h-48 origin-bottom overflow-y-auto p-3 text-[13px] text-soft`}
        >
          {quote.text}
        </p>
      )}
    </div>
  );
}
