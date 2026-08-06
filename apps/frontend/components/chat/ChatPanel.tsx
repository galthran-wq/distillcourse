"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useState } from "react";
import ChatMenu from "@/components/chat/ChatMenu";
import Composer from "@/components/chat/Composer";
import Messages from "@/components/chat/Messages";
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
import { ApiError } from "@/lib/http";

export default function ChatPanel({ session }: { session: Session }) {
  const { messages, sendMessage, status, error } = useChat({ chat: session.chat });
  const [models, setModels] = useState<ChatModel[]>([]);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [menu, setMenu] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    listModels().then(setModels, () => setNotice("the server is unreachable"));
  }, []);

  function report(failure: unknown): void {
    setNotice(
      failure instanceof ApiError ? failure.message : "the server is unreachable",
    );
  }

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

  function toggleMenu(): void {
    setMenu(!menu);
    if (menu) return;
    // Refetched on every open: titles are written server-side from the first
    // message, and other tabs add chats this one has never seen.
    webChats().then(setChats, report);
  }

  function submit(text: string): void {
    const command = parseCommand(text);
    if (command === "clear") return run(clearSession());
    if (command === "compact") return run(compactSession(), "history compacted");
    setNotice(null);
    void sendMessage({ text });
  }

  const model =
    models.find((entry) => entry.openrouter_id === session.summary.model)?.display_name ??
    session.summary.model;
  const line = error === undefined ? notice : streamFailure(error);

  return (
    <>
      <header className="relative flex items-center gap-3 border-b border-line px-4 py-2">
        <p className="min-w-0 flex-1 truncate text-sm">
          {session.summary.title ?? "New chat"}
        </p>
        <span className="font-mono text-[11px] text-faint">{model}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMenu}
          aria-label="Chat menu"
          aria-expanded={menu}
        >
          ⋯
        </Button>
        {menu && (
          <ChatMenu
            current={session.summary}
            chats={chats}
            models={models}
            onNew={() => run(clearSession())}
            onCompact={() => run(compactSession(), "history compacted")}
            onSelect={(chat) => run(selectSession(chat))}
            onModel={(id) => run(changeModel(id))}
          />
        )}
      </header>

      <Messages messages={messages} status={status} />

      {line !== null && (
        <p role="status" className="px-4 pb-1 text-[13px] text-accent">
          {line}
        </p>
      )}
      <Composer disabled={busy(status)} onSubmit={submit} />
    </>
  );
}
