import { afterAll } from "vitest";
import { cpSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * A content root of its own, holding one fixture course, with preview mode on
 * so that the fixture's `drafted` lessons are ones the site renders. Call it
 * before importing `@/lib/content/site`: that module reads the root once, at
 * load.
 */
export function fixtureContent(course: string): void {
  const root = mkdtempSync(join(tmpdir(), `${course}-`));
  mkdirSync(join(root, "courses"));
  cpSync(join(__dirname, "..", "fixtures", course), join(root, "courses", course), {
    recursive: true,
  });
  process.env.CONTENT_ROOT = root;
  process.env.CONTENT_PREVIEW = "1";
  afterAll(() => rmSync(root, { recursive: true, force: true }));
}
