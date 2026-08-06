// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@/lib/auth/api";
import type { ChatSummary } from "@/lib/chat/api";
import type { StoredChat } from "@/lib/chat/stored";

const READER: User = {
  id: "u1",
  email: "reader@example.com",
  full_name: null,
  timezone: "UTC",
};

const WEB: ChatSummary = {
  id: "c1",
  kind: "web",
  model: "moonshotai/kimi-k3",
  title: "why is this true?",
  created_at: "2026-08-05T10:00:00Z",
};
const TELEGRAM: ChatSummary = { ...WEB, id: "tg", kind: "telegram", title: null };
const FRESH: ChatSummary = { ...WEB, id: "c2", title: null };

type Route = () => Response;

const calls: { url: string; method: string; body: unknown }[] = [];

function json(body: unknown): Route {
  return () =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
}

function served(routes: Record<string, Route>): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit = {}) => {
      const method = init.method ?? "GET";
      calls.push({
        url,
        method,
        body: init.body === undefined ? undefined : JSON.parse(String(init.body)),
      });
      const route = routes[`${method} ${url}`];
      if (route === undefined) throw new Error(`unexpected ${method} ${url}`);
      return route();
    }),
  );
}

function sent(method: string, url: string) {
  return calls.filter((call) => call.method === method && call.url === url);
}

/** A data stream the widget can be fed one chunk at a time. */
function stream() {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({
    start(open) {
      controller = open;
    },
  });
  return {
    response: (): Response =>
      new Response(body, {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      }),
    push(chunk: unknown): void {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
    },
    end(): void {
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  };
}

const REPLY = [
  { type: "start" },
  { type: "start-step" },
  { type: "text-start", id: "t0" },
  { type: "text-delta", id: "t0", delta: "Because " },
  { type: "text-delta", id: "t0", delta: "$H(X)$ is a mean." },
  { type: "text-end", id: "t0" },
  { type: "finish-step" },
  { type: "finish" },
];

// Both stores are module state that outlives any component, so each test
// takes them fresh — and takes them together, since the session reads the
// position module its own import resolved to.
async function session() {
  const store = await import("@/lib/chat/session");
  const position = await import("@/lib/lesson/position");
  return { ...store, ...position };
}

/** What a previous visit left in storage, read as the modules are built. */
function remembered(state: Partial<StoredChat> | Record<string, unknown>): void {
  window.localStorage.setItem("distillcourse.chat", JSON.stringify(state));
}

beforeEach(() => {
  calls.length = 0;
  window.localStorage.clear();
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("the chat session", () => {
  it("resumes the reader's most recent web chat", async () => {
    // Telegram first on purpose: without the filter the widget would resume
    // into the reader's Telegram thread, and this is where that shows.
    served({
      "GET /api/v1/chats": json([TELEGRAM, WEB]),
      "GET /api/v1/chats/c1/messages": json([]),
    });
    const { resumeSession } = await session();

    const open = await resumeSession();

    expect(open.summary.id).toBe("c1");
    expect(sent("POST", "/api/v1/chats")).toHaveLength(0);
  });

  it("resumes the chat the reader had open, not the most recent one", async () => {
    remembered({ chatId: "c1" });
    served({
      "GET /api/v1/chats": json([FRESH, WEB]),
      "GET /api/v1/chats/c1/messages": json([]),
    });
    const { resumeSession } = await session();

    const open = await resumeSession();

    expect(open.summary.id).toBe("c1");
  });

  it("falls back to the most recent chat when the stored one is gone", async () => {
    remembered({ chatId: "deleted-since" });
    served({
      "GET /api/v1/chats": json([WEB]),
      "GET /api/v1/chats/c1/messages": json([]),
    });
    const { resumeSession } = await session();

    const open = await resumeSession();

    expect(open.summary.id).toBe("c1");
    expect(sent("POST", "/api/v1/chats")).toHaveLength(0);
  });

  it("starts one chat, not two, when the widget asks twice before the first answer", async () => {
    served({
      "GET /api/v1/chats": json([]),
      "POST /api/v1/chats": json(FRESH),
      "GET /api/v1/chats/c2/messages": json([]),
    });
    const { resumeSession } = await session();

    const [first, second] = await Promise.all([resumeSession(), resumeSession()]);

    expect(first).toBe(second);
    expect(sent("POST", "/api/v1/chats")).toHaveLength(1);
  });

  it("replays the messages the backend already holds", async () => {
    served({
      "GET /api/v1/chats": json([WEB]),
      "GET /api/v1/chats/c1/messages": json([
        { id: "m1", role: "user", parts: [{ type: "text", text: "why?" }] },
      ]),
    });
    const { resumeSession } = await session();

    const open = await resumeSession();

    expect(open.chat.messages).toHaveLength(1);
  });

  it("sends the reader's position with the message and streams the answer back", async () => {
    const reply = stream();
    served({
      "GET /api/v1/chats": json([WEB]),
      "GET /api/v1/chats/c1/messages": json([]),
      "POST /api/v1/chats/c1/stream": reply.response,
    });
    const { resumeSession, setPosition } = await session();
    const open = await resumeSession();
    setPosition({ course: "info-theory", lesson: "entropy", anchor: "the-average" });

    const answered = open.chat.sendMessage({ text: "why is this true?" });
    await vi.waitFor(() => expect(sent("POST", "/api/v1/chats/c1/stream")).toHaveLength(1));
    for (const chunk of REPLY) reply.push(chunk);
    reply.end();
    await answered;

    const [request] = sent("POST", "/api/v1/chats/c1/stream");
    expect((request.body as { currentLocator: string }).currentLocator).toBe(
      "lesson:info-theory/entropy#the-average",
    );
    expect(open.chat.messages.at(-1)?.parts).toContainEqual({
      type: "text",
      text: "Because $H(X)$ is a mean.",
      state: "done",
    });
  });

  it("holds the chat busy until the answer is complete", async () => {
    const reply = stream();
    served({
      "GET /api/v1/chats": json([WEB]),
      "GET /api/v1/chats/c1/messages": json([]),
      "POST /api/v1/chats/c1/stream": reply.response,
    });
    const { busy, resumeSession } = await session();
    const open = await resumeSession();

    const answered = open.chat.sendMessage({ text: "why is this true?" });
    await vi.waitFor(() => expect(busy(open.chat.status)).toBe(true));
    for (const chunk of REPLY) reply.push(chunk);
    reply.end();
    await answered;

    expect(busy(open.chat.status)).toBe(false);
  });

  it("says nothing about position when the reader is not in a lesson", async () => {
    const reply = stream();
    served({
      "GET /api/v1/chats": json([WEB]),
      "GET /api/v1/chats/c1/messages": json([]),
      "POST /api/v1/chats/c1/stream": reply.response,
    });
    const { resumeSession } = await session();
    const open = await resumeSession();

    const answered = open.chat.sendMessage({ text: "what should I read next?" });
    await vi.waitFor(() => expect(sent("POST", "/api/v1/chats/c1/stream")).toHaveLength(1));
    for (const chunk of REPLY) reply.push(chunk);
    reply.end();
    await answered;

    const [request] = sent("POST", "/api/v1/chats/c1/stream");
    expect((request.body as { currentLocator: string | null }).currentLocator).toBeNull();
  });

  it("clears into a new chat, keeping the model of the one it replaces", async () => {
    served({
      "GET /api/v1/chats": json([{ ...WEB, model: "anthropic/claude-opus-5" }]),
      "GET /api/v1/chats/c1/messages": json([]),
      "POST /api/v1/chats": json(FRESH),
      "GET /api/v1/chats/c2/messages": json([]),
    });
    const { clearSession, resumeSession } = await session();
    const first = await resumeSession();

    const second = await clearSession();

    expect(second.chat).not.toBe(first.chat);
    expect(second.summary.id).toBe("c2");
    expect(sent("POST", "/api/v1/chats")[0].body).toEqual({
      kind: "web",
      model: "anthropic/claude-opus-5",
    });
  });

  it("switches to another chat from the list", async () => {
    served({
      "GET /api/v1/chats": json([WEB]),
      "GET /api/v1/chats/c1/messages": json([]),
      "GET /api/v1/chats/c2/messages": json([]),
    });
    const { resumeSession, selectSession } = await session();
    await resumeSession();

    const other = await selectSession(FRESH);

    expect(other.summary.id).toBe("c2");
    expect(await resumeSession()).toBe(other);
  });

  it("switches model without ending the conversation", async () => {
    served({
      "GET /api/v1/chats": json([WEB]),
      "GET /api/v1/chats/c1/messages": json([]),
      "PATCH /api/v1/chats/c1": json({ ...WEB, model: "anthropic/claude-opus-5" }),
    });
    const { changeModel, resumeSession } = await session();
    const open = await resumeSession();

    await changeModel("anthropic/claude-opus-5");

    const after = await resumeSession();
    expect(after.summary.model).toBe("anthropic/claude-opus-5");
    expect(after.chat).toBe(open.chat);
  });

  it("compacts the chat it has open", async () => {
    served({
      "GET /api/v1/chats": json([WEB]),
      "GET /api/v1/chats/c1/messages": json([]),
      "POST /api/v1/chats/c1/compact": json({ summary: "entropy, so far" }),
    });
    const { compactSession, resumeSession } = await session();
    await resumeSession();

    await compactSession();

    expect(sent("POST", "/api/v1/chats/c1/compact")).toHaveLength(1);
  });

  it("takes the title the backend wrote from the first message", async () => {
    const listing = [FRESH];
    served({
      "GET /api/v1/chats": json(listing),
      "GET /api/v1/chats/c2/messages": json([]),
    });
    const { refreshSummary, resumeSession } = await session();
    const untitled = await resumeSession();
    expect(untitled.summary.title).toBeNull();

    listing[0] = { ...FRESH, title: "why is this true?" };
    await refreshSummary();

    const titled = await resumeSession();
    expect(titled.summary.title).toBe("why is this true?");
    expect(titled.chat).toBe(untitled.chat);
  });

  it("leaves the session alone when the title has not changed", async () => {
    served({
      "GET /api/v1/chats": json([FRESH]),
      "GET /api/v1/chats/c2/messages": json([]),
    });
    const { refreshSummary, resumeSession } = await session();
    const open = await resumeSession();

    await refreshSummary();

    // A republished session re-renders the panel, which asks for the title
    // again: an unchanged one has to leave the store untouched.
    expect(await resumeSession()).toBe(open);
  });

  it("does not hand the conversation to whoever signs in next", async () => {
    served({
      "GET /api/v1/chats": json([WEB]),
      "GET /api/v1/chats/c1/messages": json([]),
    });
    const { resumeSession } = await session();
    const { setUser } = await import("@/lib/auth/store");
    const mine = await resumeSession();

    setUser({ id: "u2", email: "other@example.com", full_name: null, timezone: "UTC" });

    expect(await resumeSession()).not.toBe(mine);
    expect(sent("GET", "/api/v1/chats")).toHaveLength(2);
  });
});

describe("what the widget remembers", () => {
  it("has the panel, the chat and the draft back after a reload", async () => {
    served({
      "GET /api/v1/chats": json([WEB]),
      "GET /api/v1/chats/c1/messages": json([]),
    });
    const { resumeSession } = await session();
    const { togglePanel } = await import("@/lib/chat/panel");
    await resumeSession();
    togglePanel();
    (await import("@/lib/chat/stored")).stored.set({ draft: "why is this true?" });

    // The reload: the same storage, every module built again out of it.
    vi.resetModules();
    const { stored } = await import("@/lib/chat/stored");

    expect(stored.get()).toEqual({
      open: true,
      chatId: "c1",
      draft: "why is this true?",
      owner: "",
    });
  });

  it("keeps the draft when the load settles who is signed in", async () => {
    remembered({ open: true, chatId: "c1", draft: "half a question", owner: "u1" });
    const { stored } = await import("@/lib/chat/stored");
    const { setUser } = await import("@/lib/auth/store");

    // Every load ends in this call, and it is the first thing here to name a
    // reader — so it must not read as one reader replacing another.
    setUser(READER);

    expect(stored.get()).toEqual({
      open: true,
      chatId: "c1",
      draft: "half a question",
      owner: "u1",
    });
  });

  it("drops the draft, but not the panel, when the reader signs out", async () => {
    remembered({ open: true, chatId: "c1", draft: "half a question", owner: "u1" });
    const { stored } = await import("@/lib/chat/stored");
    const { setUser } = await import("@/lib/auth/store");
    setUser(READER);

    setUser(null);

    // Whoever signs in next on this browser gets an empty composer; where the
    // panel sits is not theirs to inherit or lose.
    expect(stored.get()).toEqual({ open: true, chatId: "", draft: "", owner: "" });
  });

  it("drops the previous reader's draft on a load that opens anonymous", async () => {
    remembered({ open: true, chatId: "c1", draft: "half a question", owner: "u1" });
    const { stored } = await import("@/lib/chat/stored");
    const { setUser } = await import("@/lib/auth/store");

    // They signed out during some earlier visit, so this page load never saw
    // them: only the entry knows the draft in it is not the current reader's.
    setUser(null);

    expect(stored.get()).toEqual({ open: true, chatId: "", draft: "", owner: "" });
  });

  it("falls back to the declared defaults when the entry is corrupt", async () => {
    remembered({ open: "yes", chatId: "c1", draft: 123, gone: "old field" });

    const { stored } = await import("@/lib/chat/stored");

    // Field by field: the widget is mounted on every page, so the one good
    // field is worth keeping and the wrong-typed ones must not reach it.
    expect(stored.get()).toEqual({ open: false, chatId: "c1", draft: "", owner: "" });
  });

  it("does not write back over what another tab changed", async () => {
    const here = (await import("@/lib/chat/stored")).stored;
    vi.resetModules();
    const other = (await import("@/lib/chat/stored")).stored;

    other.set({ draft: "asked in the other tab" });
    here.set({ open: true });

    expect(here.get()).toEqual({
      open: true,
      chatId: "",
      draft: "asked in the other tab",
      owner: "",
    });
  });
});

describe("a refused run", () => {
  it("reports the reason the backend gave, not its JSON", async () => {
    const { streamFailure } = await session();

    expect(
      streamFailure(new Error('{"detail":"daily message cap reached"}')),
    ).toBe("daily message cap reached");
  });

  it("falls back to whatever the transport reported", async () => {
    const { streamFailure } = await session();

    expect(streamFailure(new Error("Failed to fetch"))).toBe("Failed to fetch");
  });
});
