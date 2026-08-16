"use client";

import { useEffect, useRef, useState } from "react";

/**
 * How often streamed text is re-rendered, at most. A reply arrives a token at a
 * time and each render re-parses markdown and re-runs KaTeX over the whole
 * message; per token that saturates the main thread and the tab stops painting.
 * At ~8 renders a second the cost is bounded and the growth still reads as live.
 */
export const STREAM_THROTTLE_MS = 120;

/**
 * `value`, but committed at most once per `ms` while `active` — with the last
 * value always landing once `active` goes false, so a throttled stream never
 * ends on a stale frame.
 *
 * What it is for: an answer streams a token at a time, and rendering it means
 * re-parsing markdown and re-running KaTeX over the whole message. Doing that
 * per token saturates the main thread — the tab stops painting and the browser
 * shows "Page unresponsive." Rendered ~8×/s instead, the cost is bounded no
 * matter how long the answer or how many formulas it holds; the reader sees it
 * grow in steps rather than per character, which at this rate is indistinguishable.
 *
 * Inactive it passes `value` straight through: a settled turn renders its final
 * text with no delay, and the moment a stream settles its last token shows.
 */
export function useThrottledValue<T>(value: T, ms: number, active: boolean): T {
  const [shown, setShown] = useState(value);
  // The timeout's trailing commit reads the newest value, not the one it was
  // scheduled with; kept current inside the effect, which reruns on every value.
  const latest = useRef(value);
  const lastCommit = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    latest.current = value;
    if (!active) {
      if (timer.current !== null) {
        clearTimeout(timer.current);
        timer.current = null;
      }
      lastCommit.current = 0;
      setShown(latest.current);
      return;
    }
    const flush = (): void => {
      lastCommit.current = Date.now();
      timer.current = null;
      setShown(latest.current);
    };
    const elapsed = Date.now() - lastCommit.current;
    // Leading edge: the first token of a fresh stream shows at once.
    if (elapsed >= ms) flush();
    else if (timer.current === null) timer.current = setTimeout(flush, ms - elapsed);
  }, [value, active, ms]);

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );

  return active ? shown : value;
}
