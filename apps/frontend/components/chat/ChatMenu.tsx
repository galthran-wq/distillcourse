"use client";

import ChatList from "@/components/chat/ChatList";
import type { ChatListing, ChatModel, ChatSummary } from "@/lib/chat/api";
import { LABEL_CLASS, MENU_CLASS, MENU_ITEM_CLASS } from "@/components/ui/styles";

interface Props {
  current: ChatSummary;
  chats: ChatListing[];
  models: ChatModel[];
  /** The panel is over the page, where the rail lists the chats beside it. */
  expanded: boolean;
  onSelect: (chat: ChatListing) => void;
  onModel: (model: string) => void;
}

// The commands are not here: the composer's palette is where they are run
// from. The gap above a heading is what separates its group from the group
// above it, so it belongs to the use rather than to the constant: the first
// heading in the menu has nothing above it and keeps the menu's own padding.
const HEADING = `px-2.5 pb-1 ${LABEL_CLASS}`;
const ITEM = `${MENU_ITEM_CLASS} truncate`;

export default function ChatMenu({
  current,
  chats,
  models,
  expanded,
  onSelect,
  onModel,
}: Props) {
  return (
    <div className={`${MENU_CLASS} max-h-96 w-64 overflow-y-auto`}>
      <p className={`${HEADING} pt-1.5`}>Model</p>
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
        <p className={`${HEADING} pt-3`}>Chats</p>
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
