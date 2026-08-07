/**
 * Where an event happened, read off the page. A `target` is what the tracker
 * dedupes on and what the aggregate counts distinct, so these strings are
 * closer to keys than to labels and belong beside the rest of the rules.
 */

import { sectionAnchor } from "@/lib/lesson/anchor";
import type { ToggleKind } from "@/lib/telemetry/tracker";

// Explicit hooks, not the presentation classes: a class rename in
// components/mdx/Blocks.tsx would otherwise drop the counts to zero silently.
export const TOGGLES: Record<ToggleKind, string> = {
  proof: 'details[data-toggle="proof"]',
  solution: 'details[data-toggle="solution"]',
  aside: 'details[data-toggle="aside"]',
};
export const DEMO = "[data-demo]";

/** How much of the page has been reached, in percent. */
export function readingDepth(): number {
  const scrollable = document.documentElement.scrollHeight;
  return scrollable > 0
    ? ((window.scrollY + window.innerHeight) / scrollable) * 100
    : 100;
}

/** `<section-anchor>/<kind><n>`: which proof, in which section. */
export function targetOf(element: Element, kind: string, selector: string): string {
  const anchor = sectionAnchor(element);
  const position =
    [...document.querySelectorAll(selector)]
      .filter((other) => sectionAnchor(other) === anchor)
      .indexOf(element) + 1;
  return `${anchor}/${kind}${position}`;
}
