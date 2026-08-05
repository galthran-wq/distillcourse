import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, login, logout, me } from "@/lib/auth/api";

function respond(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function stubFetch(response: Response) {
  const fetch = vi.fn(async () => response);
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

const USER = {
  id: "8a1f",
  email: "reader@example.com",
  full_name: null,
  timezone: "Europe/Berlin",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("the auth client", () => {
  it("sends the session cookie with every call", async () => {
    const fetch = stubFetch(respond(200, USER));

    await me();

    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/v1/auth/me");
    expect(init.credentials).toBe("same-origin");
  });

  it("posts credentials as JSON", async () => {
    const fetch = stubFetch(respond(200, USER));

    await login({ email: "reader@example.com", password: "hunter22", timezone: "UTC" });

    const [, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({
      email: "reader@example.com",
      password: "hunter22",
      timezone: "UTC",
    });
  });

  it("raises the API's own message so the form can show it", async () => {
    stubFetch(respond(403, { detail: "invalid invite code" }));

    await expect(me()).rejects.toThrow(new ApiError(403, "invalid invite code"));
  });

  it("names the field a 422 rejected instead of showing the status", async () => {
    stubFetch(
      respond(422, {
        detail: [
          {
            loc: ["body", "password"],
            msg: "String should have at least 8 characters",
          },
        ],
      }),
    );

    await expect(me()).rejects.toThrow(
      "password: String should have at least 8 characters",
    );
  });

  it("falls back to the status when the body carries no detail", async () => {
    stubFetch(respond(500, { oops: true }));

    await expect(me()).rejects.toThrow("request failed (500)");
  });

  it("accepts an empty 204 body", async () => {
    stubFetch(respond(204));

    await expect(logout()).resolves.toBeUndefined();
  });
});
