// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  HEARTBEAT_SECONDS,
  ReadingTracker,
  type EventBatch,
} from "@/lib/telemetry/tracker";
import { watch } from "@/lib/telemetry/watch";

// The page the gate describes: an environment the reader opens, a solution,
// an aside, and a demo they touch — each in a named section.
const LESSON = `
  <h2 id="surprise">Surprise</h2>
  <details id="proof" class="env env-proof" data-toggle="proof">
    <summary>Proof</summary>
  </details>
  <details id="aside" class="aside" data-toggle="aside"><summary>Aside</summary></details>
  <figure data-demo="SurprisalSlider"><button id="knob">drag</button></figure>
  <h2 id="drill">Drill</h2>
  <details id="solution" class="solution" data-toggle="solution">
    <summary>Solution</summary>
  </details>
`;

let stop: (() => void) | undefined;

function reading(anchor?: () => string | null) {
  document.body.innerHTML = LESSON;
  const batches: EventBatch[] = [];
  const tracker = new ReadingTracker("lesson:information-theory/entropy", (batch) =>
    batches.push(batch),
  );
  stop = watch(tracker, anchor);
  return {
    batches,
    events: () => {
      tracker.flush();
      return batches.flatMap((batch) => batch.events);
    },
  };
}

function open(id: string) {
  const details = document.getElementById(id) as HTMLDetailsElement;
  details.open = true;
  details.dispatchEvent(new Event("toggle"));
}

afterEach(() => {
  stop?.();
  stop = undefined;
  vi.useRealTimers();
});

describe("watching a lesson page", () => {
  it("sends the section the reader is in with each heartbeat", () => {
    vi.useFakeTimers();
    let section = "surprise";
    const session = reading(() => section);

    vi.advanceTimersByTime(HEARTBEAT_SECONDS * 1000);
    section = "drill";
    vi.advanceTimersByTime(HEARTBEAT_SECONDS * 1000);

    expect(
      session
        .events()
        .filter((event) => event.type === "heartbeat")
        .map((event) => event.payload.anchor),
    ).toEqual(["surprise", "drill"]);
  });

  it("reports the arrival and, on a page that fits, the whole depth", () => {
    const session = reading();

    expect(session.events().map((event) => event.type)).toEqual([
      "lesson_opened",
      "scroll",
      "scroll",
      "scroll",
      "scroll",
      "scroll",
    ]);
  });

  it("turns an opened environment into its kind and its place", () => {
    const session = reading();

    open("proof");
    open("solution");
    open("aside");

    expect(
      session
        .events()
        .filter((event) => event.type === "toggle_opened")
        .map((event) => event.payload),
    ).toEqual([
      { kind: "proof", target: "surprise/proof1" },
      { kind: "solution", target: "drill/solution1" },
      { kind: "aside", target: "surprise/aside1" },
    ]);
  });

  it("reports a demo once, however often it is touched", () => {
    const session = reading();
    const knob = document.getElementById("knob")!;

    knob.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    knob.dispatchEvent(new Event("pointerdown", { bubbles: true }));

    expect(
      session.events().filter((event) => event.type === "demo_interacted"),
    ).toMatchObject([
      { payload: { demo: "SurprisalSlider", target: "surprise/demo1" } },
    ]);
  });

  it("ignores a details the reader closed again", () => {
    const session = reading();
    const proof = document.getElementById("proof") as HTMLDetailsElement;

    proof.dispatchEvent(new Event("toggle"));

    expect(session.events().some((event) => event.type === "toggle_opened")).toBe(
      false,
    );
  });

  it("stops reporting once the reader has left the lesson", () => {
    const session = reading();
    session.events();
    stop?.();
    stop = undefined;

    open("proof");

    expect(session.events().some((event) => event.type === "toggle_opened")).toBe(
      false,
    );
  });
});
