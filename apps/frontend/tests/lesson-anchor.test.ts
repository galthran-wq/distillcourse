// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { reveal } from "@/lib/lesson/anchor";

function frame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function flashed(id: string): boolean {
  return document.getElementById(id)?.classList.contains("anchor-flash") === true;
}

beforeEach(() => {
  document.body.innerHTML = "";
  Element.prototype.scrollIntoView = vi.fn();
});

describe("following a reference", () => {
  it("scrolls to the section and marks it", async () => {
    document.body.innerHTML = '<h2 id="the-average">The average</h2>';

    reveal("the-average");
    await frame();

    expect(flashed("the-average")).toBe(true);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it("waits for a section the navigation has not rendered yet", async () => {
    reveal("the-average");
    await frame();
    expect(document.getElementById("the-average")).toBeNull();

    document.body.innerHTML = '<h2 id="the-average">The average</h2>';
    await frame();

    expect(flashed("the-average")).toBe(true);
  });

  it("marks one section at a time", async () => {
    document.body.innerHTML =
      '<h2 id="first">First</h2><h2 id="second">Second</h2>';

    reveal("first");
    await frame();
    reveal("second");
    await frame();

    expect(flashed("first")).toBe(false);
    expect(flashed("second")).toBe(true);
  });

  it("does nothing for a reference with no section", async () => {
    document.body.innerHTML = '<h2 id="the-average">The average</h2>';

    reveal(null);
    await frame();

    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });
});
