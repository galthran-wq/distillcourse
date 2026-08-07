// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@/lib/auth/api";
import type { StoredChat } from "@/lib/chat/stored";

const READER: User = {
  id: "u1",
  email: "reader@example.com",
  full_name: null,
  timezone: "UTC",
};

/** The box `.chat-panel` is drawn in until the reader drags it somewhere else. */
const BOX = { right: 24, bottom: 80, width: 384, height: 512 };

const LEFT_BY_U1: StoredChat = {
  panel: "docked",
  ...BOX,
  chatId: "c1",
  draft: "half a question",
  // The passages that half a question is about: one unsent message with it.
  quotes: '[{"text":"the average surprisal","locator":"lesson:c/l#one"}]',
  owner: "u1",
};

/** What a previous visit left in storage, read as the modules are built. */
function remembered(state: Partial<StoredChat>): void {
  window.localStorage.setItem("distillcourse.chat", JSON.stringify(state));
}

/** The entry itself — what the next load is built out of. */
function entry(): unknown {
  return JSON.parse(window.localStorage.getItem("distillcourse.chat") ?? "null");
}

beforeEach(() => {
  window.localStorage.clear();
  vi.resetModules();
});

describe("what the widget remembers", () => {
  it("has the panel, the chat and the draft back after a reload", async () => {
    const { openPanel, rememberChat, setDraft } = await import("@/lib/chat/stored");
    openPanel();
    rememberChat("c1");
    setDraft("why is this true?");

    // The reload: the same storage, every module built again out of it.
    vi.resetModules();
    const { storedChatId } = await import("@/lib/chat/stored");

    expect(entry()).toEqual({
      panel: "docked",
      ...BOX,
      chatId: "c1",
      draft: "why is this true?",
      quotes: "",
      owner: "",
    });
    expect(storedChatId()).toBe("c1");
  });

  it("comes back over the page when that is where it was left", async () => {
    const { toggleExpanded } = await import("@/lib/chat/stored");
    toggleExpanded();

    vi.resetModules();
    const { openPanel } = await import("@/lib/chat/stored");
    openPanel();

    // Reopening from a lesson must not push it back into the corner.
    expect(entry()).toMatchObject({ panel: "expanded" });
  });

  it("reads an entry left by the version before this one as a shut panel", async () => {
    // What that version wrote: an `open` boolean, and no `panel` at all.
    remembered({ open: true, chatId: "c1", draft: "", owner: "" } as Partial<StoredChat>);
    const { storedChatId, togglePanel } = await import("@/lib/chat/stored");

    togglePanel();

    // It opens rather than closing, the field it never knew is dropped, and
    // the fields it shares with this version survive.
    expect(entry()).toEqual({
      panel: "docked",
      ...BOX,
      chatId: "c1",
      draft: "",
      quotes: "",
      owner: "",
    });
    expect(storedChatId()).toBe("c1");
  });

  it("reads a panel state it does not know as a shut panel", async () => {
    remembered({ panel: "half-open" });
    const { togglePanel } = await import("@/lib/chat/stored");

    togglePanel();

    expect(entry()).toMatchObject({ panel: "docked" });
  });

  it("keeps the draft when the load settles who is signed in", async () => {
    remembered(LEFT_BY_U1);
    const { setUser } = await import("@/lib/auth/store");

    // Every load ends in this call, and it is the first thing here to name a
    // reader — so it must not read as one reader replacing another.
    setUser(READER);

    expect(entry()).toEqual(LEFT_BY_U1);
  });

  it("drops the draft, but not the panel, when the reader signs out", async () => {
    remembered(LEFT_BY_U1);
    const { setUser } = await import("@/lib/auth/store");
    setUser(READER);

    setUser(null);

    // Whoever signs in next on this browser gets an empty composer; where the
    // panel sits is not theirs to inherit or lose.
    expect(entry()).toEqual({
      panel: "docked",
      ...BOX,
      chatId: "",
      draft: "",
      quotes: "",
      owner: "",
    });
  });

  it("drops the previous reader's draft on a load that opens anonymous", async () => {
    remembered(LEFT_BY_U1);
    const { setUser } = await import("@/lib/auth/store");

    // They signed out during some earlier visit, so this page load never saw
    // them: only the entry knows the draft in it is not the current reader's.
    setUser(null);

    expect(entry()).toEqual({
      panel: "docked",
      ...BOX,
      chatId: "",
      draft: "",
      quotes: "",
      owner: "",
    });
  });

  it("keeps the draft when the load could not ask who is signed in", async () => {
    remembered(LEFT_BY_U1);
    const { setUser } = await import("@/lib/auth/store");

    // What the bootstrap does with anything but a 401: the reader is shown the
    // anonymous panel, but a request that never arrived has not signed anyone
    // out, and it must not take the draft with it.
    setUser(null, false);

    expect(entry()).toEqual(LEFT_BY_U1);
  });
});
