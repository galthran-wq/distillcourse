import { afterEach, describe, expect, it, vi } from "vitest";
import { editMemory, forgetMemory, getMemories } from "@/lib/memories/api";

function stubFetch(body: unknown = null): ReturnType<typeof vi.fn> {
  const fetch = vi.fn(
    async () =>
      new Response(body === null ? null : JSON.stringify(body), {
        status: body === null ? 204 : 200,
        headers: { "Content-Type": "application/json" },
      }),
  );
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

function requestOf(fetch: ReturnType<typeof vi.fn>): [string, RequestInit] {
  return fetch.mock.calls[0] as unknown as [string, RequestInit];
}

afterEach(() => {
  vi.unstubAllGlobals();
});

const REMEMBERED = {
  slug: "goal-information-theory",
  description: "here to prepare for an ML interview",
  content: "Wants the information theory course done by mid-September.",
  source: "agent" as const,
  updated_at: "2026-08-05T10:00:00Z",
};

describe("the memory client", () => {
  it("reads the whole profile", async () => {
    const fetch = stubFetch([REMEMBERED]);

    const memories = await getMemories();

    const [url, init] = requestOf(fetch);
    expect(url).toBe("/api/v1/memories");
    expect(init.credentials).toBe("same-origin");
    expect(memories).toEqual([REMEMBERED]);
  });

  it("puts a correction on the memory it corrects", async () => {
    const fetch = stubFetch();

    await editMemory(REMEMBERED.slug, "the interview is in October", "Not six weeks.");

    const [url, init] = requestOf(fetch);
    expect(url).toBe(`/api/v1/memories/${REMEMBERED.slug}`);
    expect(init.method).toBe("PUT");
    expect(JSON.parse(String(init.body))).toEqual({
      description: "the interview is in October",
      content: "Not six weeks.",
    });
  });

  it("deletes one memory by slug", async () => {
    const fetch = stubFetch();

    await forgetMemory(REMEMBERED.slug);

    const [url, init] = requestOf(fetch);
    expect(url).toBe(`/api/v1/memories/${REMEMBERED.slug}`);
    expect(init.method).toBe("DELETE");
  });
});
