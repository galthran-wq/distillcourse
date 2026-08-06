// @vitest-environment jsdom
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRow } from "@/components/profile/Memories";
import { editMemory, forgetMemory, type Memory } from "@/lib/memories/api";
import { mounted } from "./utils/dom";

vi.mock("@/lib/memories/api", () => ({
  editMemory: vi.fn(),
  forgetMemory: vi.fn(),
}));

const REMEMBERED: Memory = {
  slug: "goal-information-theory",
  description: "here to prepare for an ML interview",
  content: "Wants the information theory course done by mid-September.",
  source: "agent",
  updated_at: "2026-08-05T10:00:00Z",
};

// A row of a list, so the host it is mounted in is one.
const { host, render: put } = mounted("ul");
let edited: Memory[];
let forgotten: number;

function render(memory: Memory = REMEMBERED): void {
  act(() =>
    put(
      <MemoryRow
        memory={memory}
        onEdited={(row) => edited.push(row)}
        onForgotten={() => (forgotten += 1)}
      />,
    ),
  );
}

function control(label: string): HTMLButtonElement {
  const button = [...host().querySelectorAll("button")].find(
    (candidate) => candidate.textContent === label,
  );
  if (button === undefined) throw new Error(`no "${label}" button`);
  return button;
}

// React dedupes a change event against the value it last saw, and that tracker
// lives on the element's own `value` setter — so a test that assigns to it is
// the one case React ignores. Writing through the prototype is what a keystroke
// does.
function type(field: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  const prototype =
    field instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(field, value);
  act(() => field.dispatchEvent(new Event("input", { bubbles: true })));
}

async function click(button: HTMLButtonElement): Promise<void> {
  await act(async () => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

beforeEach(() => {
  edited = [];
  forgotten = 0;
});

afterEach(() => {
  vi.mocked(editMemory).mockReset();
  vi.mocked(forgetMemory).mockReset();
});

describe("a memory on the learner's page", () => {
  it("offers no save until something has changed", () => {
    render();
    expect(control("save").disabled).toBe(true);

    type(host().querySelector("input")!, "the interview is in October");

    expect(control("save").disabled).toBe(false);
  });

  it("hands the list the row it just wrote, dated now", async () => {
    vi.mocked(editMemory).mockResolvedValue();
    render();
    type(host().querySelector("input")!, "the interview is in October");
    type(host().querySelector("textarea")!, "Not six weeks; October.");

    await click(control("save"));

    expect(editMemory).toHaveBeenCalledWith(
      REMEMBERED.slug,
      "the interview is in October",
      "Not six weeks; October.",
    );
    expect(edited).toEqual([
      {
        ...REMEMBERED,
        description: "the interview is in October",
        content: "Not six weeks; October.",
        source: "user",
        updated_at: expect.any(String),
      },
    ]);
    // The date is the write's own, not the one the tutor last wrote under.
    expect(edited[0].updated_at).not.toBe(REMEMBERED.updated_at);
  });

  it("keeps the list unchanged and says so when the write fails", async () => {
    vi.mocked(editMemory).mockRejectedValue(new Error("500"));
    render();
    type(host().querySelector("input")!, "the interview is in October");

    await click(control("save"));

    expect(edited).toEqual([]);
    expect(host().querySelector("[role=alert]")?.textContent).toBe("could not save that");
  });

  it("drops the row from the list once the delete has gone through", async () => {
    vi.mocked(forgetMemory).mockResolvedValue();
    render();

    await click(control("forget this"));

    expect(forgetMemory).toHaveBeenCalledWith(REMEMBERED.slug);
    expect(forgotten).toBe(1);
  });
});
