// @vitest-environment jsdom
import { act } from "react";
import { describe, expect, it } from "vitest";
import { composing } from "./chat-fixture";
import { stubResizeObserver, stubScrollIntoView, type } from "./utils/dom";

stubResizeObserver();
stubScrollIntoView();

describe("the composer while the tutor answers", () => {
  const { host, composer, field, press, listed, sent, stops } = composing();

  function button(label: string): HTMLButtonElement | null {
    return host().querySelector<HTMLButtonElement>(`[aria-label="${label}"]`);
  }

  it("puts a stop button where the send button was", () => {
    composer(true);

    expect(button("Send")).toBeNull();
    act(() => button("Stop")!.click());
    expect(stops()).toBe(1);
  });

  it("stops on Escape", () => {
    composer(true);

    press("Escape");

    expect(stops()).toBe(1);
  });

  it("still sends: what is written now steers the answer", () => {
    composer(true);
    type(field(), "focus on the path length");

    press("Enter");

    expect(sent).toEqual(["focus on the path length"]);
  });

  it("spends Escape on an open list rather than on the run", () => {
    composer(true);
    type(field(), "/");

    press("Escape");

    expect(listed()).toEqual([]);
    expect(stops()).toBe(0);
  });

  it("has nothing to stop when idle: Escape does nothing, Send is back", () => {
    press("Escape");

    expect(stops()).toBe(0);
    expect(button("Stop")).toBeNull();
    expect(button("Send")).not.toBeNull();
  });
});
