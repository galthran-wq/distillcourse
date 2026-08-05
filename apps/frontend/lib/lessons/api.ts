import { call } from "@/lib/http";

export type Rating = 1 | -1;

export interface LessonState {
  rating: Rating | null;
  bookmarked: boolean;
}

export interface Visit {
  lesson: string;
  last_seen: string;
  completed_at: string | null;
}

export interface Bookmarked {
  lesson: string;
  created_at: string;
}

export interface Profile {
  history: Visit[];
  bookmarks: Bookmarked[];
}

// "<course>/<lesson>" is the key the API stores state under, and the path it
// takes it on.
function path(lesson: string): string {
  return `/lessons/${lesson}`;
}

export function getLessonState(lesson: string): Promise<LessonState> {
  return call<LessonState>(path(lesson));
}

export function rateLesson(lesson: string, value: Rating): Promise<void> {
  return call<void>(`${path(lesson)}/rating`, "PUT", { value });
}

export function setBookmark(lesson: string, bookmarked: boolean): Promise<void> {
  return call<void>(`${path(lesson)}/bookmark`, bookmarked ? "PUT" : "DELETE");
}

export function getProfile(): Promise<Profile> {
  return call<Profile>("/profile");
}
