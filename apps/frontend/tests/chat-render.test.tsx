// @vitest-environment jsdom
import { act } from "react";
import { describe, expect, it } from "vitest";
import type { UIMessage } from "ai";
import { rendered, shown, turn } from "./chat-fixture";

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

  it("sums up what the tutor did in one line above the answer", () => {
    const html = reply(
      { type: "reasoning", text: "they want the intuition", state: "done" },
      ...searched("entropy", "surprisal", "coding"),
      read("lesson:info-theory/entropy#the-average"),
      read("lesson:info-theory/cross-entropy"),
      { type: "text", text: "Because it is a mean." },
    );

    expect(html).toContain("Searched 3× · read 2 lessons · thought");
    expect(html.indexOf("Searched 3×")).toBeLessThan(html.indexOf("Because it is a mean."));
    // Collapsed: neither a stack of chips nor the trace itself is on screen.
    expect(html).not.toContain("they want the intuition");
    expect(html).not.toContain("<details");
  });

  it("shows only the step under way while the answer streams", () => {
    const reading = rendered(
      [
        turn("user", { type: "text", text: "why?" }),
        turn("assistant", ...searched("isolation"), {
          type: "tool-fetch_content",
          toolCallId: "r1",
          state: "input-available",
          input: { locator: "lesson:fraud-ml/isolation-forest#path-length" },
        }),
      ],
      { status: "streaming" },
    );
    const thinking = rendered(
      [
        turn("user", { type: "text", text: "why?" }),
        turn("assistant", { type: "reasoning", text: "hm", state: "streaming" }),
      ],
      { status: "streaming" },
    );

    expect(reading).toContain("reading isolation-forest…");
    expect(reading).not.toContain("Searched");
    expect(thinking).toContain("thinking…");
  });

  it("is one turn with one line for an answer stored as several messages", () => {
    // How the backend replays a run: one message per model response.
    const html = rendered([
      turn("user", { type: "text", text: "why?" }),
      turn("assistant", ...searched("entropy")),
      turn("assistant", { type: "text", text: "Because it is a mean." }),
    ]);

    expect(html.match(/aria-label="Tutor"/g)).toHaveLength(1);
    expect(html.match(/aria-expanded/g)).toHaveLength(1);
  });
});

/** Finished `search_content` calls, one per query. */
function searched(...queries: string[]): UIMessage["parts"] {
  return queries.map((query, index) => ({
    type: "tool-search_content",
    toolCallId: `s${index}-${query}`,
    state: "output-available",
    input: { query },
    output: [],
  }));
}

function read(locator: string): UIMessage["parts"][number] {
  return {
    type: "tool-fetch_content",
    toolCallId: `r-${locator}`,
    state: "output-available",
    input: { locator },
    output: {},
  };
}

describe("waiting for the tutor", () => {
  const asked = [turn("user", { type: "text", text: "why is this true?" })];
  const answering = [
    ...asked,
    turn("assistant", { type: "text", text: "Because it is a mean." }),
  ];

  it("waits with an indicator between the question and the first token", () => {
    const html = rendered(asked, { status: "submitted" });

    expect(html).toContain("the tutor is answering");
    // The classes the pacing in globals.css hangs on: without them the dots
    // are three still circles and nothing says the tutor is working.
    expect(html).toContain("tutor-dots");
    expect(html).toContain("tutor-dot ");
  });

  it("takes it away once the answer is coming", () => {
    const html = rendered(answering, { status: "streaming" });

    expect(html).toContain("Because it is a mean.");
    expect(html).not.toContain("the tutor is answering");
  });

  it("keeps the live region in place, empty, once the answer is in", () => {
    const html = rendered(answering, { status: "ready" });

    // Mounted in every state on purpose: a screen reader announces mutations
    // inside a live region that was already there, not one that arrives full.
    expect(html).toContain('role="status"');
    expect(html).not.toContain("the tutor is answering");
  });
});

const { host, show } = shown();

describe("the activity line, opened", () => {
  it("lists every step in the order it happened, failures said", () => {
    show([
      turn("user", { type: "text", text: "why?" }),
      turn(
        "assistant",
        ...searched("entropy"),
        { type: "reasoning", text: "the search was thin", state: "done" },
        {
          type: "tool-web_search",
          toolCallId: "w1",
          state: "output-error",
          input: { query: "shannon 1948" },
          errorText: "the provider failed",
        },
        { type: "text", text: "Because it is a mean." },
      ),
    ]);
    const line = host().querySelector<HTMLButtonElement>("button[aria-expanded]")!;

    act(() => line.click());

    expect(line.getAttribute("aria-expanded")).toBe("true");
    expect([...host().querySelectorAll("li")].map((step) => step.textContent)).toEqual([
      "search content: entropy",
      "the search was thin",
      "web search: shannon 1948 — failed",
    ]);
  });
});

/** Who spoke, in the order the transcript puts them on screen. */
function speakers(): (string | null)[] {
  return [...host().querySelectorAll("article")].map((node) =>
    node.getAttribute("aria-label"),
  );
}

/** The scroll box: the transcript's own element, which is all it renders. */
function box(): HTMLElement {
  return host().firstElementChild as HTMLElement;
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
    return host().textContent?.indexOf(text) ?? -1;
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
    show(conversation("b", 2), "b");

    expect(speakers()).toEqual(["You", "Tutor", "You", "Tutor"]);
    expect(host().textContent).not.toContain("a ask");
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

  // Having scrolled up is the reader reading something. Opening another chat
  // and writing the next message are not, and the panel keeps the transcript
  // mounted through both — so nothing but this puts it back at the end.
  it("goes back to the end when the reader opens another chat", () => {
    show(conversation("a", 4));
    const view = scrollable(1000, 400);
    scrollTo(120);

    show(conversation("b", 2), "b");

    expect(view.at()).toBe(1000);
  });

  it("goes back to the end when the reader asks the next question", () => {
    show(conversation("a", 1));
    const view = scrollable(1000, 400);
    scrollTo(120);

    show([...conversation("a", 1), turn("user", { type: "text", text: "and this?" })]);

    expect(view.at()).toBe(1000);
  });
});
