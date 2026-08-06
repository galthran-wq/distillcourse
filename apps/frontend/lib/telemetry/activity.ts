/**
 * The geometry of the activity grid: a year of full weeks, one column each,
 * Monday at the top. Kept out of the component because it is arithmetic on
 * dates — the part worth testing.
 */

import type { ActivityDay } from "@/lib/telemetry/api";

/**
 * Mirrors ACTIVITY_WEEKS in apps/backend/app/telemetry/passes.py, which bounds
 * the query. This is the side that decides how many squares there are: the
 * grid is drawn on the browser's calendar, and the backend windows on the zone
 * stored against the account, so it deliberately returns a week more than this.
 */
export const WEEKS = 53;
export const DAYS = 7;
/** Steps of the intensity scale, counting the blank one. */
export const STEPS = 5;

export interface Square {
  date: Date;
  /** The day as the API names it, and how two days are compared. */
  key: string;
  count: number;
}

function two(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * The local calendar date, which `toISOString` would not give: it converts to
 * UTC first, and west of Greenwich that is yesterday.
 */
export function key(at: Date): string {
  return `${at.getFullYear()}-${two(at.getMonth() + 1)}-${two(at.getDate())}`;
}

export function squares(days: ActivityDay[], today: Date): Square[] {
  const counts = new Map(days.map((day) => [day.date, day.count]));
  // Midday, so adding days never lands on the hour a clock change skips.
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  start.setDate(start.getDate() - ((today.getDay() + 6) % 7) - DAYS * (WEEKS - 1));
  return Array.from({ length: WEEKS * DAYS }, (_, index) => {
    const at = new Date(start);
    at.setDate(start.getDate() + index);
    const day = key(at);
    return { date: at, key: day, count: counts.get(day) ?? 0 };
  });
}

/** The square's colour, a step of the scale per lesson read that day. */
export function tone(count: number): string {
  const step = Math.min(count, STEPS - 1);
  // Mixed into the empty tone rather than picked: the scale is then the accent
  // of whichever theme is on, and it starts where the blank squares are.
  return step === 0
    ? "var(--line)"
    : `color-mix(in srgb, var(--accent) ${step * 25}%, var(--line))`;
}

/**
 * The month a column opens, where that is not the month the column before it
 * opened — the sparse row of labels above the grid.
 */
export function month(cells: Square[], week: number): string | null {
  const at = cells[week * DAYS].date;
  const previous = cells[(week - 1) * DAYS]?.date;
  if (previous !== undefined && previous.getMonth() === at.getMonth()) return null;
  // The first column carries its month only when the column beside it is still
  // in that month: the grid opens mid-month, and a label over one column of a
  // month that is nearly over says less than a blank.
  if (week === 0 && cells[DAYS].date.getMonth() !== at.getMonth()) return null;
  return at.toLocaleDateString(undefined, { month: "short" });
}
