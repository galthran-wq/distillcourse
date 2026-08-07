"use client";

import ChatList from "@/components/chat/ChatList";
import { COMMANDS } from "@/lib/chat/commands";
import type { ChatListing, ChatModel, ChatSummary } from "@/lib/chat/api";
import { LABEL_CLASS, MENU_CLASS, MENU_ITEM_CLASS } from "@/components/ui/styles";

interface Props {
  current: ChatSummary;
  chats: ChatListing[];
  models: ChatModel[];
  /** The panel is over the page, where the rail lists the chats beside it. */
  expanded: boolean;
  onNew: () => void;
  onCompact: () => void;
  onSelect: (chat: ChatListing) => void;
  onModel: (model: string) => void;
}

const HEADING = `px-2.5 pt-3 pb-1 ${LABEL_CLASS}`;
const ITEM = `${MENU_ITEM_CLASS} truncate`;

export default function ChatMenu({
  current,
  chats,
  models,
  expanded,
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

      {/* Only where the rail is not: it appears at the same width the rail does. */}
      <div className={expanded ? "lg:hidden" : ""}>
        <p className={HEADING}>Chats</p>
        <ChatList
          chats={chats}
          current={current.id}
          className={ITEM}
          onSelect={onSelect}
        />
      </div>
    </div>
  );
}
