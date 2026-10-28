// @vitest-environment jsdom
import { act, createRef } from "react";
import { Chat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ChatPanel, { RENAME_MS } from "@/components/chat/ChatPanel";
import type { ChatSummary } from "@/lib/chat/api";
import { LessonsProvider } from "@/lib/content/links";
import { SectionsProvider } from "@/lib/content/sections";
import { CHAT_SUMMARY, LESSONS, SECTIONS } from "./chat-fixture";
import { mounted, stubResizeObserver } from "./utils/dom";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

stubResizeObserver();

const SUMMARY: ChatSummary = { ...CHAT_SUMMARY, title: "what is entropy?" };

/** What the listing route answers with, changed between one call and the next. */
let listing: ChatSummary[] = [];
let listings = 0;
/** The listing URLs asked for, in order. */
let asked: string[] = [];

function serve(): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const body =
        url.endsWith("/chats/models") || url.endsWith("/messages")
          ? []
          : ((listings += 1), asked.push(url), listing);
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }),
  );
}

const { host, render } = mounted();

/** The panel expanded, so the rail is on screen and its rows can be read. */
async function panel(expanded = true): Promise<void> {
  const session = {
    summary: SUMMARY,
    chat: new Chat<UIMessage>({ id: SUMMARY.id, messages: [] }),
  };
  await act(async () =>
    render(
      <SectionsProvider value={SECTIONS}>
        <LessonsProvider value={LESSONS}>
          <ChatPanel
            session={session}
            course="info-theory"
            panel={createRef<HTMLElement>()}
            expanded={expanded}
          />
        </LessonsProvider>
      </SectionsProvider>,
    ),
  );
}

/** What the rail lists, by name. */
function rail(): string[] {
  return [...host().querySelectorAll("nav button span:first-child")].map(
    (name) => name.textContent ?? "",
  );
}

beforeEach(() => {
  listing = [SUMMARY];
  listings = 0;
  push.mockReset();
  asked = [];
  serve();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("the listing the panel keeps", () => {
  it("is taken again once the backend has had time to rename the chat", async () => {
    await panel();
    expect(rail()).toEqual(["what is entropy?"]);
    const settled = listings;

    // The rename is a completion the backend starts after the stream is
    // terminated, so it lands well after the listing taken at the settle.
    listing = [{ ...SUMMARY, title: "Cross entropy and KL" }];
    await act(async () => {
      vi.advanceTimersByTime(RENAME_MS);
    });

    expect(listings).toBe(settled + 1);
    expect(rail()).toEqual(["Cross entropy and KL"]);
  });

  it("asks once more and no more: nothing here polls", async () => {
    await panel();
    const settled = listings;

    await act(async () => {
      vi.advanceTimersByTime(RENAME_MS * 4);
    });

    expect(listings).toBe(settled + 1);
  });
});

describe("a lab chat in the rail", () => {
  it("is opened on its lab's page", async () => {
    listing = [
      SUMMARY,
      {
        ...SUMMARY,
        id: "lab1",
        kind: "lab",
        lab_lesson: "lesson:info-theory/entropy",
        title: "why is my IV negative?",
      },
    ];
    await panel();

    const row = [...host().querySelectorAll("nav button")].find((button) =>
      button.textContent?.includes("why is my IV negative?"),
    );
    await act(async () => row?.dispatchEvent(new MouseEvent("click", { bubbles: true })));

    expect(push).toHaveBeenCalledWith("/courses/info-theory/lessons/entropy");
  });

  it("leaves a web chat where the reader is", async () => {
    listing = [SUMMARY, { ...SUMMARY, id: "c2", title: "another" }];
    await panel();

    const row = [...host().querySelectorAll("nav button")].find((button) =>
      button.textContent?.includes("another"),
    );
    await act(async () => row?.dispatchEvent(new MouseEvent("click", { bubbles: true })));

    expect(push).not.toHaveBeenCalled();
  });
});

describe("which chats the panel lists", () => {
  it("docked, only the page's course", async () => {
    await panel(false);

    expect(asked).toEqual(["/api/v1/chats?course=info-theory"]);
  });

  it("expanded, every chat, filed in folders with the page's open", async () => {
    await panel();

    expect(asked).toEqual(["/api/v1/chats"]);
    expect(host().querySelector("nav section button")?.getAttribute("aria-expanded")).toBe(
      "true",
    );
  });
});
