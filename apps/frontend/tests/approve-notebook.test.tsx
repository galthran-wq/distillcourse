// @vitest-environment jsdom
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ApproveNotebook from "@/components/labs/ApproveNotebook";
import type { AuthState } from "@/lib/auth/store";
import { ApiError } from "@/lib/http";
import { approveDevice } from "@/lib/labs/api";
import { mounted } from "./utils/dom";

vi.mock("@/lib/labs/api", () => ({ approveDevice: vi.fn() }));

let auth: AuthState;
vi.mock("@/lib/auth/store", () => ({ useAuth: () => auth }));

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

const CODE = "dQ4nXw8pR2mL";

const dom = mounted();

async function show(): Promise<HTMLElement> {
  await act(async () => dom.render(<ApproveNotebook code={CODE} />));
  return dom.host();
}

function approveButton(host: HTMLElement): HTMLButtonElement {
  const found = [...host.querySelectorAll("button")].find((button) =>
    (button.textContent ?? "").includes("Approve this notebook"),
  );
  if (found === undefined) throw new Error("no approve button");
  return found;
}

beforeEach(() => {
  auth = {
    status: "signed-in",
    user: { id: "8a1f", email: "reader@example.test", full_name: null, timezone: "UTC" },
  };
  replace.mockClear();
  vi.mocked(approveDevice).mockReset();
});

describe("the notebook approval page", () => {
  it("says which account the approval binds, then approves onto it", async () => {
    vi.mocked(approveDevice).mockResolvedValue(undefined);

    const host = await show();
    expect(host.textContent).toContain("reader@example.test");

    await act(async () => approveButton(host).click());

    expect(approveDevice).toHaveBeenCalledWith(CODE);
    expect(host.textContent).toContain("Approved.");
  });

  it("sends an anonymous visitor to sign in and come back", async () => {
    auth = { status: "anonymous", user: null };

    const host = await show();

    expect(replace).toHaveBeenCalledWith(
      `/login?next=${encodeURIComponent(`/labs/pair/${CODE}`)}`,
    );
    // Nothing to approve with yet, so nothing is offered.
    expect(host.querySelector("button")).toBeNull();
  });

  it("shows the server's refusal in its own words", async () => {
    vi.mocked(approveDevice).mockRejectedValue(
      new ApiError(400, "that code has expired"),
    );

    const host = await show();
    await act(async () => approveButton(host).click());

    expect(host.textContent).toContain("that code has expired");
    // Refused is not spent: the learner can run the login cell again and this
    // page stays usable for the fresh code's URL sibling.
    expect(approveButton(host).disabled).toBe(false);
  });
});
