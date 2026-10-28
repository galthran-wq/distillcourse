// @vitest-environment jsdom
import { act } from "react";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { parse, stringify } from "yaml";
import ModuleFolds, { type ModuleFold } from "@/components/progress/ModuleFolds";
import { splitLead } from "@/lib/content/intro";
import type { Standing } from "@/lib/progress/api";
import { ProgressProvider } from "@/lib/progress/context";
import { byLesson, moduleFolds } from "@/lib/progress/summary";
import { mounted } from "./utils/dom";
import { stubFetch } from "./utils/fetch";

const auth = vi.hoisted(() => ({ status: "signed-in" as "signed-in" | "anonymous" }));

vi.mock("@/lib/auth/store", () => ({
  useAuth: () =>
    auth.status === "signed-in"
      ? { status: "signed-in", user: { id: "8a1f" } }
      : { status: "anonymous", user: null },
}));

// Readable lessons per module; module 3's only lesson is planned, so it has none.
const MODULES = [
  [
    { slug: "framing", title: "Framing" },
    { slug: "density", title: "Density" },
  ],
  [
    { slug: "forest", title: "Isolation forest" },
    { slug: "one-class", title: "One-class" },
  ],
  [],
  [{ slug: "benchmark", title: "Benchmark" }],
];

function read(...slugs: string[]): Standing[] {
  return slugs.map((slug) => ({
    lesson: `fraud-ml/${slug}`,
    state: "read",
    last_seen: "2026-10-01T10:00:00Z",
  }));
}

describe("which module opens by default", () => {
  it("is the first for an anonymous reader, or before progress arrives", () => {
    expect(moduleFolds("fraud-ml", MODULES, null)).toEqual({
      open: 0,
      done: [false, false, false, false],
    });
  });

  it("is the first for a reader who has not started this course", () => {
    const elsewhere = byLesson([
      { lesson: "nietzsche/drives", state: "read", last_seen: "2026-10-01T10:00:00Z" },
    ]);
    expect(moduleFolds("fraud-ml", MODULES, elsewhere).open).toBe(0);
  });

  it("is the one holding the next unread lesson; read modules are done", () => {
    const folds = moduleFolds("fraud-ml", MODULES, byLesson(read("framing", "density", "forest")));
    expect(folds).toEqual({ open: 1, done: [true, false, false, false] });
  });

  it("skips past a module with nothing readable, which is never done", () => {
    const folds = moduleFolds(
      "fraud-ml",
      MODULES,
      byLesson(read("framing", "density", "forest", "one-class")),
    );
    expect(folds).toEqual({ open: 3, done: [true, true, false, false] });
  });

  it("does not count a started lesson as read", () => {
    const standings = byLesson([
      ...read("framing"),
      { lesson: "fraud-ml/density", state: "started", last_seen: "2026-10-02T10:00:00Z" },
    ]);
    expect(moduleFolds("fraud-ml", MODULES, standings)).toEqual({
      open: 0,
      done: [false, false, false, false],
    });
  });

  it("is none once everything readable is read", () => {
    const all = byLesson(read("framing", "density", "forest", "one-class", "benchmark"));
    expect(moduleFolds("fraud-ml", MODULES, all)).toEqual({
      open: null,
      done: [true, true, false, true],
    });
  });
});

describe("the module folds", () => {
  const { host, render } = mounted();

  const FOLDS: ModuleFold[] = MODULES.map((readable, i) => ({
    slug: `m${i}`,
    readable,
    planned: readable.length === 0,
    heading: <h2>Module {i + 1}</h2>,
    extent: `${readable.length} lessons`,
    lessons: (
      <ol>
        {readable.map((lesson) => (
          <li key={lesson.slug}>{lesson.title}</li>
        ))}
      </ol>
    ),
  }));

  const opened = () => [...host().querySelectorAll("details")].map((d) => d.open);

  beforeEach(() => {
    auth.status = "signed-in";
  });

  it("opens the first module for an anonymous reader and keeps folded rows in the page", async () => {
    auth.status = "anonymous";
    stubFetch([]);

    await act(async () =>
      render(
        <ProgressProvider course="fraud-ml">
          <ModuleFolds course="fraud-ml" modules={FOLDS} />
        </ProgressProvider>,
      ),
    );

    expect(opened()).toEqual([true, false, false, false]);
    expect(host().querySelectorAll("li")).toHaveLength(5);
    expect(host().textContent).not.toContain("done");
  });

  it("moves the open module to where the reader picks up and marks finished ones done", async () => {
    stubFetch(read("framing", "density"));

    await act(async () =>
      render(
        <ProgressProvider course="fraud-ml">
          <ModuleFolds course="fraud-ml" modules={FOLDS} />
        </ProgressProvider>,
      ),
    );

    expect(opened()).toEqual([false, true, false, false]);
    const summaries = [...host().querySelectorAll("summary")].map((s) => s.textContent);
    expect(summaries[0]).toContain("✓ done");
    expect(summaries[1]).not.toContain("done");
  });

  it("shades a module with nothing written yet, and says nothing about it", async () => {
    auth.status = "anonymous";
    stubFetch([]);

    await act(async () =>
      render(
        <ProgressProvider course="fraud-ml">
          <ModuleFolds course="fraud-ml" modules={FOLDS} />
        </ProgressProvider>,
      ),
    );

    const summaries = [...host().querySelectorAll("summary")];
    expect(summaries.map((s) => s.classList.contains("text-faint"))).toEqual([
      false,
      false,
      true,
      false,
    ]);
    expect(summaries[2].textContent).not.toMatch(/planned|written/i);
  });
});

describe("the course introduction's lead", () => {
  it("is the first paragraph, and the rest is everything else in order", () => {
    const source = "First, with $x^2$ in it.\n\n<Figure src=\"./a.png\" alt=\"A\" />\n\nSecond.\n\n- a list";
    expect(splitLead(source)).toEqual({
      lead: "First, with $x^2$ in it.",
      rest: '<Figure src="./a.png" alt="A" />\n\nSecond.\n\n- a list',
    });
  });

  it("skips what comes before the first paragraph, leaving it in the rest", () => {
    const source = "$$\nE = mc^2\n$$\n\nThe lead.\n\nMore.";
    const { lead, rest } = splitLead(source);
    expect(lead).toBe("The lead.");
    expect(rest.split(/\n{2,}/)).toEqual(["$$\nE = mc^2\n$$", "More."]);
  });

  it("is the whole introduction when it is one paragraph", () => {
    const source = "One paragraph,\nwrapped over\nthree lines.\n";
    expect(splitLead(source)).toEqual({
      lead: "One paragraph,\nwrapped over\nthree lines.",
      rest: "",
    });
  });
});

/**
 * The page itself, rendered off a content root of its own: the lint fixture
 * (a drafted lesson, a planned one, a drafted lab) plus a part whose only
 * lesson is planned, in preview mode — the mode production runs in, and the
 * one that used to put each lesson's status on its row. Both have to be set
 * before the page is imported: the content root is read once, at load.
 */
describe("the course page", () => {
  const root = mkdtempSync(join(tmpdir(), "course-page-"));
  const dir = join(root, "courses", "lint-course");
  cpSync(join(__dirname, "fixtures", "lint-course"), dir, { recursive: true });
  const course = parse(readFileSync(join(dir, "course.yaml"), "utf8"));
  course.modules.push({
    slug: "later",
    title: "Later",
    outcomes: ["co-surprisal"],
    lessons: [
      {
        ...course.modules[0].lessons[1],
        slug: "later-on",
        title: "Later on",
        est_minutes: 25,
      },
    ],
  });
  writeFileSync(join(dir, "course.yaml"), stringify(course));
  vi.stubEnv("CONTENT_ROOT", root);
  vi.stubEnv("CONTENT_PREVIEW", "1");
  afterAll(() => {
    rmSync(root, { recursive: true, force: true });
    vi.unstubAllEnvs();
  });

  // The first import compiles the page and everything under it, which can
  // outlast a test's own timeout on a loaded machine.
  let CoursePage: typeof import("@/app/courses/[course]/page").default;
  beforeAll(async () => {
    CoursePage = (await import("@/app/courses/[course]/page")).default;
  }, 60_000);

  const { host, render } = mounted();

  async function open(): Promise<void> {
    const page = await CoursePage({ params: Promise.resolve({ course: "lint-course" }) });
    await act(async () => render(page));
  }

  const quiet = () => host().querySelector("header p:last-child")!.textContent;
  const row = (title: string) =>
    [...host().querySelectorAll("#contents li")].find((li) => li.textContent!.includes(title))!;

  beforeEach(() => {
    auth.status = "anonymous";
    stubFetch([]);
  });

  it("shows no authoring state anywhere", async () => {
    await open();

    expect(host().textContent).not.toMatch(/drafted|reviewed|published|written|planned/i);
    expect(host().innerHTML).not.toContain("font-mono");
  });

  it("leads with the contents, then the introduction and About, then the sources", async () => {
    await open();

    const blocks = [...host().firstElementChild!.children].map(
      (el) => el.id || el.tagName.toLowerCase(),
    );
    expect(blocks).toEqual(["header", "contents", "about", "section"]);
    const about = host().querySelector("#about")!;
    expect(about.firstElementChild!.querySelector(".course-intro")?.textContent).toBe(
      "Fixture course intro.",
    );
    expect(about.lastElementChild!.querySelector("summary")?.textContent).toBe(
      "About this course",
    );
  });

  it("counts every lesson in the quiet line, written or not, and a lab by its hours", async () => {
    await open();

    // 7 + 8 + 3 h + 25 is 220 minutes.
    expect(quiet()).toBe("2 parts · 4 lessons · ~4 h · About this course ↓");
    expect(host().querySelector('header a[href="#about"]')).not.toBeNull();
  });

  it("shades a lesson that is not written: no link, no picture, a tooltip", async () => {
    await open();

    const planned = row("Where surprisal leads");
    expect(planned.querySelector("a")).toBeNull();
    expect(planned.querySelector("img")).toBeNull();
    expect(planned.querySelector("[title]")?.getAttribute("title")).toBe("Not written yet");
    expect(row("Measuring surprise").querySelector("a")?.getAttribute("href")).toBe(
      "/courses/lint-course/lessons/intro-surprise",
    );
  });

  it("shades a part with nothing written in it", async () => {
    await open();

    const summaries = [...host().querySelectorAll("#contents summary")];
    expect(summaries.map((s) => s.classList.contains("text-faint"))).toEqual([false, true]);
  });

  it("puts a drawn thumbnail through the theme's figure filter, on no white ground", async () => {
    await open();

    const thumb = row("Measuring surprise").querySelector("img")!;
    expect(thumb.className).toContain("[filter:var(--fig-filter)]");
    expect(host().innerHTML).not.toContain("bg-white");
    // And none on a phone, where the title takes the row's width.
    expect(thumb.parentElement!.className).toContain("max-sm:hidden");
  });

  it("starts an anonymous reader at the first written lesson", async () => {
    await open();

    expect(row("Measuring surprise").firstElementChild!.textContent).toBe("Start here");
    expect(host().textContent).not.toContain("Continue here");
  });

  it("continues a reader where they left off and counts what they have read", async () => {
    auth.status = "signed-in";
    stubFetch([
      { lesson: "lint-course/intro-surprise", state: "read", last_seen: "2026-10-01T10:00:00Z" },
    ]);

    await open();

    expect(quiet()).toBe("2 parts · 4 lessons · ~4 h · 1 of 2 read · About this course ↓");
    expect(row("Lab: surprisal").firstElementChild!.textContent).toBe("Continue here");
    expect(host().textContent).not.toContain("Start here");
  });
});
