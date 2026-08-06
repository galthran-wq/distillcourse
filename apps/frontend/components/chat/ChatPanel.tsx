"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import ChatList from "@/components/chat/ChatList";
import ChatMenu from "@/components/chat/ChatMenu";
import Composer from "@/components/chat/Composer";
import Messages from "@/components/chat/Messages";
import {
  CloseIcon,
  CollapseIcon,
  ExpandIcon,
  MoreIcon,
  PlusIcon,
} from "@/components/chat/icons";
import { Button } from "@/components/ui";
import { listModels, webChats, type ChatModel, type ChatSummary } from "@/lib/chat/api";
import { parseCommand } from "@/lib/chat/commands";
import {
  busy,
  changeModel,
  clearSession,
  compactSession,
  refreshSummary,
  selectSession,
  streamFailure,
  type Session,
} from "@/lib/chat/session";
import { closePanel, toggleExpanded } from "@/lib/chat/stored";
import { ApiError } from "@/lib/http";
import { useDismiss } from "@/lib/ui/dismiss";

interface Props {
  session: Session;
  expanded: boolean;
}

/** What went wrong, in the reader's terms — or that nothing answered at all. */
function failure(error: unknown): string {
  return error instanceof ApiError ? error.message : "the server is unreachable";
}

export default function ChatPanel({ session, expanded }: Props) {
  const { messages, sendMessage, status, error } = useChat({ chat: session.chat });
  const [models, setModels] = useState<ChatModel[]>([]);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [menu, setMenu] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const header = useRef<HTMLElement>(null);

  useDismiss(menu, header, setMenu);

  function report(error: unknown): void {
    setNotice(failure(error));
  }

  useEffect(() => {
    listModels().then(setModels, report);
  }, []);

  // Refetched on every open rather than accumulated: titles are written
  // server-side from the first message, and other tabs add chats this one has
  // never seen. The rail shows them without being asked, so it also follows the
  // session — a new chat, a switch and the title arriving are all its summary
  // changing.
  useEffect(() => {
    if (!expanded && !menu) return;
    webChats().then(setChats, report);
  }, [expanded, menu, session.summary]);

  // The backend names a chat after its first message, so the header can only
  // learn the name once an answer is in. `useChat`'s onFinish is no use here:
  // the SDK ignores its callbacks when it is handed a `chat` to drive.
  useEffect(() => {
    if (status !== "ready" || session.summary.title !== null) return;
    refreshSummary().catch(report);
  }, [status, session]);

  function run(work: Promise<unknown>, done: string | null = null): void {
    setMenu(false);
    setNotice(null);
    work.then(() => setNotice(done), report);
  }

  function submit(text: string): void {
    const command = parseCommand(text);
    if (command === "clear") return run(clearSession());
    if (command === "compact") return run(compactSession(), "history compacted");
    setNotice(null);
    void sendMessage({ text });
  }

  const line = error === undefined ? notice : streamFailure(error);

  return (
    <>
      <header
        ref={header}
        className="relative flex items-center gap-0.5 border-b border-line px-2 py-1.5"
      >
        <p className="min-w-0 flex-1 truncate px-2 text-sm">
          {session.summary.title ?? "New chat"}
        </p>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMenu(!menu)}
          aria-label="Chat menu"
          aria-expanded={menu}
        >
          <MoreIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          // The menu hangs off this header, and the header is about to move and
          // change width under it — the press is inside it, so nothing else
          // takes the menu away.
          onClick={() => {
            setMenu(false);
            toggleExpanded();
          }}
          aria-label={expanded ? "Collapse the tutor" : "Expand the tutor"}
        >
          {expanded ? <CollapseIcon /> : <ExpandIcon />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={closePanel}
          aria-label="Close the tutor"
        >
          <CloseIcon />
        </Button>
        {menu && (
          <ChatMenu
            current={session.summary}
            chats={chats}
            models={models}
            expanded={expanded}
            onNew={() => run(clearSession())}
            onCompact={() => run(compactSession(), "history compacted")}
            onSelect={(chat) => run(selectSession(chat))}
            onModel={(id) => run(changeModel(id))}
          />
        )}
      </header>

      <div className="flex min-h-0 flex-1">
        {expanded && (
          <nav
            aria-label="Chats"
            className="hidden w-56 shrink-0 flex-col overflow-y-auto border-r border-line p-1.5 lg:flex"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => run(clearSession())}
              className="mb-1 justify-start"
            >
              <PlusIcon className="size-3.5" />
              New chat
            </Button>
            <ChatList
              chats={chats}
              current={session.summary.id}
              onSelect={(chat) => run(selectSession(chat))}
            />
          </nav>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <Messages messages={messages} chatId={session.summary.id} status={status} />
          {line !== null && (
            <p role="status" className="px-4 pb-1 text-[13px] text-accent">
              {line}
            </p>
          )}
          <Composer disabled={busy(status)} onSubmit={submit} />
        </div>
      </div>
    </>
  );
}
