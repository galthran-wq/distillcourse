import { act } from "react";
import { afterEach, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ChatStatus, UIMessage } from "ai";
import Composer from "@/components/chat/Composer";
import Messages from "@/components/chat/Messages";
import { setDraft } from "@/lib/chat/stored";
import { LessonsProvider, type Lessons } from "@/lib/content/links";
import { SectionsProvider } from "@/lib/content/sections";
import type { LessonSections } from "@/lib/content/site";
import { mounted } from "./utils/dom";

/**
 * The site a chat test is had against: two courses, so that a row can need
 * saying which one it is in, and three lessons. The order is the order the
 * `@`-autocomplete offers them in.
 */
export const LESSONS: Lessons = {
  "lesson:us-history/indigenous-america": {
    title: "Indigenous America",
    course: "US history",
    href: "/courses/us-history/lessons/indigenous-america",
  },
  "lesson:us-history/european-empires": {
    title: "European empires",
    course: "US history",
    href: "/courses/us-history/lessons/european-empires",
  },
  "lesson:info-theory/entropy": {
    title: "Entropy",
    course: "Information theory",
    href: "/courses/info-theory/lessons/entropy",
  },
};

/** Where those lessons' sections are — what the autocomplete descends into. */
export const SECTIONS: LessonSections = {
  "lesson:us-history/indigenous-america": [
    { depth: 2, id: "cahokia", text: "Cahokia and the Mississippians" },
    { depth: 3, id: "the-mound", text: "The mound" },
    { depth: 2, id: "the-southwest", text: "The Southwest" },
  ],
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

export interface Composing {
  host: () => HTMLElement;
  /** Mount it. Busy is a run in flight: what is sent then steers it. */
  composer: (busy?: boolean) => void;
  field: () => HTMLTextAreaElement;
  /** A key the field itself answers: Enter, Escape, an arrow. */
  press: (key: string) => void;
  /** The rows whichever palette is open is offering. */
  options: () => HTMLElement[];
  /** …under the name each row carries. */
  listed: () => string[];
  /** A reader arriving at a composer that already holds a draft, as a reload does. */
  reloads: (draft: string) => void;
  /** What the composer handed the widget, in the order it was sent. */
  sent: string[];
  /** How many times the reader asked for the run to stop. */
  stops: () => number;
}

/**
 * A mounted composer inside the lesson set and the section index, remade before
 * each test and with the draft it leaves behind cleared after one — the draft
 * outlives the tab, so without that it outlives the test too.
 *
 * Call it at the top level of a `@vitest-environment jsdom` file or of one
 * describe in it, which is where the hooks it registers belong.
 * `stubResizeObserver` stays the caller's: the composer watches its own width,
 * and so do other things a file may be mounting.
 */
export function composing(): Composing {
  const dom = mounted();
  const sent: string[] = [];
  let stops = 0;

  const composer = (busy = false): void => {
    act(() =>
      dom.render(
        <SectionsProvider value={SECTIONS}>
          <LessonsProvider value={LESSONS}>
            <Composer
              busy={busy}
              onStop={() => {
                stops += 1;
              }}
              onSubmit={(text) => {
                sent.push(text);
              }}
              models={[
                {
                  openrouter_id: "moonshotai/kimi-k3",
                  display_name: "Kimi K3",
                  context_window: 200000,
                },
              ]}
              model="moonshotai/kimi-k3"
              onModel={() => {}}
            />
          </LessonsProvider>
        </SectionsProvider>,
      ),
    );
  };

  const field = (): HTMLTextAreaElement => {
    const box = dom.host().querySelector("textarea");
    if (box === null) throw new Error("the composer has no field");
    return box;
  };

  const options = (): HTMLElement[] => [
    ...dom.host().querySelectorAll<HTMLElement>('[role="option"]'),
  ];

  beforeEach(() => {
    // The same array throughout, so a caller can hold on to it.
    sent.length = 0;
    stops = 0;
    composer();
  });

  afterEach(() => {
    setDraft("");
    window.localStorage.clear();
  });

  return {
    host: dom.host,
    composer,
    stops: () => stops,
    field,
    press: (key) =>
      act(() =>
        field().dispatchEvent(
          new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
        ),
      ),
    options,
    listed: () => options().map((row) => row.querySelector("span")?.textContent ?? ""),
    reloads: (draft) => {
      // Unmounted first: the draft coming back is a fresh mount reading it, not
      // this composer being told about it.
      act(() => dom.render(null));
      setDraft(draft);
      composer();
    },
    sent,
  };
}
