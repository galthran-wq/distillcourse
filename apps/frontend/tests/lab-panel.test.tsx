// @vitest-environment jsdom
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LabPanel from "@/components/labs/LabPanel";
import type { AuthState } from "@/lib/auth/store";
import type { LabSpec } from "@/lib/content/schema";
import {
  getLabManifest,
  getLabProgress,
  issuePairingCode,
  type CheckpointProgress,
  type LabProgress,
} from "@/lib/labs/api";
import { mounted } from "./utils/dom";

vi.mock("@/lib/labs/api", () => ({
  getLabProgress: vi.fn(),
  getLabManifest: vi.fn(),
  issuePairingCode: vi.fn(),
}));

let auth: AuthState;
vi.mock("@/lib/auth/store", () => ({ useAuth: () => auth }));

const LAB = "information-theory/surprisal-lab";
const KEY = `distillcourse.lab-checklist:${LAB}`;

const SPEC: LabSpec = {
  est_hours: 4,
  checkpoints: [
    {
      id: "surprisal",
      kind: "exact",
      text: "Implement surprisal(p) in bits",
      required: true,
    },
    {
      id: "entropy-terms",
      kind: "exact",
      text: "Return the per-outcome terms of the entropy sum",
      required: true,
    },
    {
      id: "beat-baseline",
      kind: "metric",
      text: "Rank the held-out sources",
      required: false,
    },
    {
      id: "why-uniform",
      kind: "review",
      text: "Argue why entropy is largest for the uniform distribution",
      required: false,
    },
  ],
};

function state(id: string, over: Partial<CheckpointProgress> = {}): CheckpointProgress {
  return {
    id,
    attempts: 1,
    passed_at: null,
    best_score: null,
    feedback: null,
    ...over,
  };
}

function progress(
  checkpoints: CheckpointProgress[],
  paired = true,
): LabProgress {
  return { checkpoints, paired };
}

const dom = mounted();
const writeText = vi.fn(async () => {});

/** jsdom has no matchMedia; the width is the one query the panel asks. */
function width(wide: boolean): void {
  window.matchMedia = ((query: string) => ({
    matches: query === "(min-width: 40rem)" && wide,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  auth = {
    status: "signed-in",
    user: { id: "8a1f", email: "reader@example.test", full_name: null, timezone: "UTC" },
  };
  vi.mocked(getLabProgress).mockResolvedValue(progress([]));
  vi.mocked(getLabManifest).mockResolvedValue({ checkpoints: [] });
  writeText.mockClear();
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
  visibility("visible");
  width(true);
  window.localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.mocked(getLabProgress).mockReset();
  vi.mocked(getLabManifest).mockReset();
  vi.mocked(issuePairingCode).mockReset();
});

function visibility(value: DocumentVisibilityState): void {
  Object.defineProperty(document, "visibilityState", {
    value,
    configurable: true,
  });
}

async function show(spec: LabSpec = SPEC): Promise<HTMLElement> {
  await act(async () => dom.render(<LabPanel lab={LAB} spec={spec} />));
  return dom.host();
}

function rowElements(host: HTMLElement): HTMLElement[] {
  return [...host.querySelectorAll<HTMLElement>("section > details li")];
}

function rows(host: HTMLElement): string[] {
  return rowElements(host).map((row) => row.textContent ?? "");
}

function mark(row: HTMLElement): string | null {
  return row.querySelector(".lab-mark")!.getAttribute("data-state");
}

function checklist(host: HTMLElement): HTMLDetailsElement {
  return host.querySelector<HTMLDetailsElement>("section > details")!;
}

function how(host: HTMLElement): HTMLDetailsElement {
  return host.querySelector<HTMLDetailsElement>("details")!;
}

function press(host: HTMLElement, label: string): void {
  const found = [...host.querySelectorAll("button")].find((button) =>
    (button.textContent ?? "").includes(label),
  );
  if (found === undefined) throw new Error(`no button labelled "${label}"`);
  found.click();
}

describe("the lab panel", () => {
  it("draws the required checkpoints, then the bonus ones under their own heading", async () => {
    const host = await show();

    expect(rows(host)).toHaveLength(4);
    expect(rows(host)[0]).toContain("Implement surprisal(p) in bits");
    expect(checklist(host).textContent).toContain("Bonus0 of 2");
    // A bonus row reads as a checkpoint like any other, not as a greyed one.
    const bonusText = rowElements(host)[2].querySelector("p")!;
    expect(bonusText.className).toContain("text-ink");
    expect(bonusText.className).not.toContain("text-faint");
  });

  it("names the kind only where it is not the default", async () => {
    const host = await show();

    expect(rows(host)[0]).not.toContain("exact");
    expect(rows(host)[2]).toContain("metric");
    expect(rows(host)[3]).toContain("review");
  });

  it("opens the notebook on the mirror", async () => {
    const host = await show();

    const link = host.querySelector("a")!;
    expect(link.getAttribute("href")).toBe(
      `https://colab.research.google.com/github/galthran-wq/distillcourse-labs/blob/main/labs/${LAB}/lab.ipynb`,
    );
    expect(link.getAttribute("target")).toBe("_blank");
  });

  it("states the hours once, in the block", async () => {
    const host = await show();

    expect(host.textContent).toContain("~4 h in a notebook of your own");
  });

  it("says a checkpoint nobody has attempted is untouched", async () => {
    const host = await show();

    expect(rows(host)[0]).toContain("not attempted");
    expect(mark(rowElements(host)[0])).toBe("untouched");
    expect(checklist(host).querySelector("summary")!.textContent).toContain(
      "0 of 2 required",
    );
  });

  it("draws each of the four standings with its own mark and words", async () => {
    vi.mocked(getLabProgress).mockResolvedValue(
      progress([
        state("surprisal", { attempts: 2, passed_at: "2026-08-13T09:00:00Z" }),
        state("entropy-terms", { attempts: 3, feedback: "Natural log, not base two." }),
        state("why-uniform", { attempts: 1 }),
      ]),
    );

    const host = await show();
    const [passed, failed, untouched, pending] = rowElements(host);

    expect(mark(passed)).toBe("passed");
    // The day without a year that is this one; the order is the locale's.
    expect(passed.textContent).toMatch(/passed (13 Aug|Aug 13)/);
    expect(passed.textContent).not.toContain("attempts");
    expect(mark(failed)).toBe("failed");
    expect(failed.textContent).toContain("failed · 3 attempts");
    expect(mark(untouched)).toBe("untouched");
    expect(untouched.textContent).toContain("not attempted");
    // A review is judged while the submission is open, so an attempt with no
    // feedback is one the judge never answered — and nothing re-grades it.
    expect(mark(pending)).toBe("pending");
    expect(pending.textContent).toContain("not judged — post it again");
    // The checkpoint's id is printed verbatim under its status.
    expect(failed.querySelector("code")!.textContent).toBe("entropy-terms");
  });

  it("shows why a checkpoint failed without being asked", async () => {
    vi.mocked(getLabProgress).mockResolvedValue(
      progress([state("entropy-terms", { attempts: 2, feedback: "Natural log, not base two." })]),
    );

    const host = await show();

    const note = [...rowElements(host)[1].querySelectorAll("p")].find(
      (p) => p.textContent === "Natural log, not base two.",
    );
    expect(note).toBeDefined();
    expect(note!.className).toContain("border-accent");
    // Nothing between the reader and the reason but the checklist itself.
    expect(note!.closest("details")).toBe(checklist(host));
    expect(checklist(host).open).toBe(true);
  });

  it("keeps a passed review's feedback, under a quiet rule", async () => {
    vi.mocked(getLabProgress).mockResolvedValue(
      progress([
        state("why-uniform", {
          passed_at: "2026-08-13T09:00:00Z",
          feedback: "Names the maximum and the why.",
        }),
      ]),
    );

    const host = await show();

    const note = [...rowElements(host)[3].querySelectorAll("p")].find(
      (p) => p.textContent === "Names the maximum and the why.",
    );
    expect(note!.className).toContain("border-line");
  });

  it("does not hang a later failure's hint under a passed exact checkpoint", async () => {
    vi.mocked(getLabProgress).mockResolvedValue(
      progress([
        state("surprisal", {
          attempts: 3,
          passed_at: "2026-08-13T09:00:00Z",
          feedback: "Natural log, not base two.",
        }),
      ]),
    );

    const host = await show();

    expect(rows(host)[0]).not.toContain("Natural log");
  });

  it("counts the passed required checkpoints, and every failed one", async () => {
    vi.mocked(getLabProgress).mockResolvedValue(
      progress([
        state("surprisal", { passed_at: "2026-08-13T09:00:00Z" }),
        state("entropy-terms", { attempts: 2 }),
        state("beat-baseline", { attempts: 2, best_score: 0.5 }),
      ]),
    );

    const host = await show();

    const summary = checklist(host).querySelector("summary")!.textContent;
    expect(summary).toContain("1 of 2 required");
    expect(summary).toContain("2 failed");
    expect(checklist(host).textContent).toContain("Bonus0 of 2");
  });

  it("names no failures where there are none", async () => {
    const host = await show();

    expect(checklist(host).querySelector("summary")!.textContent).not.toContain("failed");
  });

  it("puts a metric's best score against the bar the build calibrated", async () => {
    vi.mocked(getLabProgress).mockResolvedValue(
      progress([state("beat-baseline", { attempts: 4, best_score: 0.8912 })]),
    );
    vi.mocked(getLabManifest).mockResolvedValue({
      checkpoints: [{ id: "beat-baseline", spec: { threshold: 0.85 } }],
    });

    const host = await show();

    expect(rows(host)[2]).toContain("metric · 0.891 / 0.85");
  });

  it("states the bar alone before there is a score", async () => {
    vi.mocked(getLabManifest).mockResolvedValue({
      checkpoints: [{ id: "beat-baseline", spec: { threshold: 0.874 } }],
    });

    const host = await show();

    expect(rows(host)[2]).toContain("metric · bar 0.874");
  });

  it("shows an error measure as the error, not as the negative it travels as", async () => {
    // Scores are compared "higher is better", so rmse is stored negated; the
    // reader is shown the error itself, against the bar as an error too.
    vi.mocked(getLabProgress).mockResolvedValue(
      progress([state("beat-baseline", { best_score: -0.312 })]),
    );
    vi.mocked(getLabManifest).mockResolvedValue({
      checkpoints: [{ id: "beat-baseline", spec: { metric: "rmse", threshold: -0.5 } }],
    });

    const host = await show();

    expect(rows(host)[2]).toContain("0.312 / 0.5");
  });

  it("shows a metric score alone where no threshold can be read", async () => {
    vi.mocked(getLabProgress).mockResolvedValue(
      progress([state("beat-baseline", { best_score: 0.8912 })]),
    );
    vi.mocked(getLabManifest).mockRejectedValue(new Error("not ingested"));

    const host = await show();

    expect(rows(host)[2]).toContain("0.891");
    expect(rows(host)[2]).not.toContain("/");
  });

  it("asks for the manifest only where a metric checkpoint needs one", async () => {
    await show({ ...SPEC, checkpoints: SPEC.checkpoints.slice(0, 2) });

    expect(getLabManifest).not.toHaveBeenCalled();
  });

  it("says when a notebook is paired with the account", async () => {
    const host = await show();

    expect(host.textContent).toContain("Notebook paired");
  });

  it("says when none is", async () => {
    vi.mocked(getLabProgress).mockResolvedValue(progress([], false));

    const host = await show();

    expect(host.textContent).toContain("No notebook paired yet");
    expect(host.textContent).not.toContain("Notebook paired");
  });

  it("says nothing about pairing until the API has", async () => {
    vi.mocked(getLabProgress).mockReturnValue(new Promise(() => {}));

    const host = await show();

    expect(host.textContent).not.toContain("paired");
    // Nor about the rows: a reader with passes must not see them unattempted.
    expect(rows(host)[0]).not.toContain("not attempted");
  });

  it("keeps the steps in one fold, closed until asked for", async () => {
    const host = await show();

    const fold = how(host);
    expect(fold.querySelector("summary")!.textContent).toBe("How labs work");
    expect(fold.open).toBe(false);
    expect(fold.querySelectorAll("li")).toHaveLength(4);
    expect(fold.textContent).toContain("distill.login()");
    expect(fold.textContent).toContain("distill.check(…)");
    expect(fold.textContent).toContain('distill.ask("…", obj)');
  });

  it("issues a code for the notebook in the pairing step, and copies it", async () => {
    vi.mocked(issuePairingCode).mockResolvedValue({
      code: "K7xR2mQ9pLw4",
      expires_at: "2026-08-13T09:10:00Z",
    });

    const host = await show();
    await act(async () => press(host, "get a code"));

    const step = how(host).querySelectorAll("li")[1];
    expect(step.textContent).toContain("K7xR2mQ9pLw4");
    expect(step.textContent).toContain("Expires at");
    // Said as the call to make: the generated login cell is `distill.login()`
    // with no argument, so the code goes into a call the learner types.
    expect(step.textContent).toContain('login("…")');

    await act(async () => press(host, "K7xR2mQ9pLw4"));

    expect(writeText).toHaveBeenCalledWith("K7xR2mQ9pLw4");
    expect(host.textContent).toContain("Copied.");
  });

  it("opens the checklist where there is room, and remembers nothing for it", async () => {
    const host = await show();

    expect(checklist(host).open).toBe(true);
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it("starts the checklist closed on a phone", async () => {
    width(false);

    const host = await show();

    expect(checklist(host).open).toBe(false);
    expect(checklist(host).querySelector("summary")!.textContent).toContain("Show");
  });

  it("remembers the reader's choice for this lab", async () => {
    const host = await show();

    await act(async () => checklist(host).querySelector("summary")!.click());

    expect(checklist(host).open).toBe(false);
    expect(checklist(host).querySelector("summary")!.textContent).toContain("Show");
    expect(window.localStorage.getItem(KEY)).toBe("closed");

    await act(async () => checklist(host).querySelector("summary")!.click());

    expect(checklist(host).open).toBe(true);
    expect(window.localStorage.getItem(KEY)).toBe("open");
  });

  it("reads the remembered choice over the width's default", async () => {
    window.localStorage.setItem(KEY, "closed");

    const host = await show();

    expect(checklist(host).open).toBe(false);
  });

  it("keeps what an answer drew when a later load fails", async () => {
    let unreachable: (failure: unknown) => void = () => {};
    vi.mocked(getLabProgress).mockImplementationOnce(
      () => new Promise((_, no) => (unreachable = no)),
    );
    vi.mocked(getLabProgress).mockResolvedValue(
      progress([state("entropy-terms", { attempts: 3 })]),
    );

    const host = await show();
    await act(async () => {
      window.dispatchEvent(new Event("focus"));
    });
    expect(rows(host)[1]).toContain("3 attempts");

    await act(async () => unreachable(new Error("the server is unreachable")));

    expect(rows(host)[1]).toContain("3 attempts");
  });

  it("asks an anonymous reader for nothing of theirs", async () => {
    auth = { status: "anonymous", user: null };

    const host = await show();

    expect(getLabProgress).not.toHaveBeenCalled();
    expect(rows(host)).toHaveLength(4);
    // The rows stand bare: there is no standing to state for nobody.
    expect(rows(host)[0]).not.toContain("not attempted");
    expect(host.textContent).toContain(
      "Sign in to pair a notebook and keep your checkpoints.",
    );
    expect(host.querySelector('a[href="/login"]')!.textContent).toBe("Sign in");
    // The pairing step has no code to issue to nobody.
    expect(how(host).querySelectorAll("li")[1].textContent).toContain("Sign in to pair");
    expect(how(host).querySelector("button")).toBeNull();
  });

  it("asks again when the reader comes back, and on a beat while they stay", async () => {
    vi.useFakeTimers();
    const host = await show();
    expect(getLabProgress).toHaveBeenCalledTimes(1);

    await act(async () => {
      window.dispatchEvent(new Event("focus"));
    });
    expect(getLabProgress).toHaveBeenCalledTimes(2);

    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });
    expect(getLabProgress).toHaveBeenCalledTimes(3);
    expect(host.querySelectorAll("section > details li")).toHaveLength(4);
  });

  it("asks nothing while the tab is hidden", async () => {
    vi.useFakeTimers();
    await show();
    expect(getLabProgress).toHaveBeenCalledTimes(1);

    visibility("hidden");
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
      vi.advanceTimersByTime(120_000);
    });
    expect(getLabProgress).toHaveBeenCalledTimes(1);

    visibility("visible");
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(getLabProgress).toHaveBeenCalledTimes(2);
  });
});
