import { act } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { UIMessage } from "ai";
import Messages from "@/components/chat/Messages";
import { LessonsProvider, type Lessons } from "@/lib/content/links";
import { mounted } from "./utils/dom";

/** The lesson set a reference in a test message is resolved against. */
export const LESSONS: Lessons = {
  "lesson:info-theory/entropy": {
    title: "Entropy",
    course: "Information theory",
    href: "/courses/info-theory/lessons/entropy",
  },
};

/** The conversation these messages are in, where a test does not name one. */
const CHAT = "c1";

let sent = 0;

export function turn(role: UIMessage["role"], ...parts: UIMessage["parts"]): UIMessage {
  sent += 1;
  return { id: `m${sent}`, role, parts };
}

/**
 * A conversation as a page renders it — inside the lesson set, because every
 * page of the site has one: a test that renders without it is testing a
 * situation the site does not have.
 */
function transcript(messages: UIMessage[], lessons: Lessons, chatId: string) {
  return (
    <LessonsProvider value={lessons}>
      <Messages messages={messages} chatId={chatId} status="ready" />
    </LessonsProvider>
  );
}

/** That conversation as markup: what a test about what a message renders as. */
export function rendered(messages: UIMessage[], lessons: Lessons = LESSONS): string {
  return renderToStaticMarkup(transcript(messages, lessons, CHAT));
}

/**
 * That conversation in a real DOM, for the tests about what only a browser
 * has: scrolling, and the nodes React keeps between one render and the next.
 */
export function shown(): {
  host: () => HTMLElement;
  show: (messages: UIMessage[], chatId?: string) => void;
} {
  const dom = mounted();
  return {
    host: dom.host,
    show: (messages, chatId = CHAT) =>
      act(() => dom.render(transcript(messages, LESSONS, chatId))),
  };
}
