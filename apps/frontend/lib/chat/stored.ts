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
