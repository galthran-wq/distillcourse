import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { renderAsync } from "@resvg/resvg-js";
import { isDrawnFile } from "../content/images";

/**
 * A served SVG figure as a PNG, for the Telegram bot: Telegram shows no SVG,
 * and most figures are SVG. The page draws a figure in `currentColor` and the
 * theme's custom properties; the PNG is the light page.
 */

// The light theme's tokens a figure may name (app/globals.css). Also what
// scripts/render-figure.ts previews a figure on.
export const LIGHT: Readonly<Record<string, string>> = {
  paper: "#ffffff",
  panel: "#f2f3f5",
  ink: "#15171a",
  line: "#d5d8dc",
};
const FAMILY = "Source Sans 3";
// The production image has no fonts at all, so the labels come from these;
// next.config traces the directory into the standalone output. DejaVu Sans
// is there for the math glyphs Source Sans 3 lacks (∧, ∀, ⊆ …), which resvg
// falls back to.
const FONT_DIR = join(process.cwd(), "lib", "figure-png", "fonts");
// Figures are drawn at reading size; a phone shows the photo full width.
const ZOOM = 2;
// One path segment and nothing that steps out of it: no separator, no
// leading dot, so neither `..` nor a hidden file.
const SEGMENT = /^[\w][\w.-]*$/;
// A figure changes only with a deploy, so a render is kept for the life of
// the process; the bound only stops a crawl through every figure from
// holding them all.
const MEMO_SIZE = 256;

let fonts: string[] | undefined;
const memo = new Map<string, Buffer>();

function fontFiles(): string[] {
  fonts ??= readdirSync(FONT_DIR)
    .filter((file) => file.endsWith(".ttf"))
    .map((file) => join(FONT_DIR, file));
  return fonts;
}

function paint(svg: string): string {
  return (
    svg
      .replaceAll("currentColor", LIGHT.ink)
      // resvg resolves no CSS custom properties: a theme token is the light
      // page's, any other name its stated fallback.
      .replace(
        /var\(--([\w-]+)(?:,\s*([^)]*))?\)/g,
        (found, name: string, fallback: string | undefined) =>
          LIGHT[name] ?? fallback ?? found,
      )
  );
}

/** The PNG of `<root>/<course>/<lesson>/<file>`; undefined unless that is a served SVG. */
export async function figurePng(
  root: string,
  course: string,
  lesson: string,
  file: string,
): Promise<Buffer | undefined> {
  if (![course, lesson, file].every((segment) => SEGMENT.test(segment))) return undefined;
  if (!isDrawnFile(file)) return undefined;
  const path = join(root, course, lesson, file);
  const kept = memo.get(path);
  if (kept !== undefined) return kept;
  let svg: string;
  try {
    svg = readFileSync(path, "utf8");
  } catch {
    return undefined;
  }
  // Off the event loop: a large figure would stall every other request.
  const png = (
    await renderAsync(paint(svg), {
      background: LIGHT.paper,
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
  ).asPng();
  if (memo.size >= MEMO_SIZE) memo.delete(memo.keys().next().value!);
  memo.set(path, png);
  return png;
}
