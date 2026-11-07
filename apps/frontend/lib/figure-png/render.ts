import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { isDrawnFile } from "../content/images";

/**
 * A served SVG figure as a PNG, for the Telegram bot: Telegram shows no SVG,
 * and most figures are SVG. The page draws a figure in `currentColor`; the
 * PNG is the light page — the ink on white.
 */

// The light theme's --ink and --paper (app/globals.css).
const INK = "#15171a";
const PAPER = "#ffffff";
const FAMILY = "Source Sans 3";
// The production image has no fonts at all, so the labels come from these;
// next.config traces the directory into the standalone output.
const FONT_DIR = join(process.cwd(), "lib", "figure-png", "fonts");
// Figures are drawn at reading size; a phone shows the photo full width.
const ZOOM = 2;
// One path segment and nothing that steps out of it: no separator, no
// leading dot, so neither `..` nor a hidden file.
const SEGMENT = /^[\w][\w.-]*$/;

// The directory `assetUrl` serves from (scripts/sync-assets.ts fills it).
export const ASSET_ROOT = join(process.cwd(), "public", "course-assets");

let fonts: string[] | undefined;

function fontFiles(): string[] {
  fonts ??= readdirSync(FONT_DIR)
    .filter((file) => file.endsWith(".ttf"))
    .map((file) => join(FONT_DIR, file));
  return fonts;
}

/** The PNG of `<root>/<course>/<lesson>/<file>`; undefined unless that is a served SVG. */
export function figurePng(
  root: string,
  course: string,
  lesson: string,
  file: string,
): Buffer | undefined {
  if (![course, lesson, file].every((segment) => SEGMENT.test(segment))) return undefined;
  if (!isDrawnFile(file)) return undefined;
  let svg: string;
  try {
    svg = readFileSync(join(root, course, lesson, file), "utf8");
  } catch {
    return undefined;
  }
  const painted = svg
    .replaceAll("currentColor", INK)
    // resvg resolves no CSS custom properties; a figure that names one names
    // its fallback beside it.
    .replace(/var\(--[\w-]+,\s*([^)]*)\)/g, "$1");
  return new Resvg(painted, {
    background: PAPER,
    fitTo: { mode: "zoom", value: ZOOM },
    font: {
      fontFiles: fontFiles(),
      loadSystemFonts: false,
      defaultFontFamily: FAMILY,
      sansSerifFamily: FAMILY,
      serifFamily: FAMILY,
      monospaceFamily: FAMILY,
    },
  })
    .render()
    .asPng();
}
