// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { UIMessage } from "ai";
import Messages from "@/components/chat/Messages";
import { LessonsProvider } from "@/lib/content/links";
import { LESSONS, rendered, turn } from "./chat-fixture";

function reply(...parts: UIMessage["parts"]): string {
  return rendered([
    turn("user", { type: "text", text: "why is this true?" }),
    turn("assistant", ...parts),
  ]);
}

describe("a rendered reply", () => {
  it("typesets math the way the lesson it is about does", () => {
    const html = reply({ type: "text", text: "Entropy is $H(X) = -\\sum p \\log p$." });

    expect(html).toContain("katex");
    expect(html).toContain("Entropy is");
  });

  it("typesets display math", () => {
    const html = reply({
      type: "text",
      text: "$$\nH(X) = -\\sum_x p(x)\\log p(x)\n$$",
    });

    expect(html).toContain("katex-display");
  });

  it("renders markdown, not the source of it", () => {
    const html = reply({ type: "text", text: "- first\n- second\n\n`code`" });

    expect(html).toContain("<li>first</li>");
    expect(html).toContain("<code>code</code>");
  });

  it("says who spoke without a label in the transcript", () => {
    const html = reply({ type: "text", text: "Because it is a mean." });

    // The question is the reader's own words in a bubble, the answer is the
    // page's prose: nothing in the transcript is named in mono capitals.
    expect(html).toContain('aria-label="You"');
    expect(html).toContain('aria-label="Tutor"');
    expect(html).not.toContain(">tutor<");
  });

  it("shows a tool the tutor is still running", () => {
    const html = reply({
      type: "tool-search_lessons",
      toolCallId: "call-1",
      state: "input-available",
      input: { query: "entropy" },
    });

    expect(html).toContain("search lessons");
    expect(html).toContain("…");
  });

  it("shows a tool that has answered, with what it was asked", () => {
    const html = reply({
      type: "tool-search_lessons",
      toolCallId: "call-1",
      state: "output-available",
      input: { query: "entropy" },
      output: { hits: [] },
    });

    // One chip, opening onto the query and the answer — not a row of its own.
    expect(html).toContain("<details");
    expect(html).toContain("search lessons");
    expect(html).toContain("&quot;entropy&quot;");
    expect(html).not.toContain("…");
  });

  it("says a tool failed", () => {
    const html = reply({
      type: "tool-search_lessons",
      toolCallId: "call-1",
      state: "output-error",
      input: { query: "entropy" },
      errorText: "the index is unreachable",
    });

    expect(html).toContain("search lessons failed");
  });
});

let root: Root;
let host: HTMLElement;

function show(messages: UIMessage[]): void {
  act(() =>
    root.render(
      <LessonsProvider value={LESSONS}>
        <Messages messages={messages} status="ready" />
      </LessonsProvider>,
    ),
  );
}

/** Who spoke, in the order the transcript puts them on screen. */
function speakers(): (string | null)[] {
  return [...host.querySelectorAll("article")].map((node) =>
    node.getAttribute("aria-label"),
  );
}

function box(): HTMLElement {
  return host.querySelector("[role=log]") as HTMLElement;
}

/** jsdom lays nothing out, so the scroll box's geometry is stated here. */
function scrollable(content: number, visible: number): { at: () => number } {
  const node = box();
  let top = 0;
  Object.defineProperty(node, "scrollHeight", { get: () => content });
  Object.defineProperty(node, "clientHeight", { get: () => visible });
  Object.defineProperty(node, "scrollTop", {
    get: () => top,
    set: (next: number) => {
      top = next;
    },
  });
  return { at: () => top };
}

function scrollTo(position: number): void {
  const node = box();
  node.scrollTop = position;
  act(() => node.dispatchEvent(new Event("scroll", { bubbles: true })));
}

beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe("the transcript", () => {
  // What the backend really sends: every stored question of every chat comes
  // back under this one id, so order is all the transcript has to go on.
  const REPEATED = "68d05cbb-6ee3-5a75-8e6c-1f9c4a7afb83";

  function conversation(chat: string, turns: number): UIMessage[] {
    return Array.from({ length: turns }, (_, index) => [
      {
        id: REPEATED,
        role: "user",
        parts: [{ type: "text", text: `${chat} ask ${index}` }],
      },
      {
        id: `${chat}-answer-${index}`,
        role: "assistant",
        parts: [{ type: "text", text: `${chat} answer ${index}` }],
      },
    ]).flat() as UIMessage[];
  }

  function said(text: string): number {
    return host.textContent?.indexOf(text) ?? -1;
  }

  it("puts the next turn under the ones before it", () => {
    show(conversation("a", 2));
    show(conversation("a", 3));

    expect(speakers()).toEqual(["You", "Tutor", "You", "Tutor", "You", "Tutor"]);
    expect(said("a ask 1")).toBeLessThan(said("a answer 1"));
    expect(said("a answer 1")).toBeLessThan(said("a ask 2"));
  });

  it("keeps every answer under its question when the reader switches chats", () => {
    show(conversation("a", 2));
    // A whole other conversation replaces this one, and its questions carry
    // the same ids: nothing here may be matched up with what it replaced.
    show(conversation("b", 2));

    expect(speakers()).toEqual(["You", "Tutor", "You", "Tutor"]);
    expect(host.textContent).not.toContain("a ask");
    expect(said("b ask 0")).toBeLessThan(said("b answer 0"));
    expect(said("b answer 0")).toBeLessThan(said("b ask 1"));
  });

  it("follows the newest message while the reader is at the end", () => {
    show(conversation("a", 1));
    const view = scrollable(1000, 400);
    scrollTo(600);

    show(conversation("a", 2));

    expect(view.at()).toBe(1000);
  });

  it("leaves the reader where they are when they have scrolled up", () => {
    show(conversation("a", 1));
    const view = scrollable(1000, 400);
    scrollTo(120);

    show(conversation("a", 2));

    expect(view.at()).toBe(120);
  });
});
