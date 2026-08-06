import { describe, expect, it } from "vitest";
import { editMemory, forgetMemory, getMemories } from "@/lib/memories/api";
import { requestOf, stubFetch } from "./utils/fetch";

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
