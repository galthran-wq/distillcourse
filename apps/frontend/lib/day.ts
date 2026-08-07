const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A date the API named rather than an instant it stamped. `new Date` reads one
 * as midnight UTC, which is the day before west of Greenwich — and the whole
 * point of these is that the backend already cut them on the reader's calendar.
 */
function calendar(at: string): Date {
  const [year, month, date] = at.split("-").map(Number);
  return new Date(year, month - 1, date);
}

// Every date the profile shows is a day, never a time: a reading history, a
// bookmark and a memory are all "when", and the hour is noise the reader would
// have to look past. Locale comes from the browser.
// A `Date` as well as a timestamp, because a square of the activity grid is a
// calendar day the browser built rather than an instant the API sent.
// `withYear` is off only where the year is already known to be this one and
// the column is too narrow to spend width on it — see `ago`.
export function day(at: string | Date, withYear = true): string {
  const on =
    typeof at === "string" && DATE_ONLY.test(at) ? calendar(at) : new Date(at);
  return on.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: withYear ? "numeric" : undefined,
  });
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/**
 * How long ago, in the room a list row has for it: "now", "5m", "2h", "3d",
 * and a date once a count of days has stopped being read at a glance. The
 * year is only worth its width when it is not this one.
 *
 * `now` is a parameter because a relative date is only as testable as the
 * moment it is relative to.
 */
export function ago(at: string | Date, now: number = Date.now()): string {
  const on = new Date(at);
  const elapsed = now - on.getTime();
  if (elapsed < MINUTE) return "now";
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h`;
  if (elapsed < WEEK) return `${Math.floor(elapsed / DAY)}d`;
  return day(on, on.getFullYear() !== new Date(now).getFullYear());
}
