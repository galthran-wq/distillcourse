// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatListing } from "@/lib/chat/api";
import type { StoredChat } from "@/lib/chat/stored";

const WEB: ChatListing = {
  id: "c1",
  kind: "web",
  model: "moonshotai/kimi-k3",
  title: "why is this true?",
  created_at: "2026-08-05T10:00:00Z",
  last_message_at: "2026-08-05T10:04:00Z",
};
const TELEGRAM: ChatListing = { ...WEB, id: "tg", kind: "telegram", title: null };
const FRESH: ChatListing = { ...WEB, id: "c2", title: null };

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
function remembered(state: Partial<StoredChat>): void {
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

  it("records the chat it switched to, so the next load comes back to it", async () => {
    served({
      "GET /api/v1/chats": json([WEB]),
      "GET /api/v1/chats/c1/messages": json([]),
      "GET /api/v1/chats/c2/messages": json([]),
    });
    const { resumeSession, selectSession } = await session();
    await resumeSession();

    await selectSession(FRESH);

    expect(
      JSON.parse(window.localStorage.getItem("distillcourse.chat") ?? "null"),
    ).toMatchObject({
      panel: "closed",
      chatId: "c2",
      draft: "",
      quotes: "",
      owner: "",
    });
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
    served({
      "GET /api/v1/chats": json([FRESH]),
      "GET /api/v1/chats/c2/messages": json([]),
    });
    const { adoptSummary, resumeSession } = await session();
    const untitled = await resumeSession();
    expect(untitled.summary.title).toBeNull();

    adoptSummary([{ ...FRESH, title: "why is this true?" }]);

    const titled = await resumeSession();
    expect(titled.summary.title).toBe("why is this true?");
    expect(titled.chat).toBe(untitled.chat);
  });

  it("takes the title again when the backend renames the chat", async () => {
    // The name is not written once: the backend rewrites it as the
    // conversation moves past the question it was named for.
    served({
      "GET /api/v1/chats": json([WEB]),
      "GET /api/v1/chats/c1/messages": json([]),
    });
    const { adoptSummary, resumeSession } = await session();
    const open = await resumeSession();

    adoptSummary([{ ...WEB, title: "Entropy and cross entropy" }]);

    const renamed = await resumeSession();
    expect(renamed.summary.title).toBe("Entropy and cross entropy");
    expect(renamed.chat).toBe(open.chat);
  });

  it("leaves the session alone when the title has not changed", async () => {
    served({
      "GET /api/v1/chats": json([FRESH]),
      "GET /api/v1/chats/c2/messages": json([]),
    });
    const { adoptSummary, resumeSession } = await session();
    const open = await resumeSession();

    adoptSummary([{ ...FRESH, last_message_at: "2026-08-05T11:00:00Z" }]);

    // A republished session re-renders the panel, which asks for the listing
    // again: a chat whose name has not changed has to leave the store
    // untouched, dated later or not.
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
