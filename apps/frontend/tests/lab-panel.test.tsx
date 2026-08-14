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

const dom = mounted();
const writeText = vi.fn(async () => {});

beforeEach(() => {
  auth = {
    status: "signed-in",
    user: { id: "8a1f", email: "reader@example.test", full_name: null, timezone: "UTC" },
  };
  vi.mocked(getLabProgress).mockResolvedValue({ checkpoints: [] });
  vi.mocked(getLabManifest).mockResolvedValue({ checkpoints: [] });
  writeText.mockClear();
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
  visibility("visible");
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

function rows(host: HTMLElement): string[] {
  return [...host.querySelectorAll("li")].map((row) => row.textContent ?? "");
}

function press(host: HTMLElement, label: string): void {
  const found = [...host.querySelectorAll("button")].find((button) =>
    (button.textContent ?? "").includes(label),
  );
  if (found === undefined) throw new Error(`no button labelled "${label}"`);
  found.click();
}

describe("the lab panel", () => {
  it("draws the checkpoints the lesson declares, in its order", async () => {
    const host = await show();

    expect(rows(host)).toHaveLength(4);
    expect(rows(host)[0]).toContain("Implement surprisal(p) in bits");
    expect(rows(host)[0]).toContain("exact");
    // Only the optional ones are called out; the required set is the default.
    expect(rows(host)[1]).not.toContain("bonus");
    expect(rows(host)[2]).toContain("bonus");
  });

  it("opens the notebook on the mirror", async () => {
    const host = await show();

    const link = host.querySelector("a")!;
    expect(link.getAttribute("href")).toBe(
      `https://colab.research.google.com/github/galthran-wq/distillcourse-labs/blob/main/labs/${LAB}/lab.ipynb`,
    );
    expect(link.getAttribute("target")).toBe("_blank");
  });

  it("says a checkpoint nobody has attempted is untouched", async () => {
    const host = await show();

    expect(rows(host)[0]).toContain("not attempted");
    expect(host.textContent).toContain("0 / 2 required");
    expect(host.textContent).toContain("0 / 2 bonus");
  });

  it("says where each attempted checkpoint stands", async () => {
    vi.mocked(getLabProgress).mockResolvedValue({
      checkpoints: [
        state("surprisal", { attempts: 2, passed_at: "2026-08-13T09:00:00Z" }),
        state("entropy-terms", { attempts: 3 }),
        state("beat-baseline", { attempts: 4, best_score: 0.8912 }),
        state("why-uniform", { attempts: 1 }),
      ],
    });
    vi.mocked(getLabManifest).mockResolvedValue({
      checkpoints: [{ id: "beat-baseline", spec: { threshold: 0.85 } }],
    });

    const host = await show();

    expect(rows(host)[0]).toContain("passed");
    expect(rows(host)[0]).not.toContain("attempts");
    expect(rows(host)[1]).toContain("3 attempts");
    // The best score against the bar the build calibrated, which is the
    // manifest's rather than the lesson's.
    expect(rows(host)[2]).toContain("0.891 / 0.85");
    // A review is judged while the submission is open, so an attempt with no
    // feedback is one the judge never answered — and nothing re-grades it.
    expect(rows(host)[3]).toContain("not judged — post it again");
    expect(host.textContent).toContain("1 / 2 required");
    expect(host.textContent).toContain("0 / 2 bonus");
  });

  it("shows an error measure as the error, not as the negative it travels as", async () => {
    // Scores are compared "higher is better", so rmse is stored negated; the
    // reader is shown the error itself, against the bar as an error too.
    vi.mocked(getLabProgress).mockResolvedValue({
      checkpoints: [state("beat-baseline", { best_score: -0.312 })],
    });
    vi.mocked(getLabManifest).mockResolvedValue({
      checkpoints: [{ id: "beat-baseline", spec: { metric: "rmse", threshold: -0.5 } }],
    });

    const host = await show();

    expect(rows(host)[2]).toContain("0.312 / 0.5");
  });

  it("shows a metric score alone where no threshold can be read", async () => {
    vi.mocked(getLabProgress).mockResolvedValue({
      checkpoints: [state("beat-baseline", { best_score: 0.8912 })],
    });
    vi.mocked(getLabManifest).mockRejectedValue(new Error("not ingested"));

    const host = await show();

    expect(rows(host)[2]).toContain("0.891");
    expect(rows(host)[2]).not.toContain("/");
  });

  it("asks for the manifest only where a metric checkpoint needs one", async () => {
    await show({ ...SPEC, checkpoints: SPEC.checkpoints.slice(0, 2) });

    expect(getLabManifest).not.toHaveBeenCalled();
  });

  it("folds a judged review's feedback away until it is asked for", async () => {
    vi.mocked(getLabProgress).mockResolvedValue({
      checkpoints: [state("why-uniform", { feedback: "Names the maximum, not the why." })],
    });

    const host = await show();

    const block = host.querySelector("details")!;
    expect(block.open).toBe(false);
    expect(block.textContent).toContain("Names the maximum, not the why.");
  });

  it("counts a required checkpoint apart from a bonus one", async () => {
    vi.mocked(getLabProgress).mockResolvedValue({
      checkpoints: [
        state("surprisal", { passed_at: "2026-08-13T09:00:00Z" }),
        state("entropy-terms", { passed_at: "2026-08-13T10:00:00Z" }),
        state("beat-baseline", { passed_at: "2026-08-13T11:00:00Z" }),
      ],
    });

    const host = await show();

    expect(host.textContent).toContain("2 / 2 required · 1 / 2 bonus");
  });

  it("issues a code for the notebook and copies it", async () => {
    vi.mocked(issuePairingCode).mockResolvedValue({
      code: "K7xR2mQ9pLw4",
      expires_at: "2026-08-13T09:10:00Z",
    });

    const host = await show();
    await act(async () => press(host, "Code for the notebook"));

    expect(host.textContent).toContain("K7xR2mQ9pLw4");
    // Named for the cell the generated notebook actually carries: pasting a
    // pairing code into the setup cell is a SyntaxError.
    expect(host.textContent).toContain("login cell");
    expect(host.textContent).toContain("distill.login(...)");

    await act(async () => press(host, "K7xR2mQ9pLw4"));

    expect(writeText).toHaveBeenCalledWith("K7xR2mQ9pLw4");
    expect(host.textContent).toContain("Copied.");
  });

  it("keeps what an answer drew when a later load fails", async () => {
    let unreachable: (failure: unknown) => void = () => {};
    vi.mocked(getLabProgress).mockImplementationOnce(
      () => new Promise((_, no) => (unreachable = no)),
    );
    vi.mocked(getLabProgress).mockResolvedValue({
      checkpoints: [state("entropy-terms", { attempts: 3 })],
    });

    const host = await show();
    await act(async () => {
      window.dispatchEvent(new Event("focus"));
    });
    expect(rows(host)[1]).toContain("3 attempts");

    await act(async () => unreachable(new Error("the server is unreachable")));

    expect(rows(host)[1]).toContain("3 attempts");
  });

  it("asks an anonymous reader for nothing", async () => {
    auth = { status: "anonymous", user: null };

    const host = await show();

    expect(getLabProgress).not.toHaveBeenCalled();
    // Including the threshold: it is only ever drawn beside a best score,
    // which an anonymous reader has none of.
    expect(getLabManifest).not.toHaveBeenCalled();
    expect(rows(host)).toHaveLength(4);
    expect(host.textContent).toContain("Sign in");
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
    expect(host.querySelectorAll("li")).toHaveLength(4);
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
