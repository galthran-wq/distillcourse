"use client";

import { COMMANDS } from "@/lib/chat/commands";
import type { ChatModel, ChatSummary } from "@/lib/chat/api";
import { LABEL_CLASS } from "@/components/ui/styles";

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
const ITEM =
  "block w-full truncate rounded-sm px-2.5 py-2 text-left text-sm transition-colors duration-(--motion-fast) hover:bg-line/60";

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
    <div className="absolute right-0 top-full z-10 mt-1 max-h-96 w-64 overflow-y-auto rounded-md border border-line bg-panel p-1.5 shadow-popover">
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
