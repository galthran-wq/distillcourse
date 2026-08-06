// Every date the profile shows is a day, never a time: a reading history, a
// bookmark and a memory are all "when", and the hour is noise the reader would
// have to look past. Locale comes from the browser.
export function day(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
