// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Activity from "@/components/profile/Activity";
import type { LessonLink } from "@/lib/content/site";
import type { Visit } from "@/lib/lessons/api";
import { DAYS, WEEKS, key, month, squares, tone } from "@/lib/telemetry/activity";
import { getActivity, type ActivityDay } from "@/lib/telemetry/api";

vi.mock("@/lib/telemetry/api", () => ({ getActivity: vi.fn() }));
vi.mock("@/lib/auth/store", () => ({
  useAuth: () => ({ status: "signed-in", user: { id: "8a1f" } }),
}));

const LESSON = "lesson:information-theory/entropy";
const LINKS: Record<string, LessonLink> = {
  [LESSON]: {
    title: "What entropy measures",
    course: "Information theory",
    href: "/courses/information-theory/lessons/entropy",
  },
};

describe("the grid a year of reading is drawn on", () => {
  it("is full weeks, Monday first, ending with this one", () => {
    const cells = squares([], new Date(2026, 7, 6));

    expect(cells).toHaveLength(WEEKS * DAYS);
    expect(cells[0].date.getDay()).toBe(1);
    // Sunday of the current week: the column the reader is living in is whole.
    expect(cells[cells.length - 1].date.getDay()).toBe(0);
    expect(key(cells[cells.length - 1].date)).toBe("2026-08-09");
  });

  it("takes the count of a day it covers and drops one it does not", () => {
    const today = new Date(2026, 7, 6);

    const cells = squares(
      [
        { date: "2026-08-06", count: 3 },
        { date: "2001-01-01", count: 9 },
      ],
      today,
    );

    expect(cells.find((cell) => cell.key === key(today))?.count).toBe(3);
    expect(cells.reduce((sum, cell) => sum + cell.count, 0)).toBe(3);
  });

  it("names a month on the column that opens it, and only there", () => {
    const cells = squares([], new Date(2026, 7, 6));

    const named = Array.from({ length: WEEKS }, (_, week) => month(cells, week));

    // Fifty-three weeks from a Monday in August reach into thirteen months.
    expect(named.filter((name) => name !== null)).toHaveLength(13);
    // The column that opens August is named; the ones inside July are not.
    expect(named[52]).not.toBeNull();
    expect(named[50]).toBeNull();
  });

  it("darkens with the count and then stops", () => {
    expect(tone(0)).toBe("var(--line)");
    expect(new Set([tone(1), tone(2), tone(3), tone(4)]).size).toBe(4);
    expect(tone(9)).toBe(tone(4));
  });
});

let root: Root;
let host: HTMLElement;

function render(days: ActivityDay[], history: Visit[] | null = []): Promise<void> {
  vi.mocked(getActivity).mockResolvedValue({ days });
  return act(async () => {
    root.render(<Activity lessons={LINKS} history={history} />);
  });
}

/** Every square the grid drew; a square is the only thing here with a tooltip. */
function drawn(): HTMLElement[] {
  return [...host.querySelectorAll<HTMLElement>("[title]")];
}

/** Tomorrow as the API dates a day, which is a day the browser has not reached. */
function tomorrow(): string {
  const at = new Date();
  at.setDate(at.getDate() + 1);
  return key(at);
}

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
    true;
  // The panel draws itself against "now", so the suite pins one: a Thursday,
  // where tomorrow is still a square of the week the grid ends on.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 7, 6, 12));
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.useRealTimers();
  vi.mocked(getActivity).mockReset();
});

describe("the activity panel", () => {
  it("draws every day up to today, and says what a square is worth", async () => {
    await render([{ date: key(new Date()), count: 3 }]);

    const grid = drawn();
    // A year of squares, less the days of this week that have not happened.
    expect(grid.length).toBeGreaterThan(WEEKS * DAYS - DAYS);
    expect(grid.length).toBeLessThanOrEqual(WEEKS * DAYS);
    // The last square drawn is today's, and the first is a year behind it.
    expect(grid.at(-1)?.title).toMatch(/^3 lessons — /);
    expect(grid[0].title).toMatch(/^0 lessons — /);
  });

  it("keeps a square the browser calls tomorrow when something was read on it", async () => {
    // The counts are dated in the zone stored against the account; a reader
    // east of the browser's own can have a square dated past its today.
    await render([{ date: tomorrow(), count: 1 }]);

    expect(drawn().at(-1)?.title).toMatch(/^1 lesson — /);
  });

  it("lists what was read lately, linked where the site still has it", async () => {
    await render(
      [],
      [
        { lesson: LESSON, last_seen: "2026-08-06T09:00:00Z", completed_at: null },
        {
          lesson: "lesson:gone/away",
          last_seen: "2026-08-01T09:00:00Z",
          completed_at: "2026-08-01T09:30:00Z",
        },
      ],
    );

    const rows = [...host.querySelectorAll("li")].map((row) => row.textContent);
    // The site's own build names a lesson it still has; the locator is what is
    // left when it does not.
    expect(host.querySelector("a")?.getAttribute("href")).toBe(LINKS[LESSON].href);
    expect(rows[0]).toContain("What entropy measures");
    expect(rows[0]).not.toContain("completed");
    expect(rows[1]).toContain("lesson:gone/away");
    // A lesson read through says so, which is the only thing the note adds.
    expect(rows[1]).toContain("· completed");
  });

  it("shows a brand-new reader an empty grid and no feed", async () => {
    await render([], []);

    expect(drawn().length).toBeGreaterThan(0);
    expect(host.querySelectorAll("li")).toHaveLength(0);
    expect(host.textContent).toContain("No lessons read yet.");
  });

  it("holds the recently-read list back until the profile has answered", async () => {
    await render([], null);

    expect(drawn().length).toBeGreaterThan(0);
    expect(host.textContent).not.toContain("No lessons read yet.");
  });

  it("draws nothing at all when the grid cannot be loaded", async () => {
    vi.mocked(getActivity).mockRejectedValue(new Error("502"));

    await act(async () => {
      root.render(<Activity lessons={LINKS} history={[]} />);
    });

    // A year of blank squares would be a lie about a reader who may have read
    // every day of it.
    expect(host.textContent).toBe("");
  });
});
