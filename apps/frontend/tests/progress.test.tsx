// @vitest-environment jsdom
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CourseList, { type CourseCard } from "@/components/progress/CourseList";
import CourseReadCount from "@/components/progress/CourseReadCount";
import LessonMark from "@/components/progress/LessonMark";
import StartHere from "@/components/progress/StartHere";
import { getProgress, type Standing } from "@/lib/progress/api";
import { ProgressProvider } from "@/lib/progress/context";
import { byLesson, courseProgress, startedFirst } from "@/lib/progress/summary";
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
  it("asks for every course, or for one", async () => {
    const all = stubFetch([]);
    await getProgress("");
    expect(requestOf(all)[0]).toBe("/api/v1/progress");

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
      lastSeen: Date.parse("2026-10-03T10:00:00Z"),
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

  it("puts started courses first, most recent first, and leaves the rest in order", () => {
    const seen: Record<string, number | undefined> = { b: 1, d: 5 };
    const order = startedFirst(["a", "b", "c", "d"], (course) =>
      seen[course] === undefined ? null : { read: 0, total: 1, lastSeen: seen[course] },
    );
    expect(order).toEqual(["d", "b", "a", "c"]);
  });
});

const { host, render } = mounted();

const CARDS: CourseCard[] = [
  { slug: "nietzsche", title: "Nietzsche", tagline: "Drives.", lessons: [LESSONS[0]] },
  { slug: "fraud-ml", title: "Fraud ML", tagline: "Anomalies.", lessons: LESSONS },
];

async function mount(tree: React.ReactNode): Promise<void> {
  await act(async () => render(tree));
}

describe("the course list", () => {
  beforeEach(() => {
    auth.status = "signed-in";
  });

  it("shows an anonymous reader the list as it is, with no progress and no request", async () => {
    auth.status = "anonymous";
    const fetch = stubFetch([]);

    await mount(
      <ProgressProvider>
        <CourseList courses={CARDS} />
      </ProgressProvider>,
    );

    expect(fetch).not.toHaveBeenCalled();
    expect([...host().querySelectorAll("li a")].map((a) => a.textContent)).toEqual([
      "Nietzsche",
      "Fraud ML",
    ]);
    expect(host().textContent).not.toMatch(/read|Continue/);
  });

  it("lists the reader's courses first, with their count and where to continue", async () => {
    stubFetch([
      standing("fraud-ml/framing", "read", "2026-10-03T10:00:00Z"),
      standing("fraud-ml/density", "started", "2026-10-02T10:00:00Z"),
    ]);

    await mount(
      <ProgressProvider>
        <CourseList courses={CARDS} />
      </ProgressProvider>,
    );

    const cards = [...host().querySelectorAll("li")];
    expect(cards[0].textContent).toContain("Fraud ML");
    expect(cards[0].textContent).toContain("1 of 3 read");
    const next = cards[0].querySelector('a[href="/courses/fraud-ml/lessons/density"]');
    expect(next?.textContent).toBe("Continue: Density scores");
    // An unstarted course carries nothing extra.
    expect(cards[1].textContent).not.toMatch(/read|Continue/);
  });
});

describe("the course page", () => {
  beforeEach(() => {
    auth.status = "signed-in";
  });

  // The contents as the page lays them out: one StartHere per lesson, each
  // carrying its mark, under the quiet line's read count.
  const page = (lessons = LESSONS) => (
    <ProgressProvider course="fraud-ml">
      <p data-quiet>
        58 lessons
        <CourseReadCount course="fraud-ml" lessons={lessons} />
      </p>
      <ol>
        {LESSONS.map((l) => (
          <StartHere key={l.slug} course="fraud-ml" lessons={lessons} slug={l.slug}>
            <span data-lesson={l.slug}>
              <LessonMark lesson={`fraud-ml/${l.slug}`} />
            </span>
          </StartHere>
        ))}
      </ol>
    </ProgressProvider>
  );

  const banded = () =>
    [...host().querySelectorAll("li")]
      .filter((li) => li.firstElementChild?.tagName === "P")
      .map((li) => ({
        label: li.firstElementChild!.textContent,
        lesson: li.querySelector("[data-lesson]")!.getAttribute("data-lesson"),
      }));
  const quiet = () => host().querySelector("[data-quiet]")!.textContent;

  it("marks read and started lessons, leaves unopened ones bare and counts what is read", async () => {
    const fetch = stubFetch([
      standing("fraud-ml/framing", "read", "2026-10-03T10:00:00Z"),
      standing("fraud-ml/density", "started", "2026-10-02T10:00:00Z"),
    ]);

    await mount(page());

    expect(requestOf(fetch)[0]).toBe("/api/v1/progress?course=fraud-ml");
    const mark = (slug: string) => host().querySelector(`[data-lesson="${slug}"]`)!;
    expect(mark("framing").querySelector('[title="Read"]')?.textContent).toBe("✓");
    expect(mark("density").querySelector('[title="Started"]')).not.toBeNull();
    expect(mark("isolation-forest").childElementCount).toBe(0);
    expect(quiet()).toBe("58 lessons · 1 of 3 read");
  });

  it("bands the next unread lesson as where to continue", async () => {
    stubFetch([
      standing("fraud-ml/framing", "read", "2026-10-03T10:00:00Z"),
      standing("fraud-ml/density", "started", "2026-10-02T10:00:00Z"),
    ]);

    await mount(page());

    expect(banded()).toEqual([{ label: "Continue here", lesson: "density" }]);
  });

  it("bands no row once everything readable is read", async () => {
    stubFetch(LESSONS.map((l) => standing(`fraud-ml/${l.slug}`, "read", "2026-10-03T10:00:00Z")));

    await mount(page());

    expect(banded()).toEqual([]);
    expect(quiet()).toBe("58 lessons · 3 of 3 read");
  });

  it("takes the marks and the count off when the reader signs out", async () => {
    stubFetch([standing("fraud-ml/framing", "read", "2026-10-03T10:00:00Z")]);
    // A fresh element each time: the mocked auth is not a store that notifies,
    // so the second mount is what tells the tree the reader is gone.
    await mount(page());
    expect(quiet()).toContain("1 of 3 read");

    auth.status = "anonymous";
    await mount(page());

    expect(host().querySelector('[title="Read"]')).toBeNull();
    expect(quiet()).toBe("58 lessons");
    expect(banded()).toEqual([{ label: "Start here", lesson: "framing" }]);
  });

  it("starts an anonymous reader at the first readable lesson and marks nothing", async () => {
    auth.status = "anonymous";
    stubFetch([]);

    // The first lesson in course order is not written yet: it is not readable,
    // so the band goes to the first one that is.
    await mount(page(LESSONS.slice(1)));

    expect(banded()).toEqual([{ label: "Start here", lesson: "density" }]);
    expect(quiet()).toBe("58 lessons");
  });

  it("starts a signed-in reader who has not opened this course at the first lesson too", async () => {
    stubFetch([standing("nietzsche/drives", "read", "2026-10-01T10:00:00Z")]);

    await mount(page());

    expect(banded()).toEqual([{ label: "Start here", lesson: "framing" }]);
    expect(quiet()).toBe("58 lessons");
  });

  it("bands nothing in a course with nothing to read yet", async () => {
    auth.status = "anonymous";

    await mount(page([]));

    expect(banded()).toEqual([]);
  });
});
