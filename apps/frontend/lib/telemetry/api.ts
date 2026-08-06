import { call } from "@/lib/http";

/** A day the reader passed at least one lesson on, on their own calendar. */
export interface ActivityDay {
  date: string;
  count: number;
}

export interface Activity {
  days: ActivityDay[];
}

export function getActivity(): Promise<Activity> {
  return call<Activity>("/telemetry/activity");
}
