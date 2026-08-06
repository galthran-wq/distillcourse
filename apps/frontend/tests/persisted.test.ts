// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPersistedStore } from "@/lib/persisted";

const KEY = "distillcourse.test";

type Remembered = {
  open: boolean;
  chatId: string;
  draft: string;
};

/** A tab holding this record: two of these over one key are two tabs. */
function tab() {
  return createPersistedStore<Remembered>(KEY, { open: false, chatId: "", draft: "" });
}

function stashed(state: Record<string, unknown>): void {
  window.localStorage.setItem(KEY, JSON.stringify(state));
}

/** The entry itself — what the next load is built out of. */
function entry(): unknown {
  return JSON.parse(window.localStorage.getItem(KEY) ?? "null");
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("a persisted store", () => {
  it("hands the next load what this one wrote", () => {
    tab().set({ chatId: "c1", draft: "why is this true?" });

    expect(tab().get()).toEqual({ open: false, chatId: "c1", draft: "why is this true?" });
  });

  it("falls back to the declared defaults when the entry is corrupt", () => {
    stashed({ open: "yes", chatId: "c1", draft: 123, gone: "old field" });

    // Field by field: these stores are mounted on every page, so the one good
    // field is worth keeping and the wrong-typed ones must not reach a reader.
    expect(tab().get()).toEqual({ open: false, chatId: "c1", draft: "" });
  });

  it("does not write back over what another tab changed", () => {
    const here = tab();
    const other = tab();

    other.set({ draft: "asked in the other tab" });
    here.set({ open: true });

    expect(entry()).toEqual({ open: true, chatId: "", draft: "asked in the other tab" });
    // The other tab's composer text is not this composer's to display, though:
    // what this tab holds took the patch alone.
    expect(here.get().draft).toBe("");
  });

  it("keeps this tab's own change when storage refuses the write", () => {
    stashed({ open: false, chatId: "c1", draft: "" });
    const here = tab();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage is full");
    });

    here.set({ draft: "why is this true?" });
    here.set({ open: true });

    // Private-mode Safari refuses every write. Not persisting the draft is the
    // cost; the entry going stale and taking the draft out of the composer
    // mid-sentence, on the next unrelated write, would not be acceptable.
    expect(here.get()).toEqual({ open: true, chatId: "c1", draft: "why is this true?" });
  });
});
