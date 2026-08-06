import { call } from "@/lib/http";

/** A day of the grid: the lessons it earned, and everything it was spent on. */
export interface ActivityDay {
  date: string;
  count: number;
  minutes: number;
}

/**
 * One lesson on one day, every sitting of it coalesced. `first_at` and
 * `last_at` are stated in the reader's own zone — the zone the date is cut in —
 * so they are read off the string rather than through a `Date`, which would
 * convert them into the browser's.
 */
export interface ActivityEntry {
  date: string;
  lesson: string;
  seconds: number;
  first_at: string;
  last_at: string;
}

export interface Activity {
  days: ActivityDay[];
  feed: ActivityEntry[];
}

export interface DayActivity {
  feed: ActivityEntry[];
}

export function getActivity(): Promise<Activity> {
  return call<Activity>("/telemetry/activity");
}

export function getActivityOn(date: string): Promise<DayActivity> {
  return call<DayActivity>(`/telemetry/activity/${date}`);
}
