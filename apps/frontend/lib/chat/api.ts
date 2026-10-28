import type { UIMessage } from "ai";
import { ApiError, call } from "@/lib/http";

export interface ChatSummary {
  id: string;
  kind: string;
  model: string;
  title: string | null;
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
 * The reader's chats with the site, most recently spoken in first. Telegram
 * threads are left out: the widget cannot render an eternal thread it does not
 * own.
 */
export async function webChats(): Promise<ChatSummary[]> {
  const chats = await call<ChatSummary[]>("/chats");
  return chats.filter((chat) => chat.kind === "web");
}

export function createChat(model?: string): Promise<ChatSummary> {
  return call<ChatSummary>("/chats", "POST", { kind: "web", model });
}

export function setChatModel(id: string, model: string): Promise<ChatSummary> {
  return call<ChatSummary>(`/chats/${id}`, "PATCH", { model });
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
