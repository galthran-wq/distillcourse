"use client";

import Palette from "@/components/chat/Palette";
import { QuoteRow, ROW_CHIP_CLASS, ROW_CHIP_WIDTH } from "@/components/chat/Quotes";
import RevealLink from "@/components/chat/RevealLink";
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
 * The places a question can point at, offered while the reader writes an `@` —
 * the rows of the list `components/chat/Palette` draws, which is where
 * everything about how it opens and how it is walked lives.
 */
export default function MentionPalette({ mentions, active, onPick }: Props) {
  // Only where the list holds more than one kind — which is only before the
  // reader has narrowed anything. A column saying "section" down a list of
  // nothing but sections is a column of noise.
  const mixed = mentions.some((one) => one.kind !== mentions[0].kind);

  return (
    <Palette
      id={MENTIONS_ID}
      label="Places in the courses"
      active={active}
      onPick={(index) => onPick(mentions[index])}
      rows={mentions.map((mention, index) => ({
        id: mentionRowId(index),
        className: mention.depth === 3 ? "pl-5" : undefined,
        children: (
          <>
            <span className="min-w-0 flex-1 truncate text-left">{mention.title}</span>
            {mention.under !== "" && (
              <span className="max-w-32 shrink-0 truncate text-faint">
                {mention.under}
              </span>
            )}
            {/* Which of the three depths the row is: at the top of the list a
                course and a lesson of it can read almost the same. */}
            {mixed && (
              <span className="shrink-0 text-[12px] text-faint">
                {mention.kind}
              </span>
            )}
          </>
        ),
      }))}
    />
  );
}

// The whole chip: the geometry the attached passages take, and the same cap
// on how wide one of them gets.
const CHIP = `${ROW_CHIP_CLASS} ${ROW_CHIP_WIDTH}`;

/**
 * The references written in a question, as chips: above the field while it is
 * being written, so that choosing one from the list visibly attaches
 * something, and pointed at the section they name so the reader can check
 * where it goes before asking. The chip is the passages' own — the two rows
 * sit one above the other in the composer and are one row of chips to read.
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
