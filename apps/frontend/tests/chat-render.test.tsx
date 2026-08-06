import { describe, expect, it } from "vitest";
import type { UIMessage } from "ai";
import { rendered, turn } from "./chat-fixture";

function reply(...parts: UIMessage["parts"]): string {
  return rendered([
    turn("user", { type: "text", text: "why is this true?" }),
    turn("assistant", ...parts),
  ]);
}

describe("a rendered reply", () => {
  it("typesets math the way the lesson it is about does", () => {
    const html = reply({ type: "text", text: "Entropy is $H(X) = -\\sum p \\log p$." });

    expect(html).toContain("katex");
    expect(html).toContain("Entropy is");
  });

  it("typesets display math", () => {
    const html = reply({
      type: "text",
      text: "$$\nH(X) = -\\sum_x p(x)\\log p(x)\n$$",
    });

    expect(html).toContain("katex-display");
  });

  it("renders markdown, not the source of it", () => {
    const html = reply({ type: "text", text: "- first\n- second\n\n`code`" });

    expect(html).toContain("<li>first</li>");
    expect(html).toContain("<code>code</code>");
  });

  it("names each turn", () => {
    const html = reply({ type: "text", text: "Because it is a mean." });

    expect(html).toContain("you");
    expect(html).toContain("tutor");
  });

  it("shows a tool the tutor is still running", () => {
    const html = reply({
      type: "tool-search_lessons",
      toolCallId: "call-1",
      state: "input-available",
      input: { query: "entropy" },
    });

    expect(html).toContain("search lessons…");
  });

  it("shows a tool that has answered", () => {
    const html = reply({
      type: "tool-search_lessons",
      toolCallId: "call-1",
      state: "output-available",
      input: { query: "entropy" },
      output: { hits: [] },
    });

    expect(html).toContain("search lessons — done");
  });
});
