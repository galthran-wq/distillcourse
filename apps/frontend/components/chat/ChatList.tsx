"use client";

import type { ChatSummary } from "@/lib/chat/api";
import { MENU_ITEM_CLASS } from "@/components/ui/styles";

interface Props {
  chats: ChatSummary[];
  current: string;
  /**
   * The row look. In the menu these rows sit among the command and model rows
   * and have to be the same row as them, which is a class the menu owns; the
   * rail is a list of its own and takes the default.
   */
  className?: string;
  onSelect: (chat: ChatSummary) => void;
}

// A chat title is arbitrary length and these are the two places that list them.
const ROW = `${MENU_ITEM_CLASS} truncate`;

/** The reader's other conversations — in the panel's menu, and in its rail. */
export default function ChatList({ chats, current, className = ROW, onSelect }: Props) {
  return (
    <>
      {chats.map((chat) => (
        <button
          key={chat.id}
          type="button"
          className={`${className} ${chat.id === current ? "text-accent" : "text-soft"}`}
          onClick={() => onSelect(chat)}
        >
          {chat.title ?? "New chat"}
        </button>
      ))}
    </>
  );
}
