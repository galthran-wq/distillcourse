// @vitest-environment jsdom
import { act, createRef } from "react";
import { Chat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { afterEach, describe, expect, it, vi } from "vitest";
import ChatPanel from "@/components/chat/ChatPanel";
import { LessonsProvider } from "@/lib/content/links";
import { SectionsProvider } from "@/lib/content/sections";
import { CHAT_SUMMARY, composing, LESSONS, SECTIONS, turn } from "./chat-fixture";
import { mounted, stubResizeObserver, stubScrollIntoView, type } from "./utils/dom";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

stubResizeObserver();
stubScrollIntoView();

describe("the composer while the tutor answers", () => {
  const { host, composer, field, press, listed, sent, stops } = composing();

  function button(label: string): HTMLButtonElement | null {
    return host().querySelector<HTMLButtonElement>(`[aria-label="${label}"]`);
  }

  it("puts a stop button where the send button was", () => {
    composer(true);

    expect(button("Send")).toBeNull();
    act(() => button("Stop")!.click());
    expect(stops()).toBe(1);
  });

  it("stops on Escape", () => {
    composer(true);

    press("Escape");

    expect(stops()).toBe(1);
  });

  it("still sends: what is written now steers the answer", () => {
    composer(true);
    type(field(), "focus on the path length");

    press("Enter");

    expect(sent).toEqual(["focus on the path length"]);
  });

  it("spends Escape on an open list rather than on the run", () => {
    composer(true);
    type(field(), "/");

    press("Escape");

    expect(listed()).toEqual([]);
    expect(stops()).toBe(0);
  });

  it("has nothing to stop when idle: Escape does nothing, Send is back", () => {
    press("Escape");

    expect(stops()).toBe(0);
    expect(button("Stop")).toBeNull();
    expect(button("Send")).not.toBeNull();
  });
});

describe("stopping the tutor", () => {
  const SUMMARY = CHAT_SUMMARY;
  const { host, render } = mounted();

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /**
   * A panel whose run is in flight until it is stopped. `kept` is the
   * transcript the backend stored when it was; `refused`, that the stop
   * request failed instead.
   */
  async function stopped({
    kept,
    refused = false,
  }: {
    kept: UIMessage[];
    refused?: boolean;
  }): Promise<{ posted: string[]; chat: Chat<UIMessage> }> {
    const posted: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit = {}) => {
        if ((init.method ?? "GET") === "POST") posted.push(url);
        if (url.endsWith("/stream"))
          return new Promise<Response>((_, reject) =>
            init.signal?.addEventListener("abort", () =>
              reject(new DOMException("aborted", "AbortError")),
            ),
          );
        if (url.endsWith("/stop"))
          return refused
            ? new Response(JSON.stringify({ detail: "no" }), { status: 500 })
            : new Response(null, { status: 204 });
        const body = url.endsWith("/messages")
          ? kept
          : url.endsWith("/chats/models")
            ? []
            : [SUMMARY];
        return new Response(JSON.stringify(body), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }),
    );
    const chat = new Chat<UIMessage>({
      id: SUMMARY.id,
      messages: [],
      transport: new DefaultChatTransport({ api: "/api/v1/chats/c1/stream" }),
    });
    await act(async () =>
      render(
        <SectionsProvider value={SECTIONS}>
          <LessonsProvider value={LESSONS}>
            <ChatPanel
              session={{ summary: SUMMARY, chat }}
              course="info-theory"
              panel={createRef<HTMLElement>()}
              expanded={false}
            />
          </LessonsProvider>
        </SectionsProvider>,
      ),
    );
    await act(async () => {
      void chat.sendMessage({ text: "why?" });
    });
    const stop = host().querySelector<HTMLButtonElement>('[aria-label="Stop"]')!;
    await act(async () => stop.click());
    await vi.waitFor(() => expect(chat.status).toBe("ready"));
    return { posted, chat };
  }

  /** The `stopped` marks on screen, by the turn each is under. */
  function marks(): string[] {
    return [...host().querySelectorAll("article")]
      .filter((article) =>
        [...article.querySelectorAll("p")].some((p) => p.textContent === "stopped"),
      )
      .map((article) => article.getAttribute("aria-label") ?? "");
  }

  const question = turn("user", { type: "text", text: "why?" });
  const answer = turn("assistant", { type: "text", text: "Two sentences. So far." });

  it("aborts the stream and tells the backend, which owns the run", async () => {
    const { posted } = await stopped({ kept: [question, answer] });

    expect(posted).toContain("/api/v1/chats/c1/stop");
  });

  it("shows what the backend kept, marked as stopped", async () => {
    const { chat } = await stopped({ kept: [question, answer] });

    await vi.waitFor(() => expect(chat.messages).toEqual([question, answer]));
    expect(host().textContent).toContain("Two sentences. So far.");
    expect(marks()).toEqual(["Tutor"]);
  });

  it("marks the question when the run kept no answer to it", async () => {
    await stopped({ kept: [question] });

    await vi.waitFor(() => expect(marks()).toEqual(["You"]));
  });

  it("clears the mark with the next turn sent", async () => {
    await stopped({ kept: [question, answer] });
    await vi.waitFor(() => expect(marks()).toEqual(["Tutor"]));

    const field = host().querySelector("textarea")!;
    type(field, "go on, shorter");
    await act(async () =>
      field.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
      ),
    );

    await vi.waitFor(() => expect(host().textContent).toContain("go on, shorter"));
    expect(marks()).toEqual([]);
  });

  it("neither reloads nor marks when the stop is refused", async () => {
    const { chat } = await stopped({ kept: [question, answer], refused: true });

    // The notice line under the transcript: the failure was reported.
    await vi.waitFor(() =>
      expect(host().querySelector('[role="status"].text-accent')).not.toBeNull(),
    );
    const asked = vi.mocked(fetch).mock.calls.map(([url]) => String(url));
    expect(asked.some((url) => url.endsWith("/messages"))).toBe(false);
    expect(chat.messages.map((message) => message.role)).toEqual(["user"]);
    expect(marks()).toEqual([]);
  });
});
