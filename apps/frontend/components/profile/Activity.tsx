"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Panel } from "@/components/ui";
import { useSignedIn } from "@/lib/auth/signed-in";
import type { LessonLink } from "@/lib/content/site";
import { day } from "@/lib/day";
import {
  DAYS,
  STEPS,
  WEEKS,
  group,
  key,
  month,
  sitting,
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
// Rows are Monday to Sunday; a label on every one would not fit the height of
// a square, so every other one carries it.
const WEEKDAYS = ["Mon", "", "Wed", "", "Fri", "", ""];
// Clear of the square without leaving the pointer's reach of it.
const TOOLTIP_GAP = 6;

function label(square: Square): string {
  const said = [day(square.date)];
  if (square.count > 0) {
    said.push(square.count === 1 ? "1 lesson" : `${square.count} lessons`);
  }
  if (square.minutes > 0) said.push(`${square.minutes} min`);
  if (said.length === 1) said.push("no reading");
  return said.join(" · ");
}

function swatch(count: number): React.CSSProperties {
  return { background: tone(count), width: CELL, height: CELL };
}

interface Pointed {
  square: Square;
  left: number;
  top: number;
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
  const [pointed, setPointed] = useState<Pointed | null>(null);
  const cells = useMemo(() => squares(days, new Date()), [days]);
  const today = key(new Date());

  useEffect(() => {
    // Where the grid is too wide for the screen, it opens on the weeks the
    // reader has just lived rather than on last summer.
    const box = scroller.current;
    if (box !== null) box.scrollLeft = box.scrollWidth;
  }, [cells]);

  // Measured against the frame rather than drawn inside the scroller: that box
  // scrolls sideways, which makes it clip on both axes, and a tooltip over the
  // top row would be cut off by it.
  function point(square: Square, at: HTMLElement) {
    const host = frame.current?.getBoundingClientRect();
    if (host === undefined) return;
    const box = at.getBoundingClientRect();
    setPointed({
      square,
      left: box.left - host.left + box.width / 2,
      top: box.top - host.top - TOOLTIP_GAP,
    });
  }

  return (
    <div ref={frame} className="relative flex gap-2">
      <div
        className="mt-5 grid shrink-0 font-mono text-[9px] leading-none text-faint"
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
      <div ref={scroller} className="min-w-0 overflow-x-auto pr-3">
        <div
          className="mb-1 grid h-4 grid-flow-col font-mono text-[10px] leading-none text-faint"
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
          {cells.map((square) =>
            // A day that has not happened yet is left out of the grid, not
            // drawn as a day with nothing read on it. Only an empty one: this
            // browser's calendar and the zone the counts are dated in can
            // disagree by a day, and a square with reading in it is never a
            // day that has not happened.
            square.count === 0 && square.key > today ? (
              <span key={square.key} />
            ) : (
              <button
                key={square.key}
                type="button"
                aria-label={label(square)}
                aria-pressed={selected === square.key}
                data-square={square.key}
                onMouseEnter={(event) => point(square, event.currentTarget)}
                onMouseLeave={() => setPointed(null)}
                onFocus={(event) => point(square, event.currentTarget)}
                onBlur={() => setPointed(null)}
                onClick={() => onSelect(selected === square.key ? null : square.key)}
                className={`block cursor-pointer rounded-[2px] p-0 ring-accent hover:ring-1 focus-visible:ring-1 focus-visible:outline-none ${
                  selected === square.key ? "ring-2" : ""
                }`}
                style={swatch(square.count)}
              />
            ),
          )}
        </div>
      </div>
      {pointed !== null && (
        <span
          role="tooltip"
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded border border-line bg-paper px-2 py-1 font-mono text-[10px] whitespace-nowrap text-soft"
          style={{ left: pointed.left, top: pointed.top }}
        >
          {label(pointed.square)}
        </span>
      )}
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-2 flex items-center justify-end gap-1 font-mono text-[10px] text-faint">
      <span className="mr-1">less</span>
      {Array.from({ length: STEPS }, (_, count) => (
        <span key={count} className="rounded-[2px]" style={swatch(count)} />
      ))}
      <span className="ml-1">more</span>
    </div>
  );
}

function Feed({
  lessons,
  feed,
}: {
  lessons: Record<string, LessonLink>;
  feed: ActivityEntry[];
}) {
  return (
    <>
      {group(feed).map(([date, entries]) => (
        <div key={date} className="mt-5 first:mt-0">
          <h3 className="mb-1 font-mono text-[11px] text-faint">{day(date)}</h3>
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
  const [byDay, setByDay] = useState<Record<string, ActivityEntry[]>>({});

  useEffect(() => {
    if (selected === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selected]);

  useEffect(() => {
    // A day already fetched is kept: the squares around it are one click apart
    // and the answer cannot change while the page is open.
    if (selected === null || selected in byDay) return;
    let current = true;
    getActivityOn(selected).then(
      (loaded) => {
        if (current) setByDay((all) => ({ ...all, [selected]: loaded.feed }));
      },
      () => {},
    );
    return () => {
      current = false;
    };
  }, [selected, byDay]);

  if (activity === null) return null;

  const feed = selected === null ? activity.feed : byDay[selected];

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
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="mb-3 cursor-pointer font-mono text-[11px] text-faint hover:text-accent"
          >
            ← back to recent
          </button>
        )}
        {feed !== undefined &&
          (feed.length === 0 ? (
            <p className="text-sm text-faint">
              {selected === null ? "No lessons read yet." : "Nothing read on this day."}
            </p>
          ) : (
            <Feed lessons={lessons} feed={feed} />
          ))}
      </Section>
    </>
  );
}
