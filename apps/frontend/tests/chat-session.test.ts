// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UIMessage } from "ai";
import type { ChatSummary } from "@/lib/chat/api";
import type { StoredChat } from "@/lib/chat/stored";

const WEB: ChatSummary = {
  id: "c1",
  kind: "web",
  model: "moonshotai/kimi-k3",
  title: "why is this true?",
  course: null,
  created_at: "2026-08-05T10:00:00Z",
  last_message_at: "2026-08-05T10:04:00Z",
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
  const steering = await import("@/lib/chat/steer");
  return { ...store, ...position, ...steering };
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
      "GET /api/v1/chats?course=": json([TELEGRAM, WEB]),
      "GET /api/v1/chats/c1/messages": json([]),
    });
    const { resumeSession } = await session();

    const open = await resumeSession(null);

    expect(open.summary.id).toBe("c1");
    expect(sent("POST", "/api/v1/chats")).toHaveLength(0);
  });

  it("resumes the chat the reader had open, not the most recent one", async () => {
    remembered({ chats: JSON.stringify({ "": "c1" }) });
    served({
      "GET /api/v1/chats?course=": json([FRESH, WEB]),
      "GET /api/v1/chats/c1/messages": json([]),
    });
    const { resumeSession } = await session();

    const open = await resumeSession(null);

    expect(open.summary.id).toBe("c1");
  });

  it("falls back to the most recent chat when the stored one is gone", async () => {
    remembered({ chats: JSON.stringify({ "": "deleted-since" }) });
    served({
      "GET /api/v1/chats?course=": json([WEB]),
      "GET /api/v1/chats/c1/messages": json([]),
    });
    const { resumeSession } = await session();

    const open = await resumeSession(null);

    expect(open.summary.id).toBe("c1");
    expect(sent("POST", "/api/v1/chats")).toHaveLength(0);
  });

  it("records the chat it switched to, so the next load comes back to it", async () => {
    served({
      "GET /api/v1/chats?course=": json([WEB]),
      "GET /api/v1/chats/c1/messages": json([]),
      "GET /api/v1/chats/c2/messages": json([]),
    });
    const { resumeSession, selectSession } = await session();
    await resumeSession(null);

    await selectSession(FRESH);

    expect(
      JSON.parse(window.localStorage.getItem("distillcourse.chat") ?? "null"),
    ).toMatchObject({
      panel: "closed",
      chats: JSON.stringify({ "": "c2" }),
      draft: "",
      quotes: "",
      owner: "",
    });
  });

  it("starts one chat, not two, when the widget asks twice before the first answer", async () => {
    served({
      "GET /api/v1/chats?course=": json([]),
      "POST /api/v1/chats": json(FRESH),
      "GET /api/v1/chats/c2/messages": json([]),
    });
    const { resumeSession } = await session();

    const [first, second] = await Promise.all([resumeSession(null), resumeSession(null)]);

    expect(first).toBe(second);
    expect(sent("POST", "/api/v1/chats")).toHaveLength(1);
  });

  it("replays the messages the backend already holds", async () => {
    served({
      "GET /api/v1/chats?course=": json([WEB]),
      "GET /api/v1/chats/c1/messages": json([
        { id: "m1", role: "user", parts: [{ type: "text", text: "why?" }] },
      ]),
    });
    const { resumeSession } = await session();

    const open = await resumeSession(null);

    expect(open.chat.messages).toHaveLength(1);
  });

  it("sends the reader's position with the message and streams the answer back", async () => {
    const reply = stream();
    served({
      "GET /api/v1/chats?course=": json([WEB]),
      "GET /api/v1/chats/c1/messages": json([]),
      "POST /api/v1/chats/c1/stream": reply.response,
    });
    const { resumeSession, setPosition } = await session();
    const open = await resumeSession(null);
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
      "GET /api/v1/chats?course=": json([WEB]),
      "GET /api/v1/chats/c1/messages": json([]),
      "POST /api/v1/chats/c1/stream": reply.response,
    });
    const { busy, resumeSession } = await session();
    const open = await resumeSession(null);

    const answered = open.chat.sendMessage({ text: "why is this true?" });
    await vi.waitFor(() => expect(busy(open.chat.status)).toBe(true));
    for (const chunk of REPLY) reply.push(chunk);
    reply.end();
    await answered;

    expect(busy(open.chat.status)).toBe(false);
  });

  it("marks steers queued until the run reads them, and resends the rest as one turn", async () => {
    const first = stream();
    const second = stream();
    const replies = [first.response, second.response];
    served({
      "GET /api/v1/chats?course=": json([WEB]),
      "GET /api/v1/chats/c1/messages": json([]),
      "POST /api/v1/chats/c1/stream": () => replies.shift()!(),
      "POST /api/v1/chats/c1/steer": json(null),
    });
    const { resumeSession, steer, steerMark } = await session();
    const open = await resumeSession(null);
    const answered = open.chat.sendMessage({ text: "isolation forests?" });
    await vi.waitFor(() => expect(sent("POST", "/api/v1/chats/c1/stream")).toHaveLength(1));
    first.push({ type: "start" });
    first.push({ type: "start-step" });
    first.push({ type: "text-start", id: "t0" });
    first.push({ type: "text-delta", id: "t0", delta: "Isolation " });
    await vi.waitFor(() => expect(open.chat.messages.at(-1)?.role).toBe("assistant"));

    for (const words of ["path length, not code", "shorter", "with a picture"])
      await steer(open.chat, words);
    const [taken, ...unused] = sent("POST", "/api/v1/chats/c1/steer").map(
      (call) => (call.body as { id: string }).id,
    );
    // Under the question, above the answer being written into.
    expect(open.chat.messages.map((message) => message.role)).toEqual([
      "user",
      "user",
      "user",
      "user",
      "assistant",
    ]);
    expect(open.chat.messages.map(steerMark)).toEqual([
      null,
      "queued",
      "queued",
      "queued",
      null,
    ]);

    first.push({ type: "data-steer", data: { id: taken }, transient: true });
    first.push({ type: "text-delta", id: "t0", delta: "forests." });
    first.push({ type: "text-end", id: "t0" });
    first.push({ type: "finish-step" });
    first.push({ type: "data-steer-unused", data: { ids: unused }, transient: true });
    first.push({ type: "finish" });
    first.end();
    await answered;

    await vi.waitFor(() => expect(sent("POST", "/api/v1/chats/c1/stream")).toHaveLength(2));
    const resent = sent("POST", "/api/v1/chats/c1/stream")[1].body as {
      messages: UIMessage[];
    };
    expect(resent.messages.at(-1)?.parts).toEqual([
      { type: "text", text: "shorter\n\nwith a picture" },
    ]);
    expect(open.chat.messages.filter((message) => steerMark(message) !== null)).toEqual([
      expect.objectContaining({ metadata: { steer: "taken" } }),
    ]);
    second.end();
  });

  it("puts what a stopped run never read back into the composer, and sends nothing", async () => {
    const reply = stream();
    served({
      "GET /api/v1/chats?course=": json([WEB]),
      "GET /api/v1/chats/c1/messages": json([]),
      "POST /api/v1/chats/c1/stream": reply.response,
      "POST /api/v1/chats/c1/steer": json(null),
    });
    const { resumeSession, steer } = await session();
    const { setDraft, storedDraft } = await import("@/lib/chat/stored");
    const open = await resumeSession(null);
    const answered = open.chat.sendMessage({ text: "isolation forests?" });
    for (const chunk of REPLY.slice(0, 4)) reply.push(chunk);
    await vi.waitFor(() => expect(open.chat.status).toBe("streaming"));
    await steer(open.chat, "shorter");
    setDraft("and a picture");

    await open.chat.stop();
    // A stubbed response does not hear the abort; a real one ends here.
    reply.end();
    await answered;

    await vi.waitFor(() => expect(storedDraft()).toBe("shorter\n\nand a picture"));
    expect(open.chat.messages.map((message) => message.role)).toEqual([
      "user",
      "assistant",
    ]);
    expect(sent("POST", "/api/v1/chats/c1/stream")).toHaveLength(1);
  });

  it("says nothing about position when the reader is not in a lesson", async () => {
    const reply = stream();
    served({
      "GET /api/v1/chats?course=": json([WEB]),
      "GET /api/v1/chats/c1/messages": json([]),
      "POST /api/v1/chats/c1/stream": reply.response,
    });
    const { resumeSession } = await session();
    const open = await resumeSession(null);

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
      "GET /api/v1/chats?course=": json([{ ...WEB, model: "anthropic/claude-opus-5" }]),
      "GET /api/v1/chats/c1/messages": json([]),
      "POST /api/v1/chats": json(FRESH),
      "GET /api/v1/chats/c2/messages": json([]),
    });
    const { clearSession, resumeSession } = await session();
    const first = await resumeSession(null);

    const second = await clearSession();

    expect(second.chat).not.toBe(first.chat);
    expect(second.summary.id).toBe("c2");
    expect(sent("POST", "/api/v1/chats")[0].body).toEqual({
      kind: "web",
      model: "anthropic/claude-opus-5",
      course: null,
    });
  });

  it("switches to another chat from the list", async () => {
    served({
      "GET /api/v1/chats?course=": json([WEB]),
      "GET /api/v1/chats/c1/messages": json([]),
      "GET /api/v1/chats/c2/messages": json([]),
    });
    const { resumeSession, selectSession } = await session();
    await resumeSession(null);

    const other = await selectSession(FRESH);

    expect(other.summary.id).toBe("c2");
    expect(await resumeSession(null)).toBe(other);
  });

  it("switches model without ending the conversation", async () => {
    served({
      "GET /api/v1/chats?course=": json([WEB]),
      "GET /api/v1/chats/c1/messages": json([]),
      "PATCH /api/v1/chats/c1": json({ ...WEB, model: "anthropic/claude-opus-5" }),
    });
    const { changeModel, resumeSession } = await session();
    const open = await resumeSession(null);

    await changeModel("anthropic/claude-opus-5");

    const after = await resumeSession(null);
    expect(after.summary.model).toBe("anthropic/claude-opus-5");
    expect(after.chat).toBe(open.chat);
  });

  it("compacts the chat it has open", async () => {
    served({
      "GET /api/v1/chats?course=": json([WEB]),
      "GET /api/v1/chats/c1/messages": json([]),
      "POST /api/v1/chats/c1/compact": json({ summary: "entropy, so far" }),
    });
    const { compactSession, resumeSession } = await session();
    await resumeSession(null);

    await compactSession();

    expect(sent("POST", "/api/v1/chats/c1/compact")).toHaveLength(1);
  });

  it("takes the title the backend wrote from the first message", async () => {
    served({
      "GET /api/v1/chats?course=": json([FRESH]),
      "GET /api/v1/chats/c2/messages": json([]),
    });
    const { adoptSummary, resumeSession } = await session();
    const untitled = await resumeSession(null);
    expect(untitled.summary.title).toBeNull();

    adoptSummary([{ ...FRESH, title: "why is this true?" }]);

    const titled = await resumeSession(null);
    expect(titled.summary.title).toBe("why is this true?");
    expect(titled.chat).toBe(untitled.chat);
  });

  it("takes the title again when the backend renames the chat", async () => {
    // The name is not written once: the backend rewrites it as the
    // conversation moves past the question it was named for.
    served({
      "GET /api/v1/chats?course=": json([WEB]),
      "GET /api/v1/chats/c1/messages": json([]),
    });
    const { adoptSummary, resumeSession } = await session();
    const open = await resumeSession(null);

    adoptSummary([{ ...WEB, title: "Entropy and cross entropy" }]);

    const renamed = await resumeSession(null);
    expect(renamed.summary.title).toBe("Entropy and cross entropy");
    expect(renamed.chat).toBe(open.chat);
  });

  it("leaves the session alone when the title has not changed", async () => {
    served({
      "GET /api/v1/chats?course=": json([FRESH]),
      "GET /api/v1/chats/c2/messages": json([]),
    });
    const { adoptSummary, resumeSession } = await session();
    const open = await resumeSession(null);

    adoptSummary([{ ...FRESH, last_message_at: "2026-08-05T11:00:00Z" }]);

    // A republished session re-renders the panel, which asks for the listing
    // again: a chat whose name has not changed has to leave the store
    // untouched, dated later or not.
    expect(await resumeSession(null)).toBe(open);
  });

  it("does not hand the conversation to whoever signs in next", async () => {
    served({
      "GET /api/v1/chats?course=": json([WEB]),
      "GET /api/v1/chats/c1/messages": json([]),
    });
    const { resumeSession } = await session();
    const { setUser } = await import("@/lib/auth/store");
    const mine = await resumeSession(null);

    setUser({ id: "u2", email: "other@example.com", full_name: null, timezone: "UTC" });

    expect(await resumeSession(null)).not.toBe(mine);
    expect(sent("GET", "/api/v1/chats?course=")).toHaveLength(2);
  });
});

describe("the chat a course's pages open", () => {
  const FRAUD: ChatSummary = { ...WEB, id: "f1", course: "fraud-ml" };
  const FRAUD_OLDER: ChatSummary = { ...WEB, id: "f2", course: "fraud-ml" };
  const QUANT: ChatSummary = { ...WEB, id: "q1", course: "quant" };

  function courses(): void {
    served({
      "GET /api/v1/chats?course=fraud-ml": json([FRAUD, FRAUD_OLDER]),
      "GET /api/v1/chats?course=quant": json([QUANT]),
      "GET /api/v1/chats/f1/messages": json([]),
      "GET /api/v1/chats/f2/messages": json([]),
      "GET /api/v1/chats/q1/messages": json([]),
      "GET /api/v1/chats/c1/messages": json([]),
    });
  }

  it("is the one last open in that course, each course its own", async () => {
    remembered({ chats: JSON.stringify({ "fraud-ml": "f2", quant: "q1" }) });
    courses();
    const { resumeSession } = await session();

    const fraud = await resumeSession("fraud-ml");
    const quant = await resumeSession("quant");
    const back = await resumeSession("fraud-ml");

    expect([fraud.summary.id, quant.summary.id, back.summary.id]).toEqual([
      "f2",
      "q1",
      "f2",
    ]);
  });

  it("stays the one the reader picked while the course does not change", async () => {
    courses();
    const { resumeSession, selectSession } = await session();
    await resumeSession("fraud-ml");

    const picked = await selectSession(WEB);

    expect(await resumeSession("fraud-ml")).toBe(picked);
    expect(sent("GET", "/api/v1/chats?course=fraud-ml")).toHaveLength(1);
  });

  it("is a new chat in that course when it has none", async () => {
    const created: ChatSummary = { ...FRESH, course: "quant" };
    served({
      "GET /api/v1/chats?course=quant": json([]),
      "POST /api/v1/chats": json(created),
      "GET /api/v1/chats/c2/messages": json([]),
    });
    const { resumeSession } = await session();

    const open = await resumeSession("quant");

    expect(open.summary.course).toBe("quant");
    expect(sent("POST", "/api/v1/chats")[0].body).toMatchObject({ course: "quant" });
  });

  it("clears into a new chat in the page's course", async () => {
    served({
      "GET /api/v1/chats?course=fraud-ml": json([FRAUD]),
      "GET /api/v1/chats/f1/messages": json([]),
      "POST /api/v1/chats": json({ ...FRESH, course: "fraud-ml" }),
      "GET /api/v1/chats/c2/messages": json([]),
    });
    const { clearSession, resumeSession } = await session();
    await resumeSession("fraud-ml");

    await clearSession();

    expect(sent("POST", "/api/v1/chats")[0].body).toMatchObject({ course: "fraud-ml" });
  });

  it("moves the open chat by hand and keeps the conversation", async () => {
    served({
      "GET /api/v1/chats?course=fraud-ml": json([FRAUD]),
      "GET /api/v1/chats/f1/messages": json([]),
      "PATCH /api/v1/chats/f1": json({ ...FRAUD, course: "quant" }),
    });
    const { moveChat, resumeSession } = await session();
    const open = await resumeSession("fraud-ml");

    await moveChat("f1", "quant");

    const after = await resumeSession("fraud-ml");
    expect(sent("PATCH", "/api/v1/chats/f1")[0].body).toEqual({ course: "quant" });
    expect(after.summary.course).toBe("quant");
    expect(after.chat).toBe(open.chat);
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
