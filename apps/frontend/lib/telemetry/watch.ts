/**
 * The lesson page as the tracker sees it: browser events in, tracker calls
 * out. Kept out of the React component so that a jsdom test can mount a
 * lesson-shaped fragment and watch what a reader's clicks turn into.
 */

import { DEMO, TOGGLES, readingDepth, targetOf } from "@/lib/telemetry/targets";
import {
  HEARTBEAT_SECONDS,
  type ReadingTracker,
  type ToggleKind,
} from "@/lib/telemetry/tracker";

/** Starts watching the current document; the teardown is the last flush. */
export function watch(tracker: ReadingTracker): () => void {
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
    // Navigating to the next lesson ends this session; what it collected goes
    // out now, not when a later page happens to flush.
    tracker.flush();
  };
}
