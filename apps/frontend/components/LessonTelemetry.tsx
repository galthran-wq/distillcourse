"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth/store";
import {
  HEARTBEAT_SECONDS,
  ReadingTracker,
  beacon,
  type ToggleKind,
} from "@/lib/telemetry/tracker";

/**
 * Watches one lesson page and reports the reading to the backend. Renders
 * nothing, and does nothing at all for an anonymous visitor: only signed-in
 * readers are tracked.
 */

const TOGGLES: Record<ToggleKind, string> = {
  proof: "details.env-proof",
  solution: "details.solution",
  aside: "details.aside",
};
const DEMO = "[data-demo]";

export default function LessonTelemetry({ lesson }: { lesson: string }) {
  const { status } = useAuth();

  useEffect(() => {
    if (status !== "signed-in") return;
    const tracker = new ReadingTracker(lesson, beacon);
    tracker.opened(document.referrer || undefined);
    // A lesson short enough to fit on one screen is already read to the end.
    tracker.scrolled(readingDepth());

    const beat = window.setInterval(
      () => tracker.tick(document.visibilityState === "visible"),
      HEARTBEAT_SECONDS * 1000,
    );
    const onActivity = () => tracker.activity();
    const onScroll = () => {
      tracker.activity();
      tracker.scrolled(readingDepth());
    };
    const onPointerDown = (event: Event) => {
      tracker.activity();
      if (!(event.target instanceof Element)) return;
      const demo = event.target.closest(DEMO);
      if (demo !== null) {
        tracker.demoTouched(
          demo.getAttribute("data-demo") ?? "",
          targetOf(demo, "demo", DEMO),
        );
      }
    };
    const onToggle = (event: Event) => {
      const details = event.target;
      if (!(details instanceof HTMLDetailsElement) || !details.open) return;
      for (const [kind, selector] of Object.entries(TOGGLES)) {
        if (details.matches(selector)) {
          tracker.toggled(kind as ToggleKind, targetOf(details, kind, selector));
        }
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") tracker.flush();
    };

    document.addEventListener("keydown", onActivity);
    document.addEventListener("pointermove", onActivity, { passive: true });
    document.addEventListener("pointerdown", onPointerDown);
    // `toggle` does not bubble, but the capture phase still reaches here.
    document.addEventListener("toggle", onToggle, true);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.clearInterval(beat);
      document.removeEventListener("keydown", onActivity);
      document.removeEventListener("pointermove", onActivity);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("toggle", onToggle, true);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("scroll", onScroll);
      // Navigating to the next lesson ends this session; what it collected
      // goes out now, not when a later page happens to flush.
      tracker.flush();
    };
  }, [lesson, status]);

  return null;
}

function readingDepth(): number {
  const scrollable = document.documentElement.scrollHeight;
  return scrollable > 0 ? ((window.scrollY + window.innerHeight) / scrollable) * 100 : 100;
}

/** The h2 the element sits under — the same anchor the content index records. */
function sectionAnchor(element: Element): string {
  for (let node: Element | null = element; node; node = node.parentElement) {
    for (
      let previous = node.previousElementSibling;
      previous;
      previous = previous.previousElementSibling
    ) {
      if (previous.tagName === "H2" && previous.id) return previous.id;
    }
  }
  // Material above the first h2 has no anchor of its own, so its targets are
  // the bare `/proof1` form.
  return "";
}

/** `<section-anchor>/<kind><n>`: which proof, in which section. */
function targetOf(element: Element, kind: string, selector: string): string {
  const anchor = sectionAnchor(element);
  const position =
    [...document.querySelectorAll(selector)]
      .filter((other) => sectionAnchor(other) === anchor)
      .indexOf(element) + 1;
  return `${anchor}/${kind}${position}`;
}
