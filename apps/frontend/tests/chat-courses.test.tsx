// @vitest-environment jsdom
import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import ChatFolders from "@/components/chat/ChatFolders";
import ChatMenu from "@/components/chat/ChatMenu";
import type { ChatSummary } from "@/lib/chat/api";
import { LessonsProvider } from "@/lib/content/links";
import { SectionsProvider } from "@/lib/content/sections";
import { LESSONS, SECTIONS } from "./chat-fixture";
import { mounted } from "./utils/dom";

function chat(id: string, course: string | null): ChatSummary {
  return {
    id,
    kind: "web",
    model: "moonshotai/kimi-k3",
    title: `chat ${id}`,
    course,
    created_at: "2026-07-01T09:00:00Z",
    last_message_at: null,
  };
}

// Most recently spoken in first, as the listing hands them over.
const CHATS = [
  chat("g1", null),
  chat("h1", "us-history"),
  chat("i1", "info-theory"),
  chat("h2", "us-history"),
];

const { host, render } = mounted();

function show(node: React.ReactNode): void {
  act(() =>
    render(
      <SectionsProvider value={SECTIONS}>
        <LessonsProvider value={LESSONS}>{node}</LessonsProvider>
      </SectionsProvider>,
    ),
  );
}

/** Each folder's header and, if it is open, the chats it lists. */
function folders(): [header: string, open: boolean, chats: string[]][] {
  return [...host().querySelectorAll("section")].map((folder) => {
    const [header, ...rows] = folder.querySelectorAll("button");
    return [
      header.textContent ?? "",
      header.getAttribute("aria-expanded") === "true",
      rows.map((row) => row.querySelector("span")?.textContent ?? ""),
    ];
  });
}

function press(label: string): void {
  const button = [...host().querySelectorAll("button")].find(
    (candidate) => candidate.textContent === label,
  );
  if (button === undefined) throw new Error(`no button "${label}"`);
  act(() => button.click());
}

describe("the expanded panel's folders", () => {
  it("files chats by course, newest course first, General last, the page's open", () => {
    show(<ChatFolders chats={CHATS} current="h1" course="info-theory" onSelect={() => {}} />);

    expect(folders()).toEqual([
      ["US history2", false, []],
      ["Information theory1", true, ["chat i1"]],
      ["General1", false, []],
    ]);
  });

  it("opens and closes a folder at the reader's hand", () => {
    show(<ChatFolders chats={CHATS} current="h1" course={null} onSelect={() => {}} />);

    press("US history2");
    press("General1");

    expect(folders()).toEqual([
      ["US history2", true, ["chat h1", "chat h2"]],
      ["Information theory1", false, []],
      ["General1", false, []],
    ]);
  });
});

describe("moving a chat", () => {
  it("offers every other course and General, and files the chat where picked", () => {
    const onMove = vi.fn();
    show(
      <ChatMenu
        current={chat("h1", "us-history")}
        chats={CHATS}
        expanded={false}
        onSelect={() => {}}
        onNew={() => {}}
        onMove={onMove}
      />,
    );

    press("Move to…");
    const offered = [...host().querySelectorAll("button")].map((row) => row.textContent);
    press("General");

    expect(offered).toEqual(["Information theory", "General"]);
    expect(onMove).toHaveBeenCalledWith(null);
  });
});
