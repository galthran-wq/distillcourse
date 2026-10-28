import type { UIMessage } from "ai";
import { describe, expect, it } from "vitest";
import { current, steps, summary } from "@/lib/chat/activity";

const THOUGHT: UIMessage = {
  id: "a1",
  role: "assistant",
  parts: [
    { type: "reasoning", text: "first", state: "done" },
    { type: "reasoning", text: "second", state: "done" },
  ],
};

describe("an answer's activity", () => {
  it("adds up the time this browser watched each thought take", () => {
    const timing = new Map([
      ["a1:0", { start: 0, end: 9_400 }],
      ["a1:1", { start: 20_000, end: 24_600 }],
    ]);

    expect(summary(steps([THOUGHT], timing))).toBe("Thought 14s");
  });

  it("says it thought, without a time it never saw", () => {
    expect(summary(steps([THOUGHT], new Map()))).toBe("Thought");
  });

  it("counts a verb, and a noun where there is one", () => {
    const tools: UIMessage = {
      id: "a2",
      role: "assistant",
      parts: [
        {
          type: "tool-fetch_content",
          toolCallId: "r1",
          state: "output-available",
          input: { locator: "lesson:c/one" },
          output: {},
        },
        {
          type: "tool-search_content",
          toolCallId: "s1",
          state: "output-available",
          input: { query: "q" },
          output: [],
        },
        {
          type: "tool-get_user_progress",
          toolCallId: "p1",
          state: "output-available",
          input: {},
          output: {},
        },
      ],
    };

    expect(summary(steps([tools], new Map()))).toBe(
      "Read 1 lesson · searched · checked your progress",
    );
  });

  it("has no step under way between steps", () => {
    expect(current(steps([THOUGHT], new Map()))).toBeNull();
  });
});
