import { call } from "@/lib/http";

export interface Standing {
  /** `<course>/<slug>` — the coordinate the site's own lesson routes use. */
  lesson: string;
  state: "read" | "started";
  last_seen: string;
}

export function getProgress(course: string): Promise<Standing[]> {
  return call<Standing[]>(`/progress?course=${encodeURIComponent(course)}`);
}
