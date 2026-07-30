import { describe, expect, it } from "vitest";
import {
  isRasterFile,
  isProbeError,
  probeImageBuffer,
  slugsFromLessonDir,
} from "@/lib/content/images";
import { creditMatches } from "@/lib/content/credits";

/**
 * The probe is what stands between a half-downloaded or wrong-typed file and
 * a broken image on a lesson page — so it is tested against real bytes.
 */

// 1×1 PNG and JPEG, base64 (the smallest valid files of each kind).
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
const JPEG_1PX = Buffer.from(
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==",
  "base64",
);

describe("probeImageBuffer", () => {
  it("reads PNG dimensions", () => {
    const probe = probeImageBuffer(PNG_1PX);
    expect(probe).toMatchObject({ format: "png", width: 1, height: 1, truncated: false });
  });

  it("reads JPEG dimensions from the start-of-frame segment", () => {
    const probe = probeImageBuffer(JPEG_1PX);
    expect(probe).toMatchObject({ format: "jpeg", width: 1, height: 1, truncated: false });
  });

  it("flags a half-downloaded PNG", () => {
    const probe = probeImageBuffer(PNG_1PX.subarray(0, 40));
    expect(probe).toMatchObject({ format: "png", truncated: true });
  });

  it("flags a half-downloaded JPEG", () => {
    const probe = probeImageBuffer(JPEG_1PX.subarray(0, 120));
    expect(probe).toMatchObject({ format: "jpeg", truncated: true });
  });

  it("recognizes an HTML error page saved as an image", () => {
    const probe = probeImageBuffer(Buffer.from("<!DOCTYPE html><html>404</html>"));
    expect(isProbeError(probe) && probe.error).toContain("HTML page");
  });

  it("sends SVG back to the raw-SVG tier", () => {
    const probe = probeImageBuffer(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'));
    expect(isProbeError(probe) && probe.error).toContain("SVG");
  });

  it("rejects an empty file", () => {
    expect(isProbeError(probeImageBuffer(Buffer.alloc(0)))).toBe(true);
  });
});

describe("isRasterFile", () => {
  it("accepts the sourced-image extensions and nothing else", () => {
    expect(isRasterFile("a/b/photo.JPG")).toBe(true);
    expect(isRasterFile("scan.webp")).toBe(true);
    expect(isRasterFile("./figures/rarity.svg")).toBe(false);
    expect(isRasterFile("notes.pdf")).toBe(false);
  });
});

describe("creditMatches", () => {
  const entry = (file: string) => ({ file }) as never;

  it("matches an exact file name", () => {
    expect(creditMatches(entry("photo.png"), "photo.png")).toBe(true);
    expect(creditMatches(entry("photo.png"), "photo-2.png")).toBe(false);
  });

  it("covers a whole sequence with one * pattern", () => {
    const seq = entry("approximations-*.png");
    expect(creditMatches(seq, "approximations-1.png")).toBe(true);
    expect(creditMatches(seq, "approximations-12.png")).toBe(true);
    expect(creditMatches(seq, "other-1.png")).toBe(false);
    expect(creditMatches(seq, "approximations-1.jpg")).toBe(false);
  });

  it("treats the rest of the pattern literally", () => {
    expect(creditMatches(entry("fig.1-*.png"), "figX1-2.png")).toBe(false);
  });
});

describe("slugsFromLessonDir", () => {
  it("extracts course and lesson slugs", () => {
    expect(
      slugsFromLessonDir("/repo/content/courses/information-theory/lessons/what-is-surprise"),
    ).toEqual({ course: "information-theory", lesson: "what-is-surprise" });
  });

  it("returns undefined for a path that is not a lesson dir", () => {
    expect(slugsFromLessonDir("/repo/components/figures")).toBeUndefined();
  });
});
