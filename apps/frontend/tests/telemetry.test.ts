import { describe, expect, it } from "vitest";
import {
  FLUSH_AT_EVENTS,
  HEARTBEAT_SECONDS,
  IDLE_MS,
  MAX_REFERRER,
  ReadingTracker,
  type EventBatch,
} from "@/lib/telemetry/tracker";

const LESSON = "lesson:information-theory/entropy";
const BEAT = HEARTBEAT_SECONDS * 1000;

function session() {
  const batches: EventBatch[] = [];
  let clock = Date.parse("2026-08-05T10:00:00Z");
  const tracker = new ReadingTracker(LESSON, (batch) => batches.push(batch), () => clock);
  return {
    tracker,
    batches,
    events: () => batches.flatMap((batch) => batch.events),
    advance: (ms: number) => {
      clock += ms;
    },
  };
}

function read(minutes: number, { visible = true } = {}) {
  const reading = session();
  for (let beat = 0; beat < (minutes * 60_000) / BEAT; beat++) {
    reading.advance(BEAT);
    reading.tracker.tick(visible);
  }
  return reading;
}

describe("the reading tracker", () => {
  it("sends what the ingest endpoint accepts", () => {
    const reading = session();

    reading.tracker.opened("https://example.com/courses");
    reading.tracker.flush();

    const [batch] = reading.batches;
    expect(batch.lesson).toBe(LESSON);
    expect(Object.keys(batch.events[0]).sort()).toEqual([
      "client_ts",
      "id",
      "payload",
      "type",
    ]);
    expect(batch.events[0].type).toBe("lesson_opened");
    expect(batch.events[0].client_ts).toBe("2026-08-05T10:00:00.000Z");
    expect(batch.events[0].payload).toEqual({ referrer: "https://example.com/courses" });
  });

  it("cuts a referrer the endpoint would refuse", () => {
    const reading = session();

    reading.tracker.opened(`https://example.com/${"x".repeat(MAX_REFERRER)}`);
    reading.tracker.flush();

    expect(String(reading.events()[0].payload.referrer)).toHaveLength(MAX_REFERRER);
  });

  it("buffers until something asks it to flush", () => {
    const reading = session();

    reading.tracker.opened();
    reading.tracker.toggled("proof", "surprise/proof1");

    expect(reading.batches).toHaveLength(0);
  });

  it("flushes on its own once the buffer fills", () => {
    const reading = session();

    for (let n = 0; n < FLUSH_AT_EVENTS; n++) {
      reading.tracker.toggled("solution", `drill/solution${n}`);
    }

    expect(reading.batches).toHaveLength(1);
    expect(reading.batches[0].events).toHaveLength(FLUSH_AT_EVENTS);
  });

  it("counts the seconds actually spent on the page", () => {
    const reading = read(0.5);

    const seconds = reading
      .events()
      .filter((event) => event.type === "heartbeat")
      .map((event) => event.payload.seconds);
    expect(seconds).toEqual(Array(3).fill(HEARTBEAT_SECONDS));
  });

  it("charges a throttled timer only the beat it was owed", () => {
    const reading = session();

    reading.advance(BEAT * 30);
    reading.tracker.activity();
    reading.tracker.tick(true);

    expect(reading.events()[0].payload.seconds).toBe(HEARTBEAT_SECONDS);
  });

  it("counts nothing while the tab is hidden", () => {
    const reading = read(5, { visible: false });

    expect(reading.events()).toEqual([]);
  });

  it("stops counting an idle reader and resumes when they come back", () => {
    const reading = session();

    reading.advance(IDLE_MS + BEAT);
    reading.tracker.tick(true);
    reading.tracker.activity();
    reading.advance(BEAT);
    reading.tracker.tick(true);

    expect(reading.events().map((event) => event.type)).toEqual(["heartbeat"]);
  });

  it("reports each depth mark once, including the ones jumped over", () => {
    const reading = session();

    reading.tracker.scrolled(40);
    reading.tracker.scrolled(38);
    reading.tracker.scrolled(100);
    reading.tracker.flush();

    expect(reading.events().map((event) => event.payload.pct)).toEqual([
      25, 50, 75, 90, 100,
    ]);
  });

  it("never lets the depth go backwards", () => {
    const reading = session();

    reading.tracker.scrolled(90);
    reading.tracker.scrolled(10);
    reading.tracker.flush();

    expect(reading.events().map((event) => event.payload.pct)).toEqual([25, 50, 75, 90]);
  });

  it("reports a toggle and a demo the first time only", () => {
    const reading = session();

    reading.tracker.toggled("proof", "surprise/proof1");
    reading.tracker.toggled("proof", "surprise/proof1");
    reading.tracker.demoTouched("SurprisalSlider", "surprise/demo1");
    reading.tracker.demoTouched("SurprisalSlider", "surprise/demo1");
    reading.tracker.flush();

    expect(reading.events().map((event) => event.payload)).toEqual([
      { kind: "proof", target: "surprise/proof1" },
      { demo: "SurprisalSlider", target: "surprise/demo1" },
    ]);
  });

  it("gives every event an id of its own, so a retry cannot double-count", () => {
    const reading = read(2);

    const ids = new Set(reading.events().map((event) => event.id));
    expect(ids.size).toBe(reading.events().length);
  });
});
