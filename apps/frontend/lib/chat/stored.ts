"use client";

import { createPersistedStore } from "@/lib/persisted";

/** Shut, in its corner beside the page, or spread over it. */
export type PanelState = "closed" | "docked" | "expanded";

export type StoredChat = {
  /** A `PanelState`; the store can only hold it as a string. */
  panel: string;
  /** The chat the reader had open, "" for none. It may since have been deleted. */
  chatId: string;
  /** The message they were in the middle of writing. */
  draft: string;
  /** Whose chat id and draft these are; "" while nobody is signed in. */
  owner: string;
};

// What the widget needs to come back the way the reader left it, in one entry
// so that the four are written and read as one state. Private, like every other
// store here: what the entry is called and how it is shaped stops at this file.
const stored = createPersistedStore<StoredChat>("distillcourse.chat", {
  panel: "closed",
  chatId: "",
  draft: "",
  owner: "",
});

// The panel is opened from the lesson as well as from the widget — quoting a
// passage is asking about it — and the two trees have no common ancestor. It is
// stored because a reload is not a decision to close it.

// The store guarantees only that the field is a string: an older version of
// this code, or a hand-edited entry, can leave anything in it.
function asState(panel: string): PanelState {
  return panel === "docked" || panel === "expanded" ? panel : "closed";
}

export function usePanel(): PanelState {
  return asState(stored.use("panel"));
}

/** Asking about a passage opens the panel wherever the reader last had it. */
export function openPanel(): void {
  if (asState(stored.get().panel) === "closed") stored.set({ panel: "docked" });
}

export function togglePanel(): void {
  stored.set({ panel: asState(stored.get().panel) === "closed" ? "docked" : "closed" });
}

export function closePanel(): void {
  stored.set({ panel: "closed" });
}

export function toggleExpanded(): void {
  stored.set({
    panel: asState(stored.get().panel) === "expanded" ? "docked" : "expanded",
  });
}

export function collapsePanel(): void {
  stored.set({ panel: "docked" });
}

/** The message being written, kept here so a reload does not lose it. */
export function useDraft(): string {
  return stored.use("draft");
}

export function setDraft(draft: string): void {
  stored.set({ draft });
}

export function storedChatId(): string {
  return stored.get().chatId;
}

export function rememberChat(chatId: string): void {
  stored.set({ chatId });
}

/**
 * Hand the stored chat to whoever is signed in now, dropping the draft the
 * reader before them left: it renders straight into the composer, so a shared
 * browser has to forget it, and only the entry knows whose it is — the load
 * that would leak it never saw them sign out. Where the panel sits belongs to
 * the browser rather than to them, and stays.
 */
export function claimStored(owner: string): void {
  if (stored.get().owner === owner) return;
  stored.set({ chatId: "", draft: "", owner });
}
