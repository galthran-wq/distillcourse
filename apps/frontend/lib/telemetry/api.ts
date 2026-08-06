import { call } from "@/lib/http";

/** A day the reader passed at least one lesson on, on their own calendar. */
export interface ActivityDay {
  date: string;
  count: number;
}

export interface RecentLesson {
  lesson: string;
  /** From the content index; the site names a lesson from its own build. */
  title: string | null;
  last_seen: string;
}

export interface Activity {
  days: ActivityDay[];
  recent: RecentLesson[];
}

export function getActivity(): Promise<Activity> {
  return call<Activity>("/telemetry/activity");
}
