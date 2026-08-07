import { act } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ChatStatus, UIMessage } from "ai";
import Messages from "@/components/chat/Messages";
import { LessonsProvider, type Lessons } from "@/lib/content/links";
import { SectionsProvider } from "@/lib/content/sections";
import type { LessonSections } from "@/lib/content/site";
import { mounted } from "./utils/dom";

/** The lesson set a reference in a test message is resolved against. */
export const LESSONS: Lessons = {
  "lesson:info-theory/entropy": {
    title: "Entropy",
    course: "Information theory",
    href: "/courses/info-theory/lessons/entropy",
  },
};

/** Where that lesson's sections are — what the `@`-autocomplete narrows over. */
export const SECTIONS: LessonSections = {
  "lesson:info-theory/entropy": [
    { depth: 2, id: "the-average", text: "The average surprisal" },
  ],
};

/** The conversation these messages are in, where a test does not name one. */
const CHAT = "c1";

let sent = 0;

export function turn(role: UIMessage["role"], ...parts: UIMessage["parts"]): UIMessage {
  sent += 1;
  return { id: `m${sent}`, role, parts };
}

/**
 * A conversation as a page renders it — inside the lesson set and the section
 * index, because every page of the site has both: a test that renders without
 * them is testing a situation the site does not have.
 */
function transcript(
  messages: UIMessage[],
  lessons: Lessons,
  sections: LessonSections,
  chatId: string,
  status: ChatStatus,
) {
  return (
    <SectionsProvider value={sections}>
      <LessonsProvider value={lessons}>
        <Messages messages={messages} chatId={chatId} status={status} />
      </LessonsProvider>
    </SectionsProvider>
  );
}

/**
 * That conversation as markup: what a test about what a message renders as.
 * The extras are named rather than positional — some tests want one, some
 * another, and no order would spare the rest from restating a default to
 * reach past it.
 */
export function rendered(
  messages: UIMessage[],
  {
    lessons = LESSONS,
    sections = SECTIONS,
    status = "ready",
  }: { lessons?: Lessons; sections?: LessonSections; status?: ChatStatus } = {},
): string {
  return renderToStaticMarkup(transcript(messages, lessons, sections, CHAT, status));
}

/**
 * That conversation in a real DOM, for the tests about what only a browser
 * has: scrolling, and the nodes React keeps between one render and the next.
 */
export function shown(): {
  host: () => HTMLElement;
  show: (messages: UIMessage[], chatId?: string, status?: ChatStatus) => void;
} {
  const dom = mounted();
  return {
    host: dom.host,
    show: (messages, chatId = CHAT, status = "ready") =>
      act(() => dom.render(transcript(messages, LESSONS, SECTIONS, chatId, status))),
  };
}
