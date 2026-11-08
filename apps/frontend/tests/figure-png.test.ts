import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { GET } from "@/app/course-assets-png/[course]/[lesson]/[file]/route";
import { figurePng } from "@/lib/figure-png/render";

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

function drawn(fill: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 20">
  <rect x="2" y="2" width="20" height="10" fill="${fill}"/>
  <text x="2" y="18" font-family="system-ui, sans-serif" font-size="6" fill="${fill}">p ∧ q</text>
</svg>`;
}

function assetTree(): string {
  const root = mkdtempSync(join(tmpdir(), "figure-png-"));
  const lesson = join(root, "course", "lesson");
  mkdirSync(lesson, { recursive: true });
  writeFileSync(join(lesson, "current.svg"), drawn("currentColor"));
  writeFileSync(join(lesson, "ink.svg"), drawn("#15171a"));
  writeFileSync(join(lesson, "black.svg"), drawn("#000000"));
  writeFileSync(join(lesson, "panel.svg"), drawn("var(--panel)"));
  writeFileSync(join(lesson, "panel-fallback.svg"), drawn("var(--panel, #15171a)"));
  writeFileSync(join(lesson, "panel-hex.svg"), drawn("#f2f3f5"));
  writeFileSync(join(lesson, "unknown.svg"), drawn("var(--unknown, #15171a)"));
  writeFileSync(join(lesson, "photo.png"), "not an svg");
  return root;
}

describe("figurePng", () => {
  const root = assetTree();

  const png = (file: string) => figurePng(root, "course", "lesson", file);

  it("draws currentColor as the ink", async () => {
    const current = await png("current.svg");
    expect(current?.subarray(0, 4)).toEqual(PNG_SIGNATURE);
    expect(current).toEqual(await png("ink.svg"));
    expect(current).not.toEqual(await png("black.svg"));
  });

  it("draws a theme token as the light page's, any other name as its fallback", async () => {
    const panel = await png("panel-hex.svg");
    expect(await png("panel.svg")).toEqual(panel);
    expect(await png("panel-fallback.svg")).toEqual(panel);
    expect(await png("unknown.svg")).toEqual(await png("ink.svg"));
  });

  it("serves nothing outside the asset tree, nothing missing, nothing but SVG", async () => {
    for (const [course, lesson, file] of [
      ["course", "..", "current.svg"],
      ["..", "course", "current.svg"],
      ["course", "lesson", "../lesson/current.svg"],
      ["course", "lesson", ".current.svg"],
      ["course", "lesson", "missing.svg"],
      ["course", "lesson", "photo.png"],
    ]) {
      expect(await figurePng(root, course, lesson, file)).toBeUndefined();
    }
  });
});

describe("GET /course-assets-png", () => {
  it("answers a path that steps out of the tree with a 404", async () => {
    const response = await GET(new Request("http://x/"), {
      params: Promise.resolve({ course: "..", lesson: "..", file: "package.json" }),
    });
    expect(response.status).toBe(404);
  });
});
