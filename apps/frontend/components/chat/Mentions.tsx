"use client";

import { QuoteRow } from "@/components/chat/Quotes";
import RevealLink from "@/components/chat/RevealLink";
import { CHIP_CLASS, MENU_ROW_CLASS, POPOVER_CLASS } from "@/components/ui/styles";
import { references, type Mention } from "@/lib/chat/mention";
import { linkTo } from "@/lib/chat/references";
import { useLessons } from "@/lib/content/links";
import { useSections } from "@/lib/content/sections";

/** What the field points its `aria-controls` and `aria-activedescendant` at. */
export const MENTIONS_ID = "chat-mentions";

export function mentionRowId(index: number): string {
  return `${MENTIONS_ID}-${index}`;
}

interface Props {
  mentions: Mention[];
  /** Which row Enter takes. The list is driven from the field it hangs over. */
  active: number;
  onPick: (mention: Mention) => void;
}

/**
 * The places a question can point at, offered while the reader writes an `@`.
 * It hangs over the composer the way the command palette does — the field is
 * at the bottom of the panel, so there is only up to open into.
 */
export default function MentionPalette({ mentions, active, onPick }: Props) {
  // Only where the list holds more than one kind — which is only before the
  // reader has narrowed anything. A column saying "section" down a list of
  // nothing but sections is a column of noise.
  const mixed = mentions.some((one) => one.kind !== mentions[0].kind);

  return (
    <div
      id={MENTIONS_ID}
      role="listbox"
      aria-label="Places in the courses"
      className={`${POPOVER_CLASS} right-0 bottom-full left-0 mb-1.5 max-h-64 origin-bottom overflow-y-auto p-1.5`}
    >
      {mentions.map((mention, index) => (
        <button
          key={mention.locator}
          id={mentionRowId(index)}
          type="button"
          role="option"
          aria-selected={index === active}
          // The press must not take the focus out of the field: that is where
          // the reference is being written and where the reader goes on typing.
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onPick(mention)}
          className={`${MENU_ROW_CLASS} items-baseline gap-2 ${
            index === active ? "bg-line/60 text-ink" : "text-soft"
          } ${mention.depth === 3 ? "pl-5" : ""}`}
        >
          <span className="min-w-0 flex-1 truncate text-left">{mention.title}</span>
          {mention.under !== "" && (
            <span className="max-w-32 shrink-0 truncate text-faint">{mention.under}</span>
          )}
          {/* Which of the three depths the row is: at the top of the list a
              course and a lesson of it can read almost the same. */}
          {mixed && (
            <span className="shrink-0 font-mono text-[11px] text-faint">
              {mention.kind}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// A chip's own geometry, on top of the look every chip on the site shares —
// the same line the attached passages take (components/chat/Quotes).
const CHIP = `${CHIP_CLASS} min-w-0 max-w-64 gap-1.5 px-2 py-1`;

/**
 * The references written in a question, as chips: above the field while it is
 * being written, so that choosing one from the list visibly attaches
 * something, and pointed at the section they name so the reader can check
 * where it goes before asking.
 */
export function MentionRow({ draft }: { draft: string }) {
  const lessons = useLessons();
  const sections = useSections();
  const written = references(draft, lessons);
  if (written.length === 0) return null;

  return (
    <QuoteRow>
      {written.map((reference) => {
        const target = linkTo(reference.locator, lessons, sections);
        // `references` only returns what the site renders, so there is always
        // a page; the guard is what makes that legible rather than asserted.
        return target === null ? null : (
          <RevealLink key={reference.at} href={target.url} className={CHIP}>
            <span className="truncate">{target.text}</span>
          </RevealLink>
        );
      })}
    </QuoteRow>
  );
}
