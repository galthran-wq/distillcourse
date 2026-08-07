// @vitest-environment jsdom
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ChatList from "@/components/chat/ChatList";
import type { ChatSummary } from "@/lib/chat/api";
import { LessonsProvider } from "@/lib/content/links";
import { SectionsProvider } from "@/lib/content/sections";
import { LESSONS, SECTIONS } from "./chat-fixture";
import { mounted } from "./utils/dom";

const NOW = new Date("2026-08-07T12:00:00Z");

function chat(id: string, last: string | null): ChatSummary {
  return {
    id,
    kind: "web",
    model: "moonshotai/kimi-k3",
    title: `chat ${id}`,
    created_at: "2026-07-01T09:00:00Z",
    last_message_at: last,
  };
}

const { host, render } = mounted("nav");

function shown(chats: ChatSummary[], dated = true): void {
  act(() =>
    render(
      <SectionsProvider value={SECTIONS}>
        <LessonsProvider value={LESSONS}>
          <ChatList chats={chats} current="c1" dated={dated} onSelect={() => {}} />
        </LessonsProvider>
      </SectionsProvider>,
    ),
  );
}

/** One chat, under the title the backend gave it. */
function named(title: string): void {
  shown([{ ...chat("c2", null), title }], false);
}

/** What each row says, as the two things a row is made of. */
function rows(): [name: string, date: string | undefined][] {
  return [...host().querySelectorAll("button")].map((row) => {
    const [name, date] = row.querySelectorAll("span");
    return [name.textContent ?? "", date?.textContent ?? undefined];
  });
}

beforeEach(() => {
  // A relative date is only as testable as the moment it is relative to.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("the chat rail", () => {
  it("dates each chat by how long ago it was last spoken in", () => {
    shown([
      chat("c1", "2026-08-07T11:59:30Z"),
      chat("c2", "2026-08-07T11:38:00Z"),
      chat("c3", "2026-08-07T10:00:00Z"),
      chat("c4", "2026-08-04T12:00:00Z"),
    ]);

    expect(rows()).toEqual([
      ["chat c1", "now"],
      ["chat c2", "22m"],
      ["chat c3", "2h"],
      ["chat c4", "3d"],
    ]);
  });

  it("falls back to the date once a count of days stops being read", () => {
    const thisYear = new Date("2026-07-01T09:00:00Z");
    const last = new Date("2025-07-01T09:00:00Z");

    shown([chat("c1", thisYear.toISOString()), chat("c2", last.toISOString())]);

    // The reader's own locale writes it; the year is only there when it is
    // not this one, because the rail is a narrow column.
    expect(rows().map(([, date]) => date)).toEqual([
      thisYear.toLocaleDateString(undefined, { day: "numeric", month: "short" }),
      last.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    ]);
  });

  it("dates a chat nobody has said anything in with nothing", () => {
    shown([chat("c2", null)]);

    expect(rows()).toEqual([["chat c2", undefined]]);
  });

  it("leaves the dates off the menu, which has no width for them", () => {
    shown([chat("c2", "2026-08-07T10:00:00Z")], false);

    expect(rows()).toEqual([["chat c2", undefined]]);
  });
});

/**
 * A chat is titled with the question that started it, and a question written
 * with `@` was sent carrying `[[locator]]` — so the rail is one of the two
 * places (the panel's header is the other) that would otherwise show brackets.
 */
describe("a chat named after a question that points somewhere", () => {
  it("reads a locator in its name as the place that locator names", () => {
    named("[[lesson:us-history/indigenous-america#cahokia]] what was traded?");

    expect(rows()[0][0]).toBe("Cahokia and the Mississippians what was traded?");
  });

  it("uses the label where the locator was written with one", () => {
    named("about [[lesson:us-history/indigenous-america|the first lesson]]");

    expect(rows()[0][0]).toBe("about the first lesson");
  });

  it("leaves a locator the site does not render as the text it is", () => {
    named("[[lesson:us-history/withdrawn]] and then?");

    expect(rows()[0][0]).toBe("[[lesson:us-history/withdrawn]] and then?");
  });
});
