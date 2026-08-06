import { renderToStaticMarkup } from "react-dom/server";
import type { UIMessage } from "ai";
import Messages from "@/components/chat/Messages";
import { LessonsProvider, type Lessons } from "@/lib/content/links";

/** The lesson set a reference in a test message is resolved against. */
export const LESSONS: Lessons = {
  "lesson:info-theory/entropy": {
    title: "Entropy",
    course: "Information theory",
    href: "/courses/info-theory/lessons/entropy",
  },
};

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
export function rendered(messages: UIMessage[], lessons: Lessons = LESSONS): string {
  return renderToStaticMarkup(
    <LessonsProvider value={lessons}>
      <Messages messages={messages} status="ready" />
    </LessonsProvider>,
  );
}
