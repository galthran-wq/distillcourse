"use client";

import { createPersistedStore } from "@/lib/persisted";

export interface StoredChat {
  open: boolean;
  /** The chat the reader had open. It may since have been deleted. */
  chatId: string | null;
  /** The message they were in the middle of writing. */
  draft: string;
}

// What the widget needs to come back the way the reader left it, in one entry
// so that the three are written and read as one state.
export const stored = createPersistedStore<StoredChat>("distillcourse.chat", {
  open: false,
  chatId: null,
  draft: "",
});

/**
 * Drop what belongs to the reader who was signed in, keeping the panel where
 * they left it. The chat id survives being stale on its own — it is looked up
 * in the reader's own chats and ignored when absent — but an unsent draft is
 * rendered straight into the composer, so a shared browser has to forget it.
 */
export function forgetReader(): void {
  stored.set({ chatId: null, draft: "" });
}
