// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Activity from "@/components/profile/Activity";
import type { LessonLink } from "@/lib/content/site";
import { day } from "@/lib/day";
import {
  DAYS,
  WEEKS,
  group,
  key,
  month,
  sitting,
  squares,
  tone,
} from "@/lib/telemetry/activity";
import {
  getActivity,
  getActivityOn,
  type ActivityDay,
  type ActivityEntry,
} from "@/lib/telemetry/api";

vi.mock("@/lib/telemetry/api", () => ({
  getActivity: vi.fn(),
  getActivityOn: vi.fn(),
}));
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

function entry(date: string, over: Partial<ActivityEntry> = {}): ActivityEntry {
  return {
    date,
    lesson: LESSON,
    seconds: 2820,
    first_at: `${date}T09:12:00+00:00`,
    last_at: `${date}T10:04:00+00:00`,
    ...over,
  };
}

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
        { date: "2026-08-06", count: 3, minutes: 47 },
        { date: "2001-01-01", count: 9, minutes: 90 },
      ],
      today,
    );

    const square = cells.find((cell) => cell.key === key(today));
    expect([square?.count, square?.minutes]).toEqual([3, 47]);
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

describe("a line of the feed", () => {
  it("spans the reader's own clock, whatever the browser's is", () => {
    // +03:00, which jsdom's UTC would otherwise render as three hours earlier.
    expect(
      sitting(
        entry("2026-08-06", {
          first_at: "2026-08-06T09:12:00+03:00",
          last_at: "2026-08-06T10:04:00+03:00",
        }),
      ),
    ).toBe("09:12–10:04 · 47 min");
  });

  it("names one time when the reading was one moment, and never 0 min", () => {
    expect(
      sitting(
        entry("2026-08-06", {
          seconds: 20,
          first_at: "2026-08-06T09:12:00+00:00",
          last_at: "2026-08-06T09:12:00+00:00",
        }),
      ),
    ).toBe("09:12 · <1 min");
  });

  it("falls under the day it belongs to, and days keep the order they came in", () => {
    const feed = [
      entry("2026-08-06"),
      entry("2026-08-06", { lesson: "lesson:gone/away" }),
      entry("2026-08-04"),
    ];

    expect(group(feed).map(([date, lines]) => [date, lines.length])).toEqual([
      ["2026-08-06", 2],
      ["2026-08-04", 1],
    ]);
  });
});

let root: Root;
let host: HTMLElement;

function render(days: ActivityDay[], feed: ActivityEntry[] = []): Promise<void> {
  vi.mocked(getActivity).mockResolvedValue({ days, feed });
  return act(async () => {
    root.render(<Activity lessons={LINKS} />);
  });
}

/** Every square the grid drew; a square is the only button in this panel. */
function drawn(): HTMLElement[] {
  return [...host.querySelectorAll<HTMLElement>("[data-square]")];
}

function square(day: string): HTMLElement {
  const found = host.querySelector<HTMLElement>(`[data-square="${day}"]`);
  if (found === null) throw new Error(`no square for ${day}`);
  return found;
}

/** Tomorrow as the API dates a day, which is a day the browser has not reached. */
function tomorrow(): string {
  const at = new Date();
  at.setDate(at.getDate() + 1);
  return key(at);
}

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
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
  vi.mocked(getActivityOn).mockReset();
});

describe("the activity grid", () => {
  it("draws every day up to today, and says what a square is worth", async () => {
    await render([{ date: "2026-08-06", count: 3, minutes: 47 }]);

    const grid = drawn();
    // A year of squares, less the days of this week that have not happened.
    expect(grid.length).toBeGreaterThan(WEEKS * DAYS - DAYS);
    expect(grid.length).toBeLessThanOrEqual(WEEKS * DAYS);
    expect(grid.at(-1)?.getAttribute("aria-label")).toBe(
      `${day(new Date(2026, 7, 6))} · 3 lessons · 47 min`,
    );
    // A day nothing happened on says so rather than counting up to nothing.
    expect(grid[0].getAttribute("aria-label")).toMatch(/ · no reading$/);
  });

  it("keeps a square the browser calls tomorrow when something was read on it", async () => {
    // The counts are dated in the zone stored against the account; a reader
    // east of the browser's own can have a square dated past its today.
    await render([{ date: tomorrow(), count: 1, minutes: 6 }]);

    expect(drawn().at(-1)?.getAttribute("aria-label")).toContain("1 lesson · 6 min");
  });

  it("shows what a square is worth where the pointer is, and takes it away again", async () => {
    await render([{ date: "2026-08-06", count: 2, minutes: 47 }]);

    await act(async () => {
      square("2026-08-06").dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    });
    expect(host.querySelector("[role=tooltip]")?.textContent).toBe(
      `${day(new Date(2026, 7, 6))} · 2 lessons · 47 min`,
    );

    await act(async () => {
      square("2026-08-06").dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
    });
    expect(host.querySelector("[role=tooltip]")).toBeNull();
  });

  it("lets the keyboard reach a square", async () => {
    await render([{ date: "2026-08-06", count: 1, minutes: 9 }]);

    expect(square("2026-08-06").tagName).toBe("BUTTON");
  });
});

describe("the activity feed", () => {
  it("lists a day's reading under its date, linked where the site still has it", async () => {
    await render(
      [],
      [
        entry("2026-08-06"),
        entry("2026-08-04", { lesson: "lesson:gone/away", seconds: 300 }),
      ],
    );

    expect(host.querySelector("a")?.getAttribute("href")).toBe(LINKS[LESSON].href);
    const rows = [...host.querySelectorAll("li")].map((row) => row.textContent);
    expect(rows[0]).toContain("What entropy measures");
    expect(rows[0]).toContain("09:12–10:04 · 47 min");
    // The site's own build names a lesson it still has; the locator is what is
    // left when it does not.
    expect(rows[1]).toContain("lesson:gone/away");
    // A heading per day, newest first, naming the day on the reader's calendar
    // rather than the UTC midnight the date string would otherwise be read as.
    expect([...host.querySelectorAll("h3")].map((head) => head.textContent)).toEqual([
      day(new Date(2026, 7, 6)),
      day(new Date(2026, 7, 4)),
    ]);
  });

  it("shows the day a square was clicked on, and goes back on a second click", async () => {
    vi.mocked(getActivityOn).mockResolvedValue({
      feed: [entry("2026-08-04", { seconds: 600 })],
    });
    await render([{ date: "2026-08-04", count: 1, minutes: 10 }], [entry("2026-08-06")]);

    await act(async () => square("2026-08-04").click());

    expect(vi.mocked(getActivityOn)).toHaveBeenCalledWith("2026-08-04");
    expect(square("2026-08-04").getAttribute("aria-pressed")).toBe("true");
    expect(host.textContent).toContain("10 min");
    expect(host.textContent).not.toContain("47 min");

    await act(async () => square("2026-08-04").click());

    expect(square("2026-08-04").getAttribute("aria-pressed")).toBe("false");
    expect(host.textContent).toContain("47 min");
  });

  it("lets Escape put the recent feed back", async () => {
    vi.mocked(getActivityOn).mockResolvedValue({ feed: [] });
    await render([{ date: "2026-08-04", count: 1, minutes: 10 }], [entry("2026-08-06")]);

    await act(async () => square("2026-08-04").click());
    expect(host.textContent).toContain("Nothing read on this day.");

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    expect(host.textContent).toContain("47 min");
  });

  it("says nothing at all until the day it was asked for answers", async () => {
    vi.mocked(getActivityOn).mockReturnValue(new Promise(() => {}));
    await render([{ date: "2026-08-04", count: 1, minutes: 10 }], [entry("2026-08-06")]);

    await act(async () => square("2026-08-04").click());

    expect(host.querySelectorAll("li")).toHaveLength(0);
    expect(host.textContent).not.toContain("Nothing read on this day.");
  });

  it("shows a brand-new reader an empty grid and an empty feed", async () => {
    await render([], []);

    expect(drawn().length).toBeGreaterThan(0);
    expect(host.querySelectorAll("li")).toHaveLength(0);
    expect(host.textContent).toContain("No lessons read yet.");
  });

  it("draws nothing at all when the grid cannot be loaded", async () => {
    vi.mocked(getActivity).mockRejectedValue(new Error("502"));

    await act(async () => {
      root.render(<Activity lessons={LINKS} />);
    });

    // A year of blank squares would be a lie about a reader who may have read
    // every day of it.
    expect(host.textContent).toBe("");
  });
});
