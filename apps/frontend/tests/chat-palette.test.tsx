// @vitest-environment jsdom
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import ChatMenu from "@/components/chat/ChatMenu";
import Composer from "@/components/chat/Composer";
import type { ChatListing, ChatModel, ChatSummary } from "@/lib/chat/api";
import { setDraft } from "@/lib/chat/stored";
import { mounted } from "./utils/dom";

// jsdom has no ResizeObserver, and the field watches its own width to know how
// many rows the draft wraps into. Nothing here changes that width.
class NoResize implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver = NoResize;

const { host, render } = mounted();

/** What the composer handed the widget, in the order it was sent. */
let sent: string[] = [];

function composer(disabled = false): void {
  act(() =>
    render(
      <Composer
        disabled={disabled}
        onSubmit={(text) => {
          sent.push(text);
        }}
      />,
    ),
  );
}

function field(): HTMLTextAreaElement {
  const box = host().querySelector("textarea");
  if (box === null) throw new Error("the composer has no field");
  return box;
}

/**
 * The reader typing, given as the whole draft: React reads a controlled field
 * back off the DOM node, so the value has to be set the way a keystroke sets
 * it rather than through the property React itself has patched.
 */
function types(draft: string): void {
  const value = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype,
    "value",
  )?.set;
  value?.call(field(), draft);
  act(() => field().dispatchEvent(new Event("input", { bubbles: true })));
}

function press(key: string): void {
  act(() =>
    field().dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
    ),
  );
}

function options(): HTMLElement[] {
  return [...host().querySelectorAll<HTMLElement>('[role="option"]')];
}

/** What the palette lists, as the commands it names. */
function listed(): string[] {
  return options().map((row) => row.querySelector("span")?.textContent ?? "");
}

/** The row Enter would run. */
function highlighted(): string | undefined {
  return listed().find(
    (_, index) => options()[index].getAttribute("aria-selected") === "true",
  );
}

beforeEach(() => {
  sent = [];
  composer();
});

afterEach(() => {
  // The draft outlives the tab, so it outlives a test too.
  setDraft("");
  window.localStorage.clear();
});

describe("the command palette", () => {
  it("opens on a slash into an empty composer", () => {
    types("/");

    expect(listed()).toEqual(["/clear", "/compact"]);
    // With what each one does: a list of two slashes explains nothing.
    expect(host().textContent).toContain("start a new chat");
    expect(host().textContent).toContain("summarise the history so far");
    expect(field().getAttribute("aria-expanded")).toBe("true");
  });

  it("stays out of an ordinary question", () => {
    types("why is this true?");
    expect(listed()).toEqual([]);

    // The tutor, not the widget, is the one who can answer this.
    types("what does /clear do?");
    expect(listed()).toEqual([]);
    expect(field().getAttribute("aria-expanded")).toBeNull();
  });

  it("filters by what has been typed so far", () => {
    types("/c");
    expect(listed()).toEqual(["/clear", "/compact"]);

    types("/co");
    expect(listed()).toEqual(["/compact"]);

    // Nothing to offer is what closes it: /help is a message like any other.
    types("/help");
    expect(listed()).toEqual([]);
  });

  it("runs the command Enter is on", () => {
    types("/");
    press("Enter");

    expect(sent).toEqual(["/clear"]);
    expect(field().value).toBe("");
    expect(listed()).toEqual([]);
  });

  it("walks the list with the arrows", () => {
    types("/");
    expect(highlighted()).toBe("/clear");

    press("ArrowDown");
    expect(highlighted()).toBe("/compact");

    // Round the ends: two commands, and neither arrow is ever a dead key.
    press("ArrowDown");
    expect(highlighted()).toBe("/clear");
    press("ArrowUp");
    expect(highlighted()).toBe("/compact");

    press("Enter");
    expect(sent).toEqual(["/compact"]);
  });

  it("starts the highlight over when the list changes", () => {
    types("/");
    press("ArrowDown");

    types("/c");

    expect(highlighted()).toBe("/clear");
  });

  it("runs the one the reader clicks", () => {
    types("/");

    act(() => options()[1].click());

    expect(sent).toEqual(["/compact"]);
  });

  it("closes on Escape without spending it on the panel behind", () => {
    const reached: string[] = [];
    const listener = (event: KeyboardEvent): void => {
      reached.push(event.key);
    };
    window.addEventListener("keydown", listener);
    types("/cl");

    press("Escape");

    expect(listed()).toEqual([]);
    // The draft is untouched: Escape put the list away, not the line.
    expect(field().value).toBe("/cl");
    // An expanded panel takes Escape as being told to collapse, and the
    // palette was what the reader was dismissing.
    expect(reached).toEqual([]);
    window.removeEventListener("keydown", listener);
  });

  it("comes back when the reader goes on typing", () => {
    types("/");
    press("Escape");

    types("/c");

    expect(listed()).toEqual(["/clear", "/compact"]);
  });

  it("leaves a command typed out in full working", () => {
    types("/clear");
    expect(listed()).toEqual(["/clear"]);

    press("Enter");

    expect(sent).toEqual(["/clear"]);
  });

  it("leaves it working with the palette dismissed", () => {
    types("/compact");
    press("Escape");

    press("Enter");

    expect(sent).toEqual(["/compact"]);
  });

  it("stays away while the tutor is answering", () => {
    composer(true);

    types("/");

    // Nothing can be sent in the middle of a run, a command included.
    expect(listed()).toEqual([]);
  });
});

const SUMMARY: ChatSummary = {
  id: "c1",
  kind: "web",
  model: "moonshotai/kimi-k3",
  title: "Entropy",
  created_at: "2026-08-01T09:00:00Z",
};

const CHATS: ChatListing[] = [{ ...SUMMARY, last_message_at: null }];

const MODELS: ChatModel[] = [
  { openrouter_id: "moonshotai/kimi-k3", display_name: "Kimi K3", context_window: 200000 },
];

describe("the chat menu", () => {
  it("has one home for each function and is not the commands'", () => {
    act(() =>
      render(
        <ChatMenu
          current={SUMMARY}
          chats={CHATS}
          models={MODELS}
          expanded={false}
          onSelect={() => {}}
          onModel={() => {}}
        />,
      ),
    );

    const menu = host().textContent ?? "";
    expect(menu).not.toContain("/clear");
    expect(menu).not.toContain("/compact");
    // What it does keep.
    expect(menu).toContain("Kimi K3");
    expect(menu).toContain("Entropy");
  });
});
