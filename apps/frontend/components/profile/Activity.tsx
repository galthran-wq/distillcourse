"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button, Panel } from "@/components/ui";
import { useSignedIn } from "@/lib/auth/signed-in";
import type { LessonLink } from "@/lib/content/site";
import { day } from "@/lib/day";
import { answered } from "@/lib/load";
import {
  DAYS,
  STEPS,
  WEEKS,
  group,
  key,
  month,
  sitting,
  spent,
  squares,
  tone,
  type Square,
} from "@/lib/telemetry/activity";
import {
  getActivity,
  getActivityOn,
  type ActivityDay,
  type ActivityEntry,
} from "@/lib/telemetry/api";
import { LessonRow, Section } from "./List";

const CELL = 10;
const GAP = 3;
/** One column of the grid, which is what a week is worth horizontally. */
const COLUMN = CELL + GAP;
// Rows are Monday to Sunday; a label on every one would not fit the height of
// a square, so every other one carries it.
const WEEKDAYS = ["Mon", "", "Wed", "", "Fri", "", ""];
// Clear of the square without leaving the pointer's reach of it.
const TOOLTIP_GAP = 6;
// What the arrows do once the grid has focus: a day along the column, a week
// across it.
const ARROWS = new Map([
  ["ArrowUp", -1],
  ["ArrowDown", 1],
  ["ArrowLeft", -DAYS],
  ["ArrowRight", DAYS],
]);

function label(square: Square): string {
  const said = [day(square.date)];
  if (square.count > 0) {
    said.push(square.count === 1 ? "1 lesson" : `${square.count} lessons`);
  }
  if (square.seconds > 0) said.push(spent(square.seconds));
  // Only a day with neither a lesson to its name nor a second on it.
  if (said.length === 1) said.push("no reading");
  return said.join(" · ");
}

function swatch(count: number): React.CSSProperties {
  return { background: tone(count), width: CELL, height: CELL };
}

/**
 * A day that has not happened yet is left out of the grid, not drawn as a day
 * with nothing read on it. Only an empty one: this browser's calendar and the
 * zone the counts are dated in can disagree by a day, and a day with reading on
 * it — credited or not — is never a day that has not happened.
 */
function shown(square: Square, today: string): boolean {
  return square.count > 0 || square.seconds > 0 || square.key <= today;
}

interface Pointed {
  square: Square;
  /**
   * The square's centre in the grid's own coordinates. Not its measured left:
   * the scroller moves under it, and a rect read before that move points a
   * grid-width away from the square it belongs to.
   */
  x: number;
  top: number;
  /** The frame the tooltip has to stay inside. */
  width: number;
}

function Heatmap({
  days,
  selected,
  onSelect,
}: {
  days: ActivityDay[];
  selected: string | null;
  onSelect: (day: string | null) => void;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const tip = useRef<HTMLSpanElement>(null);
  const [pointed, setPointed] = useState<Pointed | null>(null);
  const [scrolled, setScrolled] = useState(0);
  const [half, setHalf] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const cells = useMemo(() => squares(days, new Date()), [days]);
  const today = key(new Date());
  // The days that have not happened are the tail of the last column, so a
  // square's place in this list is its place in the grid: the column it sits
  // in, and the step the arrows take from one square to the next.
  const drawn = useMemo(() => cells.filter((cell) => shown(cell, today)), [cells, today]);
  // One tab stop for the whole grid rather than a year of them, opening on the
  // most recent day; the arrows move within it.
  const roving = Math.min(active ?? drawn.length - 1, drawn.length - 1);

  useEffect(() => {
    // Where the grid is too wide for the screen, it opens on the weeks the
    // reader has just lived rather than on last summer.
    const box = scroller.current;
    if (box === null) return;
    box.scrollLeft = box.scrollWidth;
    setScrolled(box.scrollLeft);
  }, [cells]);

  // After the tooltip is laid out and before it is painted: the clamp below
  // needs its width, and the text it is given decides that.
  useLayoutEffect(() => {
    setHalf((tip.current?.offsetWidth ?? 0) / 2);
  }, [pointed]);

  // Anchored against the frame rather than drawn inside the scroller: that box
  // scrolls sideways, which makes it clip on both axes, and a tooltip over the
  // top row would be cut off by it.
  function point(square: Square, index: number, at: HTMLElement) {
    const host = frame.current?.getBoundingClientRect();
    const box = scroller.current;
    if (host === undefined || box === null) return;
    setPointed({
      square,
      // Reaching a square by keyboard scrolls it into view, and in some
      // browsers that happens after this handler has run — so the column is
      // taken from the grid, and only the scroll offset is read live.
      x:
        box.getBoundingClientRect().left -
        host.left +
        Math.floor(index / DAYS) * COLUMN +
        CELL / 2,
      // Safe to measure: the scroller only ever moves sideways.
      top: at.getBoundingClientRect().top - host.top - TOOLTIP_GAP,
      width: host.width,
    });
  }

  function move(event: React.KeyboardEvent, from: number) {
    const step = ARROWS.get(event.key);
    if (step === undefined) return;
    // Or the arrows scroll the page out from under the square they moved to.
    event.preventDefault();
    const to = Math.min(Math.max(from + step, 0), drawn.length - 1);
    frame.current?.querySelector<HTMLElement>(`[data-square="${drawn[to].key}"]`)?.focus();
  }

  return (
    <div ref={frame} className="relative flex gap-2">
      <div
        className="mt-5 grid shrink-0 text-[10px] leading-none text-faint"
        style={{ gridTemplateRows: `repeat(${DAYS}, ${CELL}px)`, gap: GAP }}
      >
        {WEEKDAYS.map((weekday, index) => (
          <span key={index} className="flex items-center">
            {weekday}
          </span>
        ))}
      </div>
      {/* min-w-0, or a flex item sizes to its content and a year of squares
          pushes the page sideways instead of scrolling inside the panel.
          pr-3: the last month label overflows its column, and the scroll
          extent has to include it. */}
      <div
        ref={scroller}
        onScroll={(event) => setScrolled(event.currentTarget.scrollLeft)}
        className="min-w-0 overflow-x-auto pr-3"
      >
        <div
          className="mb-1 grid h-4 grid-flow-col text-[11px] leading-none text-faint"
          style={{ gridAutoColumns: `${CELL}px`, gap: GAP }}
        >
          {Array.from({ length: WEEKS }, (_, week) => (
            <span key={week} className="whitespace-nowrap">
              {month(cells, week)}
            </span>
          ))}
        </div>
        <div
          className="grid grid-flow-col"
          style={{
            gridTemplateRows: `repeat(${DAYS}, ${CELL}px)`,
            gridAutoColumns: `${CELL}px`,
            gap: GAP,
          }}
        >
          {drawn.map((square, index) => (
            <button
              key={square.key}
              type="button"
              aria-label={label(square)}
              aria-pressed={selected === square.key}
              data-square={square.key}
              tabIndex={index === roving ? 0 : -1}
              onMouseEnter={(event) => point(square, index, event.currentTarget)}
              onMouseLeave={() => setPointed(null)}
              onFocus={(event) => {
                setActive(index);
                point(square, index, event.currentTarget);
              }}
              onBlur={() => setPointed(null)}
              onKeyDown={(event) => move(event, index)}
              onClick={() => onSelect(selected === square.key ? null : square.key)}
              className={`block cursor-pointer rounded-[2px] p-0 ring-accent hover:ring-1 focus-visible:ring-1 focus-visible:outline-none ${
                selected === square.key ? "ring-2" : ""
              }`}
              style={swatch(square.count)}
            />
          ))}
        </div>
      </div>
      {pointed !== null && (
        <span
          ref={tip}
          role="tooltip"
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-sm border border-line bg-paper px-2 py-1 text-[11px] whitespace-nowrap tabular-nums text-soft"
          style={{
            // Held inside the frame: the last column's tooltip would otherwise
            // hang off the panel and widen the whole page on a phone.
            left: Math.min(Math.max(pointed.x - scrolled, half), pointed.width - half),
            top: pointed.top,
          }}
        >
          {label(pointed.square)}
        </span>
      )}
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-2 flex items-center justify-end gap-1 text-[11px] text-faint">
      <span className="mr-1">less</span>
      {Array.from({ length: STEPS }, (_, count) => (
        <span key={count} className="rounded-[2px]" style={swatch(count)} />
      ))}
      <span className="ml-1">more</span>
    </div>
  );
}

/**
 * The lines under the grid, cut into days. `undefined` is a request still in
 * flight and `null` is one that failed: a section holding nothing but a back
 * button says neither of those.
 */
function Feed({
  lessons,
  feed,
  selected,
}: {
  lessons: Record<string, LessonLink>;
  feed: ActivityEntry[] | null | undefined;
  selected: string | null;
}) {
  if (feed === undefined) return null;
  if (feed === null) {
    return <p className="text-sm text-faint">Couldn&apos;t load this day.</p>;
  }
  if (feed.length === 0) {
    return (
      <p className="text-sm text-faint">
        {selected === null ? "No lessons read yet." : "Nothing read on this day."}
      </p>
    );
  }
  return (
    <>
      {group(feed).map(([date, entries]) => (
        <div key={date} className="mt-5 first:mt-0">
          <h3 className="mb-1 text-[12px] text-faint">{day(date)}</h3>
          <ul>
            {entries.map((entry) => (
              <LessonRow
                key={entry.lesson}
                lesson={entry.lesson}
                link={lessons[entry.lesson]}
                note={sitting(entry)}
              />
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

/**
 * The reader's year of reading, and the days it was made of. Two blocks: the
 * grid, and the feed a square of it opens.
 *
 * Nothing is drawn until there is something to draw — an empty grid is what a
 * reader who has read nothing looks like, and a request that failed or has not
 * answered yet is not that.
 */
export default function Activity({ lessons }: { lessons: Record<string, LessonLink> }) {
  const [activity] = useSignedIn(getActivity);
  const [selected, setSelected] = useState<string | null>(null);
  const [byDay, setByDay] = useState<Record<string, ActivityEntry[] | null>>({});

  useEffect(() => {
    if (selected === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selected]);

  useEffect(() => {
    // A day already answered is kept, however it answered: the squares around
    // it are one click apart, the answer cannot change while the page is open,
    // and a day that failed stays failed rather than retrying on every render.
    if (selected === null || selected in byDay) return;
    return answered(getActivityOn(selected), (loaded) =>
      setByDay((all) => ({ ...all, [selected]: loaded })),
    );
  }, [selected, byDay]);

  if (activity === null) return null;

  const feed: ActivityEntry[] | null | undefined =
    selected === null ? activity.feed : byDay[selected];

  return (
    <>
      <Section title="activity">
        <Panel>
          <Heatmap days={activity.days} selected={selected} onSelect={setSelected} />
          <Legend />
        </Panel>
      </Section>
      <Section title="activity feed">
        {selected !== null && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelected(null)}
            className="mb-3"
          >
            ← Back to recent
          </Button>
        )}
        <Feed lessons={lessons} feed={feed} selected={selected} />
      </Section>
    </>
  );
}
