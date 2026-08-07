/**
 * What a reading session sends home. The tracker is deliberately free of the
 * DOM and of React — `watch.ts` turns browser events into these calls — and
 * the rules for what becomes an event live here, where they can be tested.
 */

import { API } from "@/lib/api-base";

export const ENDPOINT = `${API}/telemetry/events`;
export const HEARTBEAT_SECONDS = 10;
/** No input, scroll or pointer movement for this long and the reader is gone. */
export const IDLE_MS = 60_000;
export const FLUSH_AT_EVENTS = 20;
export const SCROLL_MARKS = [25, 50, 75, 90, 100];
// Mirrors the bound in app/telemetry/schemas.py: a referrer longer than this
// would cost the whole event, and where the reader came from is worth less
// than knowing they arrived.
export const MAX_REFERRER = 200;

export type ToggleKind = "proof" | "solution" | "aside";

export type EventType =
  | "lesson_opened"
  | "heartbeat"
  | "scroll"
  | "toggle_opened"
  | "demo_interacted";

export interface ReadingEvent {
  id: string;
  type: EventType;
  client_ts: string;
  payload: Record<string, unknown>;
}

export interface EventBatch {
  lesson: string;
  events: ReadingEvent[];
}

// crypto.randomUUID exists only in secure contexts; a deploy reached over
// plain http (an IP-and-port preview) must not crash the tree for it.
export function uuid(): string {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export type Transport = (batch: EventBatch) => void;

export class ReadingTracker {
  private readonly buffer: ReadingEvent[] = [];
  /** Targets and marks already reported: each is an event exactly once. */
  private readonly reported = new Set<string>();
  private lastActivity: number;
  private lastTick: number;
  private depth = 0;

  constructor(
    private readonly lesson: string,
    private readonly transport: Transport,
    private readonly now: () => number = Date.now,
  ) {
    this.lastActivity = this.now();
    this.lastTick = this.lastActivity;
  }

  opened(referrer?: string): void {
    this.push(
      "lesson_opened",
      referrer === undefined ? {} : { referrer: referrer.slice(0, MAX_REFERRER) },
    );
  }

  activity(): void {
    this.lastActivity = this.now();
  }

  /** One beat of the heartbeat interval; `visible` is the tab's own state. */
  tick(visible: boolean): void {
    const now = this.now();
    const seconds = Math.min(
      Math.round((now - this.lastTick) / 1000),
      HEARTBEAT_SECONDS,
    );
    // Measured rather than assumed: a browser that throttled this timer must
    // not buy the reader seconds they did not spend.
    if (visible && now - this.lastActivity < IDLE_MS && seconds >= 1) {
      this.push("heartbeat", { seconds });
    }
    this.lastTick = now;
    this.flush();
  }

  /** Depth of the page read so far, in percent; only new marks are reported. */
  scrolled(pct: number): void {
    this.depth = Math.max(this.depth, Math.min(Math.round(pct), 100));
    for (const mark of SCROLL_MARKS) {
      if (this.depth >= mark && this.firstTime(`scroll:${mark}`)) {
        this.push("scroll", { pct: mark });
      }
    }
  }

  toggled(kind: ToggleKind, target: string): void {
    if (this.firstTime(`toggle:${target}`)) {
      this.push("toggle_opened", { kind, target });
    }
  }

  demoTouched(demo: string, target: string): void {
    if (this.firstTime(`demo:${target}`)) {
      this.push("demo_interacted", { demo, target });
    }
  }

  flush(): void {
    if (this.buffer.length === 0) return;
    this.transport({
      lesson: this.lesson,
      events: this.buffer.splice(0, this.buffer.length),
    });
  }

  private firstTime(key: string): boolean {
    if (this.reported.has(key)) return false;
    this.reported.add(key);
    return true;
  }

  private push(type: EventType, payload: Record<string, unknown>): void {
    this.buffer.push({
      id: uuid(),
      type,
      client_ts: new Date(this.now()).toISOString(),
      payload,
    });
    if (this.buffer.length >= FLUSH_AT_EVENTS) this.flush();
  }
}

/**
 * Fire-and-forget: sendBeacon survives the page being closed, which is exactly
 * when the last seconds of a reading session are reported.
 */
export function beacon(batch: EventBatch): void {
  const body = JSON.stringify(batch);
  const queued =
    typeof navigator.sendBeacon === "function" &&
    navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
  if (queued) return;
  void fetch(ENDPOINT, {
    method: "POST",
    credentials: "same-origin",
    keepalive: true,
    headers: { "Content-Type": "application/json" },
    body,
    // Telemetry that failed to send is telemetry lost, never an error the
    // reader sees: there is nothing here worth interrupting a page for.
  }).catch(() => undefined);
}
