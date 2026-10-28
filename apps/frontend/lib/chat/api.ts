import type { UIMessage } from "ai";
import { ApiError, call } from "@/lib/http";

export interface ChatSummary {
  id: string;
  kind: string;
  /** The lab a lab chat belongs to, as its lesson locator; null for any other. */
  lab_lesson: string | null;
  model: string;
  title: string | null;
  /** The course whose pages list the chat; null for General. */
  course: string | null;
  created_at: string;
  /** When the chat was last written in; null for one nobody has spoken in. */
  last_message_at: string | null;
}

export interface ChatModel {
  openrouter_id: string;
  display_name: string;
  context_window: number;
}

/**
 * The reader's chats with the site — the panel's own, and the ones a lab
 * notebook asked in — most recently spoken in first: every one of them, or only
 * those of one course — `null` is General's. Telegram threads are left out: the
 * widget cannot render an eternal thread it does not own.
 */
export async function siteChats(course?: string | null): Promise<ChatSummary[]> {
  const query =
    course === undefined ? "" : `?course=${encodeURIComponent(course ?? "")}`;
  const chats = await call<ChatSummary[]>(`/chats${query}`);
  return chats.filter((chat) => chat.kind !== "telegram");
}

export function createChat(
  course: string | null,
  model?: string,
): Promise<ChatSummary> {
  return call<ChatSummary>("/chats", "POST", { kind: "web", model, course });
}

export function setChatModel(id: string, model: string): Promise<ChatSummary> {
  return call<ChatSummary>(`/chats/${id}`, "PATCH", { model });
}

export function setChatCourse(id: string, course: string | null): Promise<ChatSummary> {
  return call<ChatSummary>(`/chats/${id}`, "PATCH", { course });
}

export function loadMessages(id: string): Promise<UIMessage[]> {
  return call<UIMessage[]>(`/chats/${id}/messages`);
}

export function compactChat(id: string): Promise<{ summary: string }> {
  return call<{ summary: string }>(`/chats/${id}/compact`, "POST");
}

/** Cancels the run in flight, server-side; resolves once the chat is free again. */
export function stopChat(id: string): Promise<void> {
  return call<void>(`/chats/${id}/stop`, "POST");
}

/**
 * Hands a message to the run in flight. False when there is none to take it —
 * it ended before the message got there — and the message is then a turn.
 */
export async function steerChat(id: string, steer: { id: string; text: string }): Promise<boolean> {
  try {
    await call<void>(`/chats/${id}/steer`, "POST", steer);
    return true;
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) return false;
    throw error;
  }
}

export function listModels(): Promise<ChatModel[]> {
  return call<ChatModel[]>("/chats/models");
}
