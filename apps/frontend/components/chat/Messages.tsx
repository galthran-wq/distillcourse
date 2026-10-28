"use client";

import type { ChatStatus, UIMessage } from "ai";
import { memo, useEffect, useRef, type RefObject } from "react";
import Activity from "@/components/chat/Activity";
import Markdown from "@/components/chat/Markdown";
import { QuoteRow, SentQuote } from "@/components/chat/Quotes";
import { LABEL_CLASS } from "@/components/ui/styles";
import { attachedQuotes, quoted, type Quote } from "@/lib/chat/quote";
import { steerMark } from "@/lib/chat/steer";

// Within this much of the end counts as reading the newest message. Anything
// further up is the reader looking at something, and the transcript stays put.
const AT_END = 32;

/**
 * A question as it was sent. The passages it referenced are stored above it,
 * each inside the provenance fence the backend wrote — that is for the model,
 * not for the reader, so they come back out as the chips they were attached
 * as, which is also what makes them survive a reload.
 */
function Question({ text, attached }: { text: string; attached: Quote[] }) {
  const question = quoted(text);
  // The fences are written server-side, so the message the widget has just
  // added carries none of them: what it went with rides on it instead, until
  // the stored form of it is loaded.
  const quotes = question.quotes.length > 0 ? question.quotes : attached;

  return (
    <>
      {quotes.length > 0 && (
        <QuoteRow>
          {quotes.map((quote, index) => (
            // By position: the message is stored and never edited, so the list
            // is fixed for as long as it is on screen.
            <SentQuote key={index} quote={quote} />
          ))}
        </QuoteRow>
      )}
      {/* The places it pointed at are chips, as they were in the composer. */}
      <Markdown text={question.text} chips />
    </>
  );
}

/**
 * The messages the transcript shows as one turn: a question, or the answer to
 * it. A stored answer comes back as one message per model response — the
 * search, then the reply — where the stream wrote one, and both are one turn
 * with one activity line.
 */
function turns(messages: UIMessage[]): UIMessage[][] {
  const grouped: UIMessage[][] = [];
  for (const message of messages) {
    const last = grouped.at(-1);
    if (message.role === "assistant" && last?.[0].role === "assistant") last.push(message);
    else grouped.push([message]);
  }
  return grouped;
}

/**
 * One turn of the transcript. Memoised so a settled turn does not re-render
 * while a later one streams: the SDK clones only the streaming message, so the
 * messages of settled turns keep their references — compared one by one,
 * since the list holding them is rebuilt per render — and only the streaming
 * turn carries `streaming`. Even were a settled turn to re-render, its
 * `Markdown` is memoised on unchanged text and would not re-parse. The stream
 * itself is throttled at the source (`ChatPanel`'s `experimental_throttle`).
 */
const Turn = memo(
  function Turn({
    messages,
    streaming,
  }: {
    messages: UIMessage[];
    /** This is the answer being written right now: throttle its markdown. */
    streaming: boolean;
  }) {
    const [first] = messages;
    const mark = steerMark(first);
    return (
      <article
        aria-label={first.role === "user" ? "You" : "Tutor"}
        // A turn rises into place as it is added. The answer inside it is
        // written a token at a time and does not animate: the element is there
        // from the first token, and this only plays on the node React inserts.
        className={`transition-[opacity,translate] duration-(--motion-base) starting:translate-y-1.5 starting:opacity-0 ${
          first.role === "user"
            ? "ml-auto w-fit max-w-[85%] rounded-md bg-accent/10 px-3 py-2"
            : ""
        }`}
      >
        {first.role === "assistant" && (
          <Activity messages={messages} streaming={streaming} />
        )}
        {messages.flatMap((message) =>
          message.parts.map((part, index) => {
            if (part.type !== "text") return null;
            return message.role === "user" ? (
              <Question
                key={`${message.id}:${index}`}
                text={part.text}
                attached={attachedQuotes(message.metadata)}
              />
            ) : (
              <Markdown key={`${message.id}:${index}`} text={part.text} />
            );
          }),
        )}
        {/* Sent while the tutor answered, and not yet read by it. */}
        {(mark === "queued" || mark === "returned") && (
          <p className={`${LABEL_CLASS} mt-1`}>queued</p>
        )}
      </article>
    );
  },
  (before, after) =>
    before.streaming === after.streaming &&
    before.messages.length === after.messages.length &&
    before.messages.every((message, index) => message === after.messages[index]),
);

/**
 * The question is in and nothing has come back yet: three dots waiting where
 * the reply is about to be written. They go the moment the first token
 * arrives — from then on the answer appearing is itself the sign that
 * something is happening, and a second one beside it says nothing. The dots
 * are drawn here and paced in globals.css.
 */
function Waiting({ status }: { status: ChatStatus }) {
  const waiting = status === "submitted";

  return (
    // The region is mounted whether or not it has anything in it: a screen
    // reader that announces mutations inside a live region announces nothing
    // for one that arrives already filled. Empty it is out of flow, and it
    // carries its own gap up to the last turn rather than sitting in the
    // transcript's `space-y`, so an idle transcript does not end in a blank row.
    <p role="status" className={waiting ? "mt-4 py-1" : "sr-only"}>
      {waiting && (
        <>
          <span className="sr-only">the tutor is answering…</span>
          <span aria-hidden className="tutor-dots flex gap-1.5">
            <span className="tutor-dot size-1.5 rounded-full bg-faint" />
            <span className="tutor-dot size-1.5 rounded-full bg-faint" />
            <span className="tutor-dot size-1.5 rounded-full bg-faint" />
          </span>
        </>
      )}
    </p>
  );
}

export default function Messages({
  messages,
  chatId,
  status,
  column,
}: {
  messages: UIMessage[];
  /** Which conversation this is. The component is not remounted between two. */
  chatId: string;
  status: ChatStatus;
  /** The reading column, which the panel resizes. */
  column?: RefObject<HTMLDivElement | null>;
}) {
  const view = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  const grouped = turns(messages);

  // Reading something further up is the only thing that unpins the transcript,
  // and neither of the two below is that — so both put it back. Nothing else
  // would: the panel keeps this component mounted across a chat switch, a
  // /clear and every message after them, so the ref outlives them all.
  // Declared above the scroll, which is the order the effects run in.
  useEffect(() => {
    following.current = true;
  }, [chatId]);

  useEffect(() => {
    if (messages.at(-1)?.role === "user") following.current = true;
  }, [messages]);

  useEffect(() => {
    const box = view.current;
    if (box === null || !following.current) return;
    box.scrollTop = box.scrollHeight;
  }, [messages, status]);

  function onScroll(): void {
    const box = view.current;
    if (box === null) return;
    following.current = box.scrollHeight - box.scrollTop - box.clientHeight <= AT_END;
  }

  return (
    // Exactly one live region in here, the waiting indicator below, which says
    // one thing once. The answer itself has none: it arrives a token at a
    // time, and a transcript that announces itself on every one of them reads
    // the whole conversation out again per token. Each turn says who spoke,
    // which is what is needed.
    <div
      ref={view}
      onScroll={onScroll}
      // `overscroll-contain`: a stream that reaches the bottom must not chain
      // its scroll into the page behind the panel.
      className="flex-1 overflow-y-auto overscroll-contain px-4 py-3"
    >
      {/* The reading column: `ChatPanel` sets how wide, and drags it. */}
      <div ref={column} className="mx-auto max-w-(--chat-column)">
        <div className="space-y-4">
          {messages.length === 0 && (
            <p className="text-sm text-faint">
              Ask about what you are reading. <code>/clear</code> starts a new chat,{" "}
              <code>/compact</code> summarises this one.
            </p>
          )}
          {grouped.map((group, turn) => (
            <Turn
              // By position, not by id: the backend gives every stored question
              // of every chat the same id — it derives one from fields a
              // question has none of — so an id is not an identity here, and
              // React reconciles a list of duplicates by matching the wrong
              // nodes. A transcript is only ever appended to, which makes
              // position one.
              key={turn}
              messages={group}
              // The last turn, while the run streams, is the answer being
              // written: throttle its markdown. Everything above it is settled.
              streaming={
                status === "streaming" &&
                turn === grouped.length - 1 &&
                group[0].role === "assistant"
              }
            />
          ))}
        </div>
        <Waiting status={status} />
      </div>
    </div>
  );
}
