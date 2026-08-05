"use client";

import { COMMANDS } from "@/lib/chat/commands";
import type { ChatModel, ChatSummary } from "@/lib/chat/api";

interface Props {
  current: ChatSummary;
  chats: ChatSummary[];
  models: ChatModel[];
  onNew: () => void;
  onCompact: () => void;
  onSelect: (chat: ChatSummary) => void;
  onModel: (model: string) => void;
}

const HEADING = "px-3 pt-3 pb-1 font-mono text-[11px] uppercase tracking-wider text-faint";
const ITEM = "block w-full truncate px-3 py-1.5 text-left text-sm hover:text-accent";

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
    <div className="absolute right-0 top-full z-10 max-h-96 w-64 overflow-y-auto rounded-b-md border border-line bg-panel shadow-lg">
      <button type="button" className={`${ITEM} mt-2`} onClick={onNew}>
        /clear — {COMMANDS.clear}
      </button>
      <button type="button" className={ITEM} onClick={onCompact}>
        /compact — {COMMANDS.compact}
      </button>

      <p className={HEADING}>Model</p>
      {models.map((model) => (
        <button
          key={model.openrouter_id}
          type="button"
          className={`${ITEM} ${model.openrouter_id === current.model ? "text-accent" : ""}`}
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
          className={`${ITEM} ${chat.id === current.id ? "text-accent" : ""}`}
          onClick={() => onSelect(chat)}
        >
          {chat.title ?? "New chat"}
        </button>
      ))}
    </div>
  );
}
