import type { UIMessage } from "ai";
import { call } from "@/lib/http";

export interface ChatSummary {
  id: string;
  kind: string;
  /** The lab a lab chat belongs to, as its lesson locator; null for any other. */
  lab_lesson: string | null;
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
 * The reader's chats with the site — the panel's own, and the ones a lab
 * notebook asked in — most recently spoken in first. Telegram threads are left
 * out: the widget cannot render an eternal thread it does not own.
 */
export async function siteChats(): Promise<ChatSummary[]> {
  const chats = await call<ChatSummary[]>("/chats");
  return chats.filter((chat) => chat.kind !== "telegram");
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

export function listModels(): Promise<ChatModel[]> {
  return call<ChatModel[]>("/chats/models");
}
