import { call } from "@/lib/http";

export interface Standing {
  /** `<course>/<slug>` — the coordinate the site's own lesson routes use. */
  lesson: string;
  state: "read" | "started";
  last_seen: string;
}

/** `course` empty for every course the reader has started. */
export function getProgress(course: string): Promise<Standing[]> {
  return call<Standing[]>(
    course === "" ? "/progress" : `/progress?course=${encodeURIComponent(course)}`,
  );
}
