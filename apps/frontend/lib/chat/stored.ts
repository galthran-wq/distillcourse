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
   * the constants below, which `.chat-panel` in `globals.css` states again in
   * its own units; the rules the reader may drag them within are
   * `lib/chat/panel-box`'s.
   */
  right: number;
  bottom: number;
  width: number;
  height: number;
  /**
   * The chat the reader last had open in each course, as JSON — `{course:
   * chatId}`, General under "". Any of them may since have been deleted or
   * filed elsewhere.
   */
  chats: string;
  /** The message they were in the middle of writing. */
  draft: string;
  /** The passages attached to it, as JSON — the entry holds strings. */
  quotes: string;
  /** Whose chat id, draft and passages these are; "" while nobody is signed in. */
  owner: string;
};

/** Where the docked panel sits and how big it is, in CSS pixels. */
export type PanelBox = Pick<StoredChat, "right" | "bottom" | "width" | "height">;

// The box the panel opens in, and so also the smallest it can be dragged to and
// the closest to each edge it can be dragged. They live here, where the
// defaults below are built out of them, because `lib/chat/panel-box` — which
// enforces them — already imports this file and the other direction would be a
// cycle. The fourth copy of these numbers is `.chat-panel` in `globals.css`,
// which has to state them in its own units; the comment there says which.

/**
 * How close to the edge of the window the panel may be dragged, and so also how
 * far it may grow: the page keeps this much of itself either way.
 */
export const PANEL_MARGIN = 24;

/**
 * What the panel leaves below itself: the launcher that opens it is fixed in
 * that corner and stays there while it is open, so a box that reached the
 * bottom margin would be a box with a button sitting on it.
 */
export const LAUNCHER_CLEARANCE = 80;

/** The panel never goes below the box it opens at. */
export const MIN_WIDTH = 384;
export const MIN_HEIGHT = 512;

// What the widget needs to come back the way the reader left it, in one entry
// so that all of it is written and read as one state. Private, like every other
// store here: what the entry is called and how it is shaped stops at this file.
const stored = createPersistedStore<StoredChat>("distillcourse.chat", {
  panel: "closed",
  right: PANEL_MARGIN,
  bottom: LAUNCHER_CLEARANCE,
  width: MIN_WIDTH,
  height: MIN_HEIGHT,
  chats: "",
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

function lastChats(): Record<string, string> {
  // Written by this file, but storage is the reader's to edit.
  try {
    const parsed: unknown = JSON.parse(stored.get().chats);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, string>)
      : {};
  } catch {
    return {};
  }
}

/** The chat last open in `course` (null: General), "" for none. */
export function storedChatId(course: string | null): string {
  const id = lastChats()[course ?? ""];
  return typeof id === "string" ? id : "";
}

export function rememberChat(course: string | null, chatId: string): void {
  stored.set({ chats: JSON.stringify({ ...lastChats(), [course ?? ""]: chatId }) });
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
  stored.set({ chats: "", draft: "", quotes: "", owner });
}
