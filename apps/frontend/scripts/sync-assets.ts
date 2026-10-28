#!/usr/bin/env tsx
/**
 * Copies lesson figures (raster and SVG) out of the content tree into `public/`:
 *
 *   content/courses/<c>/lessons/<l>/figures/x.jpg
 *     -> public/course-assets/<c>/<l>/x.jpg
 *
 * Next only serves static files from `public`, but lesson assets belong next
 * to the lesson they illustrate — so the copy is a build step (`predev`,
 * `prebuild`, `prevalidate`) rather than a place authors put files. Stale
 * copies are pruned, so deleting an image from a lesson deletes it from the
 * site. The destination is generated and git-ignored.
 *
 * Run it by hand (`npm run sync-assets`) after adding an image while a dev
 * server is already up.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { wantedAssets } from "../lib/content/assets";
import { appRoot, contentRoot, repoRoot } from "./paths";

const publicRoot = join(appRoot, "public", "course-assets");
const wanted = wantedAssets(contentRoot, publicRoot);

let copied = 0;
for (const [dest, src] of wanted) {
  mkdirSync(join(dest, ".."), { recursive: true });
  const fresh =
    existsSync(dest) && statSync(dest).mtimeMs >= statSync(src).mtimeMs;
  if (!fresh) {
    copyFileSync(src, dest);
    copied++;
  }
}

let pruned = 0;
function prune(dir: string): void {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      prune(path);
      if (readdirSync(path).length === 0) rmSync(path, { recursive: true });
    } else if (!wanted.has(path)) {
      rmSync(path);
      pruned++;
    }
  }
}
prune(publicRoot);

console.log(
  `sync-assets: ${wanted.size} image(s) in ${relative(repoRoot, publicRoot)} ` +
    `(${copied} copied, ${pruned} stale removed)`,
);
