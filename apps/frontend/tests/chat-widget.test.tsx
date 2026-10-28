// @vitest-environment jsdom
import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import ChatWidget from "@/components/chat/ChatWidget";
import { LESSONS } from "./chat-fixture";
import { mounted } from "./utils/dom";

const route = vi.hoisted(() => ({ path: "/" }));

vi.mock("next/navigation", () => ({
  useParams: () => ({}),
  usePathname: () => route.path,
}));

vi.mock("@/lib/auth/store", () => ({
  useAuth: () => ({ status: "anonymous", user: null }),
}));

// The panel measures the window it is docked in; jsdom has no media queries.
window.matchMedia = (() => ({ matches: true })) as unknown as typeof window.matchMedia;

const page = mounted();

function launcher(path: string): HTMLButtonElement | null {
  route.path = path;
  act(() => page.render(<ChatWidget lessons={LESSONS} />));
  return page.host().querySelector("button");
}

describe("the tutor launcher", () => {
  it("is an outlined pill whose icon alone carries the accent", () => {
    const button = launcher("/courses/info-theory/lessons/entropy");

    expect(button?.className).toContain("border-line bg-paper");
    expect(button?.className).not.toContain("bg-accent");
    expect(button?.querySelector("svg")?.getAttribute("class")).toContain("text-accent");
  });

  it("keeps the name Tutor as a phone's icon-only circle", () => {
    const button = launcher("/");

    expect(button?.className).toContain("max-sm:size-11");
    // The label is hidden from sight on a phone, not from the accessible name.
    expect(button?.querySelector("span")?.className).toBe("max-sm:sr-only");
    expect(button?.textContent).toBe("Tutor");
  });

  it.each(["/login", "/signup", "/settings", "/labs/pair/K7Q2-9XMB"])(
    "is not on %s, nor is the panel",
    (path) => {
      launcher(path);

      expect(page.host().innerHTML).toBe("");
    },
  );

  it("is on a page that only starts like one of those", () => {
    expect(launcher("/settings-help")).not.toBeNull();
    expect(launcher("/labs/pair")).not.toBeNull();
  });
});
