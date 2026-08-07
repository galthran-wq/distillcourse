import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { ReactNode } from "react";
import { afterEach, beforeEach } from "vitest";

export interface Mounted {
  /** The element the component was rendered into. */
  host: () => HTMLElement;
  /**
   * Put a tree in it. The caller supplies the `act` around this: a sync one
   * where mounting only renders, `await act(async …)` where mounting also
   * resolves a request — which is the one thing the three callers differ in.
   */
  render: (tree: ReactNode) => void;
}

/**
 * A host element and a React root, made before each test and taken down after
 * it — for the tests that need a real DOM rather than a string of markup.
 *
 * Call it at the top level of a `@vitest-environment jsdom` file: it registers
 * the hooks itself, so no test file spells the mount-unmount pair out again.
 */
export function mounted(tag = "div"): Mounted {
  let root: Root;
  let host: HTMLElement;

  beforeEach(() => {
    // React only treats `act` as a real boundary when this is set; without it
    // the updates a click schedules are not flushed by the time it returns.
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
      true;
    host = document.createElement(tag);
    document.body.append(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  return { host: () => host, render: (tree) => root.render(tree) };
}

/**
 * The reader typing, given as the whole value the field ends up holding.
 *
 * React dedupes a change event against the value it last saw, and that tracker
 * lives on the element's own `value` setter — so a test that assigns to it is
 * the one case React ignores. Writing through the prototype is what a keystroke
 * does.
 */
export function type(
  field: HTMLInputElement | HTMLTextAreaElement,
  value: string,
): void {
  const prototype =
    field instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(field, value);
  act(() => field.dispatchEvent(new Event("input", { bubbles: true })));
}
