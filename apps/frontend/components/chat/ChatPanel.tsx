"use client";

import { useChat } from "@ai-sdk/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type RefObject } from "react";
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
import { listModels, siteChats, type ChatModel, type ChatSummary } from "@/lib/chat/api";
import { parseCommand } from "@/lib/chat/commands";
import { startPanelDrag } from "@/lib/chat/panel-box";
import { restoreQuotes, type Quote } from "@/lib/chat/quote";
import { linkTo, plain } from "@/lib/chat/references";
import {
  adoptSummary,
  busy,
  changeModel,
  clearSession,
  compactSession,
  selectSession,
  streamFailure,
  type Session,
} from "@/lib/chat/session";
import { closePanel, toggleExpanded } from "@/lib/chat/stored";
import { useLessons } from "@/lib/content/links";
import { useSections } from "@/lib/content/sections";
import { ApiError } from "@/lib/http";
import { useDismiss } from "@/lib/ui/dismiss";

interface Props {
  session: Session;
  /** The panel this is the inside of: what the header drags. */
  panel: RefObject<HTMLElement | null>;
  expanded: boolean;
}

/**
 * How long the backend's naming pass is given before the listing is taken
 * again. Generous rather than tight: it is a whole completion, and the cost of
 * being early is one listing that says what the last one did.
 */
export const RENAME_MS = 8000;

/** What went wrong, in the reader's terms — or that nothing answered at all. */
function failure(error: unknown): string {
  return error instanceof ApiError ? error.message : "the server is unreachable";
}

/**
 * How often the transcript re-renders while an answer streams, at most. A reply
 * arrives a token at a time, and each render re-parses the message's markdown
 * and re-runs KaTeX over it; per token that saturates the main thread and the
 * tab stops painting ("Page unresponsive"). The SDK's own throttle bounds it to
 * ~8/s — combined with the memoised turns (`Messages`), only the streaming turn
 * re-parses, and only that often. The reasoning trace rides the same throttle.
 */
const STREAM_THROTTLE_MS = 120;

export default function ChatPanel({ session, panel, expanded }: Props) {
  const { messages, sendMessage, status, error } = useChat({
    chat: session.chat,
    experimental_throttle: STREAM_THROTTLE_MS,
  });
  const [models, setModels] = useState<ChatModel[]>([]);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [menu, setMenu] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const header = useRef<HTMLElement>(null);
  const title = useRef<HTMLParagraphElement>(null);
  const lessons = useLessons();
  const sections = useSections();
  const router = useRouter();

  useDismiss(menu, header, setMenu);

  function report(error: unknown): void {
    setNotice(failure(error));
  }

  useEffect(() => {
    listModels().then(setModels, report);
  }, []);

  // Refetched rather than accumulated: names and dates are written
  // server-side, and other tabs add chats this one has never seen. One listing
  // serves the rail's rows and the header's own name for the chat alike — the
  // backend rewrites that name as the conversation moves past what it was
  // first called. A settled run is when both may have changed, which is why
  // status is a dependency; `useChat`'s onFinish is no use for it, since the
  // SDK ignores its callbacks when it is handed a `chat` to drive.
  useEffect(() => {
    if (busy(status)) return;
    // Several of these can be in flight — a menu opened while a run settles —
    // and they are not ordered, so a superseded one must not be what lands.
    let live = true;
    const load = (): void => {
      siteChats().then((listed) => {
        if (!live) return;
        setChats(listed);
        adoptSummary(listed);
      }, report);
    };
    load();
    // The rename is a completion of its own that the backend starts only after
    // the stream is terminated, so the listing taken at the settle is from
    // before it. One more, once that pass has had time to land — without it the
    // new name is invisible until the reader's next turn settles.
    const renamed = setTimeout(load, RENAME_MS);
    return () => {
      live = false;
      clearTimeout(renamed);
    };
  }, [expanded, menu, status, session.summary]);

  // The request took the passages off the composer as it was built, and this
  // one never got through — refused by the cap, or nothing answered at all.
  // The question can be asked again, so they go back rather than being lost.
  useEffect(() => {
    if (error !== undefined) restoreQuotes();
  }, [error]);

  function run(work: Promise<unknown>, done: string | null = null): void {
    setMenu(false);
    setNotice(null);
    work.then(() => setNotice(done), report);
  }

  /**
   * A lab chat is had beside its lab, so choosing one goes to that page — if
   * the site still renders it; otherwise the reader stays where they are.
   */
  function select(chat: ChatSummary): void {
    run(selectSession(chat));
    const page = chat.lab_lesson === null ? null : linkTo(chat.lab_lesson, lessons);
    if (page !== null && page.url !== window.location.pathname) router.push(page.url);
  }

  function submit(text: string, quotes: Quote[]): void {
    const command = parseCommand(text);
    if (command === "clear") return run(clearSession());
    if (command === "compact") return run(compactSession(), "history compacted");
    setNotice(null);
    // The passages ride along on the message so the bubble shows them at once.
    // What is actually sent to the backend is still the field the transport
    // takes them out of the composer for; this copy is the widget's own, and
    // the backend has no use for it.
    void sendMessage({ text, metadata: { quotes } });
  }

  const line = error === undefined ? notice : streamFailure(error);

  return (
    <>
      <header
        ref={header}
        // Docked, the header is also what the panel is dragged around the page
        // by — but only where it is bare: the buttons in it are pressed rather
        // than dragged, and so is every part of the menu, which hangs off this
        // same element. Expanded there is nowhere to drag it to.
        onPointerDown={
          expanded
            ? undefined
            : (press) => {
                const pressed = press.target as HTMLElement;
                if (pressed === press.currentTarget || pressed === title.current)
                  startPanelDrag(press, panel.current, "move");
              }
        }
        // Under the breakpoint `startPanelDrag` refuses, so neither the cursor
        // nor the gesture it would take from the browser belongs there.
        className={`relative flex items-center gap-0.5 border-b border-line px-2 py-1.5 ${
          expanded ? "" : "sm:touch-none sm:cursor-grab sm:active:cursor-grabbing"
        }`}
      >
        <p ref={title} className="min-w-0 flex-1 truncate px-2 text-sm">
          {/* The title is the question that started the chat, locators and
              all — read here as the places they name, the way the message
              itself reads them two lines below. */}
          {session.summary.title === null
            ? "New chat"
            : plain(session.summary.title, lessons, sections)}
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
            expanded={expanded}
            onSelect={select}
            onNew={() => run(clearSession())}
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
              dated
              onSelect={select}
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
          <Composer
            disabled={busy(status)}
            onSubmit={submit}
            models={models}
            model={session.summary.model}
            onModel={(id) => run(changeModel(id))}
          />
        </div>
      </div>
    </>
  );
}
