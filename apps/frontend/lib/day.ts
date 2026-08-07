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
export function day(at: string | Date): string {
  const on =
    typeof at === "string" && DATE_ONLY.test(at) ? calendar(at) : new Date(at);
  return on.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
