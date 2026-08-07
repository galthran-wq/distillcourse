"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth/store";
import { ReadingTracker, beacon } from "@/lib/telemetry/tracker";
import { watch } from "@/lib/telemetry/watch";

/**
 * Watches one lesson page and reports the reading to the backend. Renders
 * nothing, and does nothing at all for an anonymous visitor: only signed-in
 * readers are tracked.
 */
export default function LessonTelemetry({ lesson }: { lesson: string }) {
  const { status } = useAuth();

  useEffect(() => {
    if (status !== "signed-in") return;
    return watch(new ReadingTracker(lesson, beacon));
  }, [lesson, status]);

  return null;
}
