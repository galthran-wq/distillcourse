import type { UIMessage } from "ai";
import { call } from "@/lib/http";

export interface ChatSummary {
  id: string;
  kind: string;
  model: string;
  title: string | null;
  created_at: string;
}

/**
 * A chat as the listing returns it. The date is a maximum over the chat's
 * messages and only the listing computes it — a summary handed back by
 * `createChat` or `setChatModel` is one chat with nothing to compare it to.
 */
export interface ChatListing extends ChatSummary {
  /** Null for a chat nobody has said anything in yet. */
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
export async function webChats(): Promise<ChatListing[]> {
  const chats = await call<ChatListing[]>("/chats");
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

export function listModels(): Promise<ChatModel[]> {
  return call<ChatModel[]>("/chats/models");
}
