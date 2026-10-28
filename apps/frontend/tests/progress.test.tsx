// @vitest-environment jsdom
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CourseProgress from "@/components/progress/CourseProgress";
import LessonMark from "@/components/progress/LessonMark";
import { getProgress, type Standing } from "@/lib/progress/api";
import { ProgressProvider } from "@/lib/progress/context";
import { byLesson, courseProgress } from "@/lib/progress/summary";
import { mounted } from "./utils/dom";
import { requestOf, stubFetch } from "./utils/fetch";

const auth = vi.hoisted(() => ({ status: "signed-in" as "signed-in" | "anonymous" }));

vi.mock("@/lib/auth/store", () => ({
  useAuth: () =>
    auth.status === "signed-in"
      ? { status: "signed-in", user: { id: "8a1f" } }
      : { status: "anonymous", user: null },
}));

const LESSONS = [
  { slug: "framing", title: "Framing the problem" },
  { slug: "density", title: "Density scores" },
  { slug: "isolation-forest", title: "Isolation forest" },
];

function standing(lesson: string, state: Standing["state"], last_seen: string): Standing {
  return { lesson, state, last_seen };
}

describe("the progress client", () => {
  it("asks for one course", async () => {
    const one = stubFetch([]);
    await getProgress("fraud-ml");
    expect(requestOf(one)[0]).toBe("/api/v1/progress?course=fraud-ml");
  });
});

describe("how far a reader is through a course", () => {
  it("counts read lessons over the readable ones and continues at the first unread", () => {
    const progress = courseProgress(
      "fraud-ml",
      LESSONS,
      byLesson([
        standing("fraud-ml/framing", "read", "2026-10-01T10:00:00Z"),
        // Started is not read: it is where the reader picks up.
        standing("fraud-ml/density", "started", "2026-10-02T10:00:00Z"),
        standing("fraud-ml/isolation-forest", "read", "2026-10-03T10:00:00Z"),
        // A lesson that is not readable here (planned, unpublished) counts for nothing.
        standing("fraud-ml/one-class", "read", "2026-10-04T10:00:00Z"),
      ]),
    );

    expect(progress).toEqual({
      read: 2,
      total: 3,
      next: LESSONS[1],
    });
  });

  it("is nothing for a course the reader has not opened", () => {
    const other = byLesson([standing("nietzsche/drives", "read", "2026-10-01T10:00:00Z")]);
    expect(courseProgress("fraud-ml", LESSONS, other)).toBeNull();
  });

  it("has nowhere to continue once everything readable is read", () => {
    const all = byLesson(
      LESSONS.map((l) => standing(`fraud-ml/${l.slug}`, "read", "2026-10-01T10:00:00Z")),
    );
    expect(courseProgress("fraud-ml", LESSONS, all)?.next).toBeUndefined();
  });

});

const { host, render } = mounted();

async function mount(tree: React.ReactNode): Promise<void> {
  await act(async () => render(tree));
}

describe("the course page", () => {
  beforeEach(() => {
    auth.status = "signed-in";
  });

  it("marks read and started lessons, leaves unopened ones bare and heads the page with the count", async () => {
    const fetch = stubFetch([
      standing("fraud-ml/framing", "read", "2026-10-03T10:00:00Z"),
      standing("fraud-ml/density", "started", "2026-10-02T10:00:00Z"),
    ]);

    await mount(
      <ProgressProvider course="fraud-ml">
        <CourseProgress course="fraud-ml" lessons={LESSONS} />
        {LESSONS.map((l) => (
          <p key={l.slug} data-lesson={l.slug}>
            <LessonMark lesson={`fraud-ml/${l.slug}`} />
          </p>
        ))}
      </ProgressProvider>,
    );

    expect(requestOf(fetch)[0]).toBe("/api/v1/progress?course=fraud-ml");
    const mark = (slug: string) => host().querySelector(`[data-lesson="${slug}"]`)!;
    expect(mark("framing").querySelector('[title="Read"]')?.textContent).toBe("✓");
    expect(mark("density").querySelector('[title="Started"]')).not.toBeNull();
    expect(mark("isolation-forest").childElementCount).toBe(0);
    expect(host().textContent).toContain("1 of 3 read");
  });

  it("takes the marks off when the reader signs out", async () => {
    stubFetch([standing("fraud-ml/framing", "read", "2026-10-03T10:00:00Z")]);
    // A fresh element each time: the mocked auth is not a store that notifies,
    // so the second mount is what tells the tree the reader is gone.
    const tree = () => (
      <ProgressProvider course="fraud-ml">
        <CourseProgress course="fraud-ml" lessons={LESSONS} />
        <LessonMark lesson="fraud-ml/framing" />
      </ProgressProvider>
    );
    await mount(tree());
    expect(host().textContent).toContain("1 of 3 read");

    auth.status = "anonymous";
    await mount(tree());

    expect(host().querySelector('[title="Read"]')).toBeNull();
    expect(host().textContent).not.toContain("read");
  });

  it("points an anonymous reader at the first lesson and marks nothing", async () => {
    auth.status = "anonymous";
    stubFetch([]);

    await mount(
      <ProgressProvider course="fraud-ml">
        <CourseProgress course="fraud-ml" lessons={LESSONS} />
        <LessonMark lesson="fraud-ml/framing" />
      </ProgressProvider>,
    );

    const start = host().querySelector("a");
    expect(start?.getAttribute("href")).toBe("/courses/fraud-ml/lessons/framing");
    expect(host().textContent).toBe("Start with: Framing the problem");
  });

  it("points a signed-in reader who has not started at the first lesson too", async () => {
    stubFetch([standing("nietzsche/drives", "read", "2026-10-01T10:00:00Z")]);

    await mount(
      <ProgressProvider course="fraud-ml">
        <CourseProgress course="fraud-ml" lessons={LESSONS} />
      </ProgressProvider>,
    );

    expect(host().textContent).toBe("Start with: Framing the problem");
  });

  it("has no start line for a course with nothing to read yet", async () => {
    auth.status = "anonymous";

    await mount(
      <ProgressProvider course="fraud-ml">
        <CourseProgress course="fraud-ml" lessons={[]} />
      </ProgressProvider>,
    );

    expect(host().innerHTML).toBe("");
  });
});
