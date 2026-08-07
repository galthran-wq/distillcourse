"use client";

import { createPersistedStore } from "@/lib/persisted";

/** Shut, in its corner beside the page, or spread over it. */
export type PanelState = "closed" | "docked" | "expanded";

export type StoredChat = {
  /** A `PanelState`; the store can only hold it as a string. */
  panel: string;
  /**
   * The box the reader dragged the docked panel to, in CSS pixels — the two
   * offsets from the corner it is anchored in, and its size. The defaults are
   * `.chat-panel`'s own, written out in `globals.css`; the rules the reader
   * may drag them within are `lib/chat/panel-box`'s.
   */
  right: number;
  bottom: number;
  width: number;
  height: number;
  /** The chat the reader had open, "" for none. It may since have been deleted. */
  chatId: string;
  /** The message they were in the middle of writing. */
  draft: string;
  /** The passages attached to it, as JSON — the entry holds strings. */
  quotes: string;
  /** Whose chat id, draft and passages these are; "" while nobody is signed in. */
  owner: string;
};

/** Where the docked panel sits and how big it is, in CSS pixels. */
export type PanelBox = Pick<StoredChat, "right" | "bottom" | "width" | "height">;

// What the widget needs to come back the way the reader left it, in one entry
// so that all of it is written and read as one state. Private, like every other
// store here: what the entry is called and how it is shaped stops at this file.
const stored = createPersistedStore<StoredChat>("distillcourse.chat", {
  panel: "closed",
  right: 24,
  bottom: 80,
  width: 384,
  height: 512,
  chatId: "",
  draft: "",
  quotes: "",
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

// The box below is the browser's rather than the reader's, like the panel state
// it sits beside: it is where this window has room for the panel, and signing
// out does not take it away.

export function usePanelBox(): PanelBox {
  return {
    right: stored.use("right"),
    bottom: stored.use("bottom"),
    width: stored.use("width"),
    height: stored.use("height"),
  };
}

export function panelBox(): PanelBox {
  const { right, bottom, width, height } = stored.get();
  return { right, bottom, width, height };
}

/** A box that changes nothing is dropped here: every write is a write to storage. */
export function setPanelBox(box: PanelBox): void {
  const current = panelBox();
  const same = (edge: keyof PanelBox): boolean => box[edge] === current[edge];
  if (same("right") && same("bottom") && same("width") && same("height")) return;
  stored.set(box);
}

/** The message being written, kept here so a reload does not lose it. */
export function useDraft(): string {
  return stored.use("draft");
}

export function setDraft(draft: string): void {
  stored.set({ draft });
}

// The passages attached to that message live here too, and not in a store of
// their own: they and the half-written question are one unsent message, so a
// reload keeps both, and the owner below drops both together. Their shape is
// `lib/chat/quote`'s, which is why this end of it only ever sees the string.

export function useStoredQuotes(): string {
  return stored.use("quotes");
}

export function storedQuotes(): string {
  return stored.get().quotes;
}

export function setStoredQuotes(quotes: string): void {
  stored.set({ quotes });
}

export function storedChatId(): string {
  return stored.get().chatId;
}

export function rememberChat(chatId: string): void {
  stored.set({ chatId });
}

/**
 * Hand the stored chat to whoever is signed in now, dropping the unsent
 * message the reader before them left — the draft and the passages attached to
 * it alike: it renders straight into the composer, so a shared browser has to
 * forget it, and only the entry knows whose it is — the load that would leak
 * it never saw them sign out. Where the panel sits belongs to the browser
 * rather than to them, and stays.
 */
export function claimStored(owner: string): void {
  if (stored.get().owner === owner) return;
  stored.set({ chatId: "", draft: "", quotes: "", owner });
}
