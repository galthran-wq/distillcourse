"use client";

import { COMMANDS } from "@/lib/chat/commands";
import type { ChatModel, ChatSummary } from "@/lib/chat/api";
import { LABEL_CLASS, MENU_CLASS, MENU_ITEM_CLASS } from "@/components/ui/styles";

interface Props {
  current: ChatSummary;
  chats: ChatSummary[];
  models: ChatModel[];
  onNew: () => void;
  onCompact: () => void;
  onSelect: (chat: ChatSummary) => void;
  onModel: (model: string) => void;
}

const HEADING = `px-2.5 pt-3 pb-1 ${LABEL_CLASS}`;
// A chat title is arbitrary length and this panel is the one that lists them.
const ITEM = `${MENU_ITEM_CLASS} truncate text-sm`;

export default function ChatMenu({
  current,
  chats,
  models,
  onNew,
  onCompact,
  onSelect,
  onModel,
}: Props) {
  return (
    <div className={`${MENU_CLASS} max-h-96 w-64 overflow-y-auto`}>
      <button type="button" className={`${ITEM} text-soft`} onClick={onNew}>
        /clear — {COMMANDS.clear}
      </button>
      <button type="button" className={`${ITEM} text-soft`} onClick={onCompact}>
        /compact — {COMMANDS.compact}
      </button>

      <p className={HEADING}>Model</p>
      {models.map((model) => (
        <button
          key={model.openrouter_id}
          type="button"
          className={`${ITEM} ${model.openrouter_id === current.model ? "text-accent" : "text-soft"}`}
          onClick={() => onModel(model.openrouter_id)}
        >
          {model.display_name}
        </button>
      ))}

      <p className={HEADING}>Chats</p>
      {chats.map((chat) => (
        <button
          key={chat.id}
          type="button"
          className={`${ITEM} ${chat.id === current.id ? "text-accent" : "text-soft"}`}
          onClick={() => onSelect(chat)}
        >
          {chat.title ?? "New chat"}
        </button>
      ))}
    </div>
  );
}
