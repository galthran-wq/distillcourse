// @vitest-environment jsdom
import { act, createRef } from "react";
import { Chat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ChatPanel, { RENAME_MS } from "@/components/chat/ChatPanel";
import type { ChatSummary } from "@/lib/chat/api";
import { LessonsProvider } from "@/lib/content/links";
import { SectionsProvider } from "@/lib/content/sections";
import { LESSONS, SECTIONS } from "./chat-fixture";
import { mounted, stubResizeObserver } from "./utils/dom";

stubResizeObserver();

const SUMMARY: ChatSummary = {
  id: "c1",
  kind: "web",
  model: "moonshotai/kimi-k3",
  title: "what is entropy?",
  created_at: "2026-08-07T09:00:00Z",
  last_message_at: "2026-08-07T09:00:00Z",
};

/** What the listing route answers with, changed between one call and the next. */
let listing: ChatSummary[] = [];
let listings = 0;

function serve(): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const body = url.endsWith("/chats/models") ? [] : ((listings += 1), listing);
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }),
  );
}

const { host, render } = mounted();

/** The panel expanded, so the rail is on screen and its rows can be read. */
async function panel(): Promise<void> {
  const session = {
    summary: SUMMARY,
    chat: new Chat<UIMessage>({ id: SUMMARY.id, messages: [] }),
  };
  await act(async () =>
    render(
      <SectionsProvider value={SECTIONS}>
        <LessonsProvider value={LESSONS}>
          <ChatPanel session={session} panel={createRef<HTMLElement>()} expanded />
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
