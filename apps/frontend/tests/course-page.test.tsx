// @vitest-environment jsdom
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
