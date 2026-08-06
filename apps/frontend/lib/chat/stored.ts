"use client";

import { createPersistedStore } from "@/lib/persisted";

export interface StoredChat {
  open: boolean;
  /** The chat the reader had open, "" for none. It may since have been deleted. */
  chatId: string;
  /** The message they were in the middle of writing. */
  draft: string;
  /** Whose chat id and draft these are; "" while nobody is signed in. */
  owner: string;
}

// What the widget needs to come back the way the reader left it, in one entry
// so that the four are written and read as one state.
export const stored = createPersistedStore<StoredChat>("distillcourse.chat", {
  open: false,
  chatId: "",
  draft: "",
  owner: "",
});

/**
 * Hand the stored chat to whoever is signed in now, dropping what the reader
 * before them left: an unsent draft is rendered straight into the composer, so
 * a shared browser has to forget it. Where the panel sits stays — that belongs
 * to the browser, not to them.
 *
 * The owner is settled against the entry rather than against who this tab saw
 * sign out, because the load that has to notice is the one that finds someone
 * else's draft already in storage, and it never saw them at all.
 */
export function claimStored(owner: string): void {
  if (stored.get().owner === owner) return;
  stored.set({ chatId: "", draft: "", owner });
}
