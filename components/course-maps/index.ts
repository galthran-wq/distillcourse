import type { ComponentType } from "react";
import type { Course } from "@/lib/content/schema";
import UsHistoryMap from "./UsHistoryMap";

/**
 * Per-course argument-map diagrams for the course page. A map receives the
 * course's spine (curated in course.yaml) and renders it as a custom
 * diagram; courses without an entry fall back to the text list.
 */
export const courseMaps: Record<
  string,
  ComponentType<{ spine: Course["spine"] }>
> = {
  "us-history": UsHistoryMap,
};
