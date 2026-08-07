import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { ReactNode } from "react";
import { afterEach, beforeEach, vi, type Mock } from "vitest";

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
 * jsdom has no ResizeObserver, and the tutor's composer watches its own width
 * to know how many rows the draft wraps into. Nothing in a test changes that
 * width, so observing is all this has to do.
 */
export function stubResizeObserver(): void {
  globalThis.ResizeObserver = class implements ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
}

/**
 * jsdom implements no scrolling at all — the method is simply not there — and
 * two things under test call it: the chip that lands on a section, and a list
 * bringing the row the arrows walked to into view. Put on before each test and
 * taken off after it, so that no test inherits another's spy.
 *
 * Call it at the top level of a `@vitest-environment jsdom` file; the returned
 * spy is what to assert against.
 */
export function stubScrollIntoView(): Mock {
  const scroll = vi.fn();

  beforeEach(() => {
    Element.prototype.scrollIntoView = scroll;
  });

  afterEach(() => {
    scroll.mockClear();
    delete (Element.prototype as Partial<Element>).scrollIntoView;
  });

  return scroll;
}

/**
 * The reader typing, given as the whole value the field ends up holding and
 * where the keystroke left the caret — at the end of it unless the reader was
 * writing in the middle of the line.
 *
 * React dedupes a change event against the value it last saw, and that tracker
 * lives on the element's own `value` setter — so a test that assigns to it is
 * the one case React ignores. Writing through the prototype is what a keystroke
 * does.
 */
export function type(
  field: HTMLInputElement | HTMLTextAreaElement,
  value: string,
  caret = value.length,
): void {
  const prototype =
    field instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(field, value);
  field.setSelectionRange(caret, caret);
  act(() => field.dispatchEvent(new Event("input", { bubbles: true })));
}
