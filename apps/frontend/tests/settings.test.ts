import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getSettings,
  toApi,
  toClock,
  unpairTelegram,
  updateSettings,
} from "@/lib/settings/api";

const SETTINGS = {
  timezone: "Europe/Berlin",
  quiet_start: "09:00:00",
  quiet_end: "22:00:00",
  muted_until: null,
  telegram: "none",
};

function stubFetch(status = 200, body: unknown = SETTINGS) {
  const fetch = vi.fn(
    async () =>
      new Response(status === 204 ? null : JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
  );
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("the settings client", () => {
  it("reads the state the poller acts on", async () => {
    const fetch = stubFetch();

    expect(await getSettings()).toEqual(SETTINGS);
    const [url] = fetch.mock.calls[0] as unknown as [string];
    expect(url).toBe("/api/v1/settings");
  });

  it("sends only the fields the reader changed", async () => {
    const fetch = stubFetch();

    await updateSettings({ quiet_start: "07:30:00" });

    const [, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(String(init.body))).toEqual({ quiet_start: "07:30:00" });
  });

  it("unpairing answers with no body", async () => {
    stubFetch(204);

    await expect(unpairTelegram()).resolves.toBeUndefined();
  });

  it("translates between the time input and the column", () => {
    // A round trip both ways: the input drops the seconds the column keeps.
    expect(toClock("22:00:00")).toBe("22:00");
    expect(toApi(toClock("22:00:00"))).toBe("22:00:00");
  });
});
