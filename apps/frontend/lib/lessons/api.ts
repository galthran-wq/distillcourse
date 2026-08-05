import { LESSON_PREFIX } from "@/lib/content/locator";
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

// The key is the index locator; the route prefix already says which corpus it
// is, so the path carries the coordinate without it.
function path(lesson: string): string {
  return `/lessons/${lesson.slice(LESSON_PREFIX.length)}`;
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
