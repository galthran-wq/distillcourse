"use client";

import { createPersistedStore } from "@/lib/persisted";

export type StoredChat = {
  open: boolean;
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
  open: false,
  chatId: "",
  draft: "",
  owner: "",
});

// The panel is opened from the lesson as well as from the widget — quoting a
// passage is asking about it — and the two trees have no common ancestor. It is
// stored because a reload is not a decision to close it.

export function openPanel(): void {
  stored.set({ open: true });
}

export function togglePanel(): void {
  stored.set({ open: !stored.get().open });
}

export function usePanel(): boolean {
  return stored.use("open");
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
