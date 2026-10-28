// @vitest-environment jsdom
import { act } from "react";
import { describe, expect, it } from "vitest";
import ChatMenu from "@/components/chat/ChatMenu";
import type { ChatSummary } from "@/lib/chat/api";
import { composing } from "./chat-fixture";
import { mounted, stubResizeObserver, stubScrollIntoView, type } from "./utils/dom";

stubResizeObserver();
// The palette carries the row the arrows walked to into view with them.
stubScrollIntoView();

describe("the command palette", () => {
  const { host, composer, field, press, options, listed, reloads, sent } = composing();

  function send(): HTMLButtonElement {
    const button = host().querySelector<HTMLButtonElement>('[aria-label="Send"]');
    if (button === null) throw new Error("the composer has no send button");
    return button;
  }

  /** The row Enter would run. */
  function highlighted(): string | undefined {
    return listed().find(
      (_, index) => options()[index].getAttribute("aria-selected") === "true",
    );
  }

  it("opens on a slash into an empty composer", () => {
    type(field(), "/");

    expect(listed()).toEqual(["/clear", "/compact"]);
    // With what each one does: a list of two slashes explains nothing.
    expect(host().textContent).toContain("start a new chat");
    expect(host().textContent).toContain("summarise the history so far");
    expect(field().getAttribute("aria-expanded")).toBe("true");
  });

  // Which drafts name a command is `lib/chat/commands`', and tested there.
  // What the composer adds is that with none of them named it is a message
  // field again and says nothing about a list.
  it("stays out of an ordinary question", () => {
    type(field(), "why is this true?");

    expect(listed()).toEqual([]);
    expect(field().getAttribute("aria-expanded")).toBeNull();
  });

  it("filters by what has been typed so far", () => {
    type(field(), "/c");
    expect(listed()).toEqual(["/clear", "/compact"]);

    type(field(), "/co");
    expect(listed()).toEqual(["/compact"]);

    // Nothing to offer is what closes it: /help is a message like any other.
    type(field(), "/help");
    expect(listed()).toEqual([]);
  });

  it("runs the command Enter is on", () => {
    type(field(), "/");
    press("Enter");

    expect(sent).toEqual(["/clear"]);
    expect(field().value).toBe("");
    expect(listed()).toEqual([]);
  });

  it("walks the list with the arrows", () => {
    type(field(), "/");
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
    type(field(), "/");
    press("ArrowDown");

    type(field(), "/c");

    expect(highlighted()).toBe("/clear");
  });

  it("runs the one the reader clicks", () => {
    type(field(), "/");

    act(() => options()[1].click());

    expect(sent).toEqual(["/compact"]);
  });

  it("runs the highlighted one from the send button", () => {
    type(field(), "/");
    press("ArrowDown");

    act(() => send().click());

    // Not the bare slash the field holds, which is nothing the tutor could
    // answer and would spend a message off the day's allowance saying so.
    expect(sent).toEqual(["/compact"]);
  });

  it("closes on Escape without spending it on the panel behind", () => {
    const reached: string[] = [];
    const listener = (event: KeyboardEvent): void => {
      reached.push(event.key);
    };
    window.addEventListener("keydown", listener);
    type(field(), "/cl");

    press("Escape");

    expect(listed()).toEqual([]);
    // The draft is untouched: Escape put the list away, not the line.
    expect(field().value).toBe("/cl");
    // An expanded panel takes Escape as being told to collapse, and the
    // palette was what the reader was dismissing.
    expect(reached).toEqual([]);
    window.removeEventListener("keydown", listener);
  });

  it("closes on a press away from it", () => {
    type(field(), "/cl");

    act(() =>
      document.body.dispatchEvent(new Event("pointerdown", { bubbles: true })),
    );

    expect(listed()).toEqual([]);
    // As with Escape: the press put the list away, not the line.
    expect(field().value).toBe("/cl");
  });

  it("stays out of a draft the reader came back to", () => {
    reloads("/c");

    // The draft outlives the tab; nothing was typed, and typing is what opens
    // the palette — a reader returning to a line is not offered a list.
    expect(listed()).toEqual([]);

    type(field(), "/cl");
    expect(listed()).toEqual(["/clear"]);
  });

  it("comes back when the reader goes on typing", () => {
    type(field(), "/");
    press("Escape");

    type(field(), "/c");

    expect(listed()).toEqual(["/clear", "/compact"]);
  });

  it("leaves a command typed out in full working", () => {
    type(field(), "/clear");
    expect(listed()).toEqual(["/clear"]);

    press("Enter");

    expect(sent).toEqual(["/clear"]);
  });

  it("leaves it working with the palette dismissed", () => {
    type(field(), "/compact");
    press("Escape");

    press("Enter");

    expect(sent).toEqual(["/compact"]);
  });

  it("stays away while the tutor is answering", () => {
    composer(true);

    type(field(), "/");

    // Nothing can be sent in the middle of a run, a command included.
    expect(listed()).toEqual([]);
  });
});

const SUMMARY: ChatSummary = {
  id: "c1",
  kind: "web",
  lab_lesson: null,
  model: "moonshotai/kimi-k3",
  title: "Entropy",
  created_at: "2026-08-01T09:00:00Z",
  last_message_at: null,
};

const CHATS: ChatSummary[] = [SUMMARY];

describe("the chat menu", () => {
  const { host, render } = mounted();

  it("switches chats and starts one — not the commands, not the model", () => {
    act(() =>
      render(
        <ChatMenu
          current={SUMMARY}
          chats={CHATS}
          expanded={false}
          onSelect={() => {}}
          onNew={() => {}}
        />,
      ),
    );

    const menu = host().textContent ?? "";
    // The commands run from the composer's palette, not here.
    expect(menu).not.toContain("/clear");
    expect(menu).not.toContain("/compact");
    // The model moved to the composer's footer (ModelPicker), not here.
    expect(menu).not.toContain("Kimi K3");
    // What it does keep: a way to start a chat, and the chats to switch to.
    expect(menu).toContain("New chat");
    expect(menu).toContain("Entropy");
  });
});
