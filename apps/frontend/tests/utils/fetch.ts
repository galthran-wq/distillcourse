import { afterEach, vi } from "vitest";

/**
 * A stubbed `fetch` for the hand-written API clients under `lib`, which are
 * thin enough that what a test has to check is the request they built.
 *
 * `null` stands for a 204, which is what every write route answers with.
 */
export function stubFetch(body: unknown = null): ReturnType<typeof vi.fn> {
  const fetch = vi.fn(
    async () =>
      new Response(body === null ? null : JSON.stringify(body), {
        status: body === null ? 204 : 200,
        headers: { "Content-Type": "application/json" },
      }),
  );
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

export function requestOf(fetch: ReturnType<typeof vi.fn>): [string, RequestInit] {
  return fetch.mock.calls[0] as unknown as [string, RequestInit];
}

// Registered on import, so importing the stub is what undoes it: a file that
// stubs `fetch` and forgets to restore it leaves the global broken for every
// later test in the same worker.
afterEach(() => {
  vi.unstubAllGlobals();
});
