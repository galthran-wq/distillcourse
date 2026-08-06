"use client";

import { useEffect, useMemo, useRef } from "react";
import { Panel } from "@/components/ui";
import { useSignedIn } from "@/lib/auth/signed-in";
import type { LessonLink } from "@/lib/content/site";
import { day } from "@/lib/day";
import {
  DAYS,
  STEPS,
  WEEKS,
  key,
  month,
  squares,
  tone,
  type Square,
} from "@/lib/telemetry/activity";
import { getActivity, type ActivityDay } from "@/lib/telemetry/api";
import { LessonRow, Section } from "./List";

const CELL = 10;
const GAP = 3;
// Rows are Monday to Sunday; a label on every one would not fit the height of
// a square, so every other one carries it.
const WEEKDAYS = ["Mon", "", "Wed", "", "Fri", "", ""];

function tooltip(square: Square): string {
  const lessons = square.count === 1 ? "1 lesson" : `${square.count} lessons`;
  return `${lessons} — ${day(square.date)}`;
}

function swatch(count: number): React.CSSProperties {
  return { background: tone(count), width: CELL, height: CELL };
}

function Heatmap({ days }: { days: ActivityDay[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  const cells = useMemo(() => squares(days, new Date()), [days]);
  const today = key(new Date());

  useEffect(() => {
    // Where the grid is too wide for the screen, it opens on the weeks the
    // reader has just lived rather than on last summer.
    const box = scroller.current;
    if (box !== null) box.scrollLeft = box.scrollWidth;
  }, [cells]);

  return (
    <div className="flex gap-2">
      <div
        className="mt-5 grid shrink-0 font-mono text-[9px] leading-none text-faint"
        style={{ gridTemplateRows: `repeat(${DAYS}, ${CELL}px)`, gap: GAP }}
      >
        {WEEKDAYS.map((label, index) => (
          <span key={index} className="flex items-center">
            {label}
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
            // drawn as a day with nothing read on it.
            square.key > today ? (
              <span key={square.key} />
            ) : (
              <span
                key={square.key}
                title={tooltip(square)}
                className="rounded-[2px]"
                style={swatch(square.count)}
              />
            ),
          )}
        </div>
      </div>
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

/**
 * The reader's year of reading, and what they read last. One panel, because
 * the two answer the same question at two zoom levels.
 */
export default function Activity({ lessons }: { lessons: Record<string, LessonLink> }) {
  const [activity] = useSignedIn(getActivity);

  return (
    <Section title="activity">
      <Panel>
        {/* Nothing loaded yet, or the request failed: the grid is drawn empty
            either way, so nobody is shown a broken panel. */}
        <Heatmap days={activity?.days ?? []} />
        <Legend />
        {activity !== null &&
          (activity.recent.length === 0 ? (
            <p className="mt-4 border-t border-line pt-4 text-sm text-faint">
              No lessons read yet.
            </p>
          ) : (
            <ul className="mt-4 border-t border-line pt-1">
              {activity.recent.map((item) => (
                <LessonRow
                  key={item.lesson}
                  lesson={item.title ?? item.lesson}
                  link={lessons[item.lesson]}
                  note={day(item.last_seen)}
                />
              ))}
            </ul>
          ))}
      </Panel>
    </Section>
  );
}
