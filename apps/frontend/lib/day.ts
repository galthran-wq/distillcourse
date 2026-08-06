// Every date the profile shows is a day, never a time: a reading history, a
// bookmark and a memory are all "when", and the hour is noise the reader would
// have to look past. Locale comes from the browser.
// A `Date` as well as a timestamp, because a square of the activity grid is a
// calendar day the browser built rather than an instant the API sent.
export function day(at: string | Date): string {
  return (typeof at === "string" ? new Date(at) : at).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
