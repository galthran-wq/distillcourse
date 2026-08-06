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
        { date: "2026-08-06", count: 3, seconds: 2820 },
        { date: "2001-01-01", count: 9, seconds: 5400 },
      ],
      today,
    );

    const square = cells.find((cell) => cell.key === key(today));
    expect([square?.count, square?.seconds]).toEqual([3, 2820]);
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

/** Every square the grid drew; the back button is not one of them. */
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
    await render([{ date: "2026-08-06", count: 3, seconds: 2820 }]);

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
    await render([{ date: tomorrow(), count: 1, seconds: 360 }]);

    expect(drawn().at(-1)?.getAttribute("aria-label")).toContain("1 lesson · 6 min");
  });

  it("keeps a tomorrow that was read on but earned nothing", async () => {
    // Under the bar, so no count — and still a day this reader spent reading,
    // which a bare span with no tooltip and no click on it would deny.
    await render([{ date: tomorrow(), count: 0, seconds: 200 }]);

    const last = drawn().at(-1);
    expect(last?.getAttribute("data-square")).toBe(tomorrow());
    expect(last?.getAttribute("aria-label")).toContain("3 min");
    expect(last?.getAttribute("aria-label")).not.toContain("no reading");
  });

  it("says a day under a minute was read rather than not", async () => {
    await render([{ date: "2026-08-06", count: 0, seconds: 20 }]);

    expect(square("2026-08-06").getAttribute("aria-label")).toBe(
      `${day(new Date(2026, 7, 6))} · <1 min`,
    );
  });

  it("shows what a square is worth while the pointer is on it, and takes it away again", async () => {
    await render([{ date: "2026-08-06", count: 2, seconds: 2820 }]);

    await act(async () => {
      square("2026-08-06").dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    });
    const tooltip = host.querySelector<HTMLElement>("[role=tooltip]");
    expect(tooltip?.textContent).toBe(
      `${day(new Date(2026, 7, 6))} · 2 lessons · 47 min`,
    );
    // Placed rather than left where the flow would put it; jsdom has no layout,
    // so where is not a question it can answer.
    expect(tooltip?.style.top).not.toBe("");

    await act(async () => {
      square("2026-08-06").dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
    });
    expect(host.querySelector("[role=tooltip]")).toBeNull();
  });

  it("says the same minute in the tooltip as in the line under it", async () => {
    // 2820s is 47 minutes either way; 150s is where two roundings of the same
    // reading would part company — "3 min" over a line saying "2 min".
    await render(
      [{ date: "2026-08-06", count: 1, seconds: 150 }],
      [entry("2026-08-06", { seconds: 150 })],
    );

    await act(async () => {
      square("2026-08-06").dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    });

    const said = host.querySelector("[role=tooltip]")?.textContent ?? "";
    const line = host.querySelector("li")?.textContent ?? "";
    expect(said).toContain("3 min");
    expect(line).toContain("3 min");
  });

  it("is one tab stop, opening on the most recent day and moving under the arrows", async () => {
    await render([{ date: "2026-08-06", count: 1, seconds: 540 }]);

    const grid = drawn();
    // A year of tab stops is a keyboard trap; the grid is one, and the arrows
    // move inside it.
    const stops = grid.filter((cell) => cell.tabIndex === 0);
    expect(stops).toHaveLength(1);
    expect(stops[0].getAttribute("data-square")).toBe("2026-08-06");

    // Reaching a square shows what it is worth, exactly as hovering it does.
    await act(async () => stops[0].focus());
    expect(host.querySelector("[role=tooltip]")?.textContent).toContain("9 min");

    // A week back, then a day up: the Wednesday of the week before.
    await act(async () => {
      stops[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    });
    expect(document.activeElement?.getAttribute("data-square")).toBe("2026-07-30");
    await act(async () => {
      document.activeElement?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }),
      );
    });
    expect(document.activeElement?.getAttribute("data-square")).toBe("2026-07-29");
  });

  it("opens the day the focused square stands for", async () => {
    vi.mocked(getActivityOn).mockResolvedValue([entry("2026-08-06", { seconds: 600 })]);
    await render([{ date: "2026-08-06", count: 1, seconds: 600 }]);

    // What Enter does to a focused button, which is why a square is one.
    const focused = square("2026-08-06");
    expect(focused.tagName).toBe("BUTTON");
    await act(async () => {
      focused.focus();
      focused.click();
    });

    expect(focused.getAttribute("aria-pressed")).toBe("true");
    expect(vi.mocked(getActivityOn)).toHaveBeenCalledWith("2026-08-06");
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
    vi.mocked(getActivityOn).mockResolvedValue([entry("2026-08-04", { seconds: 600 })]);
    await render([{ date: "2026-08-04", count: 1, seconds: 600 }], [entry("2026-08-06")]);

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
    vi.mocked(getActivityOn).mockResolvedValue([]);
    await render([{ date: "2026-08-04", count: 1, seconds: 600 }], [entry("2026-08-06")]);

    await act(async () => square("2026-08-04").click());
    expect(host.textContent).toContain("Nothing read on this day.");

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    expect(host.textContent).toContain("47 min");
  });

  it("says nothing at all until the day it was asked for answers", async () => {
    vi.mocked(getActivityOn).mockReturnValue(new Promise(() => {}));
    await render([{ date: "2026-08-04", count: 1, seconds: 600 }], [entry("2026-08-06")]);

    await act(async () => square("2026-08-04").click());

    expect(host.querySelectorAll("li")).toHaveLength(0);
    expect(host.textContent).not.toContain("Nothing read on this day.");
    expect(host.textContent).not.toContain("Couldn't load this day.");
  });

  it("says so when the day it was asked for cannot be loaded", async () => {
    vi.mocked(getActivityOn).mockRejectedValue(new Error("502"));
    await render([{ date: "2026-08-04", count: 1, seconds: 600 }], [entry("2026-08-06")]);

    await act(async () => square("2026-08-04").click());

    // A back button over nothing is what a request still in flight looks like.
    expect(host.textContent).toContain("Couldn't load this day.");
    expect(host.querySelectorAll("li")).toHaveLength(0);
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
