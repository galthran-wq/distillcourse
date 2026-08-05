import { describe, expect, it } from "vitest";
import { parseCommand } from "@/lib/chat/commands";

describe("what the reader typed", () => {
  it("is a command when it names one", () => {
    expect(parseCommand("/clear")).toBe("clear");
    expect(parseCommand("  /compact  ")).toBe("compact");
  });

  it("is a question when it is not a command", () => {
    expect(parseCommand("why is this true?")).toBeNull();
    expect(parseCommand("/help")).toBeNull();
    // The tutor, not the widget, is the one who can answer this.
    expect(parseCommand("what does /clear do?")).toBeNull();
  });
});
