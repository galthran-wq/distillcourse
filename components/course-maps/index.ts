import type { ComponentType } from "react";
import type { Course } from "@/lib/content/schema";
import UsHistoryMap from "./UsHistoryMap";

export interface CourseMapProps {
  spine: Course["spine"];
  courseSlug: string;
  /** lesson slug -> public URL of its key_image (only lessons that have one). */
  lessonThumbs: Record<string, string>;
  /** slugs the current build renders as readable pages. */
  readable: string[];
}

/**
 * Per-course argument-map diagrams for the course page. A map receives the
 * curated spine plus lesson thumbnails and renders a course-specific
 * roadmap; courses without an entry fall back to the text list.
 */
export const courseMaps: Record<string, ComponentType<CourseMapProps>> = {
  "us-history": UsHistoryMap,
};
