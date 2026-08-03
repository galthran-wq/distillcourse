#!/usr/bin/env tsx
/**
 * Sourced-image toolkit: `npm run image -- <command> …`
 *
 * The acquisition and verification half of the third figure tier
 * (docs/figures.md): the reading swarm captures with it, /figure-artist
 * cuts and verifies with it, and a human can drive it directly.
 *
 *   check <file…>                        verify files are real, complete images
 *   fetch <url> <dest>                   download, then check
 *   capture <url|pdf> <dest> [page]      grab the raw material for later use:
 *                                        a web image, or a PDF page — its
 *                                        stored figure bitmaps AND the page
 *                                        render  [--dpi 200] [--max-width 1600]
 *                                        [--no-embedded]
 *   pdf-list <pdf> [--pages 1-9]         what images a PDF page holds
 *   pdf-extract <pdf> <page> <outdir>    pull embedded images out of a page
 *   pdf-page <pdf> <page> <dest>         render a whole page  [--dpi 200]
 *   crop <src> <dest> <WxH+X+Y|--trim>   cut a figure out of a page render
 *                                        [--extent WxH] pad to a common size
 *   fit <src> <dest>                     normalize for the web
 *                                        [--max-width 2400] [--quality 82]
 *                                        [--flatten] (transparent -> white)
 *
 * `check` is dependency-free (lib/content/images.ts) except for the optional
 * blank-image test; the rest shell out to poppler-utils (pdfimages/pdftoppm)
 * and ImageMagick, and say so plainly when a tool is missing.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import {
  MAX_FIGURE_BYTES,
  MIN_FIGURE_WIDTH,
  isProbeError,
  probeImageFile,
} from "../lib/content/images";

const [command, ...rest] = process.argv.slice(2);

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

function flag(name: string, fallback: string): string {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 && rest[i + 1] !== undefined ? rest[i + 1] : fallback;
}

function has(name: string): boolean {
  return rest.includes(`--${name}`);
}

function positional(): string[] {
  const out: string[] = [];
  for (let i = 0; i < rest.length; i++) {
    if (rest[i].startsWith("--")) {
      // Skip the flag and, unless it is a bare switch, its value.
      if (!["trim", "flatten"].includes(rest[i].slice(2))) i++;
      continue;
    }
    out.push(rest[i]);
  }
  return out;
}

function tool(name: string, args: string[], hint: string): string {
  try {
    return execFileSync(name, args, { encoding: "utf8", maxBuffer: 64 << 20 });
  } catch (err) {
    const e = err as NodeJS.ErrnoException & { stderr?: string };
    if (e.code === "ENOENT") fail(`${name} is not installed — ${hint}`);
    fail(`${name} failed: ${e.stderr?.trim() || e.message}`);
  }
}

const POPPLER = "install it with `sudo apt-get install -y poppler-utils`";
const IMAGEMAGICK = "install it with `sudo apt-get install -y imagemagick`";

/** Flat, near-uniform images (a blank page, an all-white crop) via ImageMagick. */
function uniformity(file: string): number | undefined {
  try {
    const out = execFileSync(
      "convert",
      [file, "-resize", "120x120!", "-colorspace", "Gray", "-format", "%[fx:standard_deviation]", "info:"],
      // stderr is silenced: a file the structural probe already rejected makes
      // ImageMagick shout, and that noise buries the real diagnosis.
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    );
    const value = Number.parseFloat(out.trim());
    return Number.isFinite(value) ? value : undefined;
  } catch {
    return undefined; // ImageMagick absent: the structural checks still ran
  }
}

/**
 * Everything that can be proven about a file without eyes. It does NOT prove
 * the image shows the right thing — the figure agent must still LOOK at it.
 */
function check(files: string[]): void {
  if (files.length === 0) fail("usage: npm run image -- check <file…>");
  let bad = 0;
  for (const file of files) {
    const path = resolve(file);
    if (!existsSync(path)) {
      console.log(`✗ ${file}: does not exist`);
      bad++;
      continue;
    }
    const probe = probeImageFile(path);
    if (isProbeError(probe)) {
      console.log(`✗ ${file}: ${probe.error}`);
      bad++;
      continue;
    }
    const problems: string[] = [];
    if (probe.truncated) problems.push("file is truncated (incomplete download)");
    if (probe.width < MIN_FIGURE_WIDTH) {
      problems.push(
        `only ${probe.width}px wide — under the ${MIN_FIGURE_WIDTH}px floor (a thumbnail, not a figure)`,
      );
    }
    if (probe.bytes > MAX_FIGURE_BYTES) {
      problems.push(
        `${(probe.bytes / 1e6).toFixed(1)} MB — over the ${(MAX_FIGURE_BYTES / 1e6).toFixed(1)} MB budget, run \`image fit\``,
      );
    }
    const spread = uniformity(path);
    if (spread !== undefined && spread < 0.02) {
      problems.push(`nearly uniform (σ=${spread.toFixed(4)}) — blank or a failed crop`);
    }
    const geometry = `${probe.format} ${probe.width}×${probe.height}, ${(probe.bytes / 1024).toFixed(0)} KB`;
    if (problems.length > 0) {
      console.log(`✗ ${file}: ${geometry}\n    - ${problems.join("\n    - ")}`);
      bad++;
    } else {
      console.log(`✓ ${file}: ${geometry}${spread === undefined ? " (blank test skipped: no ImageMagick)" : ""}`);
    }
  }
  if (bad > 0) fail(`${bad} of ${files.length} image(s) unusable`);
  console.log("Structure is fine. Now LOOK at the file (Read it) before shipping it.");
}

/** Beyond this a page is a shredded scan, not a page with figures on it. */
const MAX_EMBEDDED_PER_PAGE = 200;

/**
 * Pulls the figure bitmaps a PDF page actually stores, keeping the ones big
 * enough to be a figure. Returns the files kept.
 *
 * Decided on SIZE, not count: a page can legitimately store three dozen
 * panels of a photo grid, while an MRC-compressed scan stores hundreds of
 * tiny shreds of text. When nothing stored is figure-sized — a vector figure,
 * or thumbnails — it extracts nothing and the page render carries the day.
 */
function embeddedFigures(pdf: string, page: string, stem: string): string[] {
  const list = tool("pdfimages", ["-list", "-f", page, "-l", page, pdf], POPPLER);
  const rows = list.trim().split("\n").slice(2).filter((l) => l.trim() !== "");
  const figureSized = rows.filter((row) => {
    const col = row.trim().split(/\s+/);
    return Number(col[3]) >= MIN_FIGURE_WIDTH && Number(col[4]) >= 240;
  });
  if (figureSized.length === 0 || rows.length > MAX_EMBEDDED_PER_PAGE) return [];

  tool("pdfimages", ["-png", "-f", page, "-l", page, pdf, stem], POPPLER);
  const dir = dirname(resolve(stem));
  const prefix = basename(stem);
  const kept: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    if (!name.startsWith(`${prefix}-`) || !name.endsWith(".png")) continue;
    const path = join(dir, name);
    const probe = probeImageFile(path);
    // Rules, borders and logos are stored images too — keep only what could
    // carry a figure on its own.
    if (isProbeError(probe) || probe.width < MIN_FIGURE_WIDTH || probe.height < 240) {
      unlinkSync(path);
      continue;
    }
    kept.push(path);
  }
  return kept;
}

function shrink(file: string, maxWidth: string): void {
  const out = `${file}.fit`;
  try {
    tool("convert", [file, "-strip", "-resize", `${maxWidth}x>`, out], IMAGEMAGICK);
    execFileSync("mv", [out, file]);
  } catch {
    /* ImageMagick absent: keep the full-size capture */
  }
}

/**
 * Read-time capture: whatever the source gives, stored once so nobody has to
 * find and download it again.
 *
 * A web image is fetched as-is. For a PDF page the stored figure bitmaps come
 * out first — when they survive, the figure needs no cropping at all — and
 * the whole page is rendered alongside as the fallback for vector figures and
 * shredded scans. LOOK at what comes out and delete what you do not want:
 * cropping is not done here, because the crop depends on where the lesson
 * finally puts the figure.
 */
function capture(src: string, dest: string, page: string | undefined): void {
  const maxWidth = flag("max-width", "2400");
  mkdirSync(dirname(resolve(dest)), { recursive: true });

  if (/^https?:\/\//.test(src) && page === undefined) {
    fetchImage(src, dest);
    shrink(dest, maxWidth);
    console.log(`captured -> ${dest}`);
    return;
  }

  let pdf = src;
  if (/^https?:\/\//.test(src)) {
    pdf = join(dirname(resolve(dest)), `.${basename(dest).replace(/\.\w+$/, "")}.pdf`);
    tool("curl", ["-fsSL", "--max-time", "300", "-o", pdf, src], "curl is required");
  }
  if (page === undefined) fail("usage: npm run image -- capture <pdf> <dest.png> <page>");

  const stem = dest.replace(/\.\w+$/, "");
  let embedded = has("no-embedded") ? [] : embeddedFigures(pdf, page, `${stem}-fig`);
  for (const file of embedded) shrink(file, maxWidth);
  pdfPage(pdf, page, dest);
  shrink(dest, maxWidth);

  // A page-sized scan is stored as one bitmap of the whole page: that is the
  // page render again, not a figure. Drop the duplicate.
  const pageProbe = probeImageFile(dest);
  if (!isProbeError(pageProbe)) {
    embedded = embedded.filter((file) => {
      const probe = probeImageFile(file);
      const sameShape =
        !isProbeError(probe) &&
        Math.abs(probe.width - pageProbe.width) / pageProbe.width < 0.05 &&
        Math.abs(probe.height - pageProbe.height) / pageProbe.height < 0.05;
      if (sameShape) unlinkSync(file);
      return !sameShape;
    });
  }

  console.log(
    embedded.length > 0
      ? `captured -> ${dest} (whole page)\n` +
          embedded.map((f) => `          -> ${f} (stored figure — no cropping needed if it is the one)`).join("\n") +
          `\nLOOK at each and delete the ones you do not want.`
      : `captured -> ${dest} (whole page; nothing extractable stored on it — ` +
          `vector figure or a shredded scan, so the figure gets cropped out later)`,
  );
}

function fetchImage(url: string, dest: string): void {
  mkdirSync(dirname(resolve(dest)), { recursive: true });
  try {
    execFileSync(
      "curl",
      [
        "-fL", "--max-time", "120", "--retry", "2",
        // Wikimedia and most publishers reject requests without a real UA.
        "-A", "distillcourse/1.0 (educational course content)",
        "-o", dest, url,
      ],
      { stdio: ["ignore", "ignore", "pipe"] },
    );
  } catch (err) {
    if (existsSync(dest)) unlinkSync(dest);
    fail(`download failed: ${(err as Error).message}`);
  }
  console.log(`downloaded ${url} -> ${dest} (${(statSync(dest).size / 1024).toFixed(0)} KB)`);
  check([dest]);
}

function pdfList(pdf: string): void {
  const pages = flag("pages", "");
  const args = ["-list"];
  if (pages !== "") {
    const [first, last] = pages.split("-");
    args.push("-f", first, "-l", last ?? first);
  }
  process.stdout.write(tool("pdfimages", [...args, pdf], POPPLER));
}

function pdfExtract(pdf: string, page: string, outdir: string): void {
  mkdirSync(resolve(outdir), { recursive: true });
  const prefix = join(outdir, `${basename(pdf).replace(/\.pdf$/i, "")}-p${page}`);
  tool("pdfimages", ["-png", "-f", page, "-l", page, pdf, prefix], POPPLER);
  console.log(`extracted embedded images to ${prefix}-*.png`);
  console.log(
    "Embedded images are the raw stored bitmaps: a figure split into layers " +
      "comes out in pieces, and vector figures do not come out at all. If the " +
      "pieces are wrong, use `pdf-page` + `crop` instead.",
  );
}

function pdfPage(pdf: string, page: string, dest: string): void {
  const dpi = flag("dpi", "200");
  mkdirSync(dirname(resolve(dest)), { recursive: true });
  const prefix = dest.replace(/\.png$/i, "");
  tool(
    "pdftoppm",
    ["-png", "-r", dpi, "-f", page, "-l", page, "-singlefile", pdf, prefix],
    POPPLER,
  );
  console.log(`rendered page ${page} at ${dpi} dpi -> ${prefix}.png`);
  check([`${prefix}.png`]);
}

function crop(src: string, dest: string, geometry: string | undefined): void {
  mkdirSync(dirname(resolve(dest)), { recursive: true });
  const args = [src];
  if (has("trim")) args.push("-trim", "+repage", "-bordercolor", "white", "-border", "12");
  if (geometry !== undefined) args.push("-crop", geometry, "+repage");
  if (!has("trim") && geometry === undefined) {
    fail("usage: npm run image -- crop <src> <dest> <WxH+X+Y> | --trim");
  }
  // Sequence frames must share one canvas, or the carousel jumps between
  // steps: pad the crop out to a common size, anchored top-left.
  const extent = flag("extent", "");
  if (extent !== "") {
    args.push("-background", "white", "-gravity", "northwest", "-extent", extent);
  }
  tool("convert", [...args, dest], IMAGEMAGICK);
  check([dest]);
}

function fit(src: string, dest: string): void {
  const maxWidth = flag("max-width", "2400");
  const quality = flag("quality", "82");
  mkdirSync(dirname(resolve(dest)), { recursive: true });
  const args = [src, "-strip"];
  if (has("flatten")) args.push("-background", "white", "-alpha", "remove", "-alpha", "off");
  args.push("-resize", `${maxWidth}x>`, "-quality", quality);
  tool("convert", [...args, dest], IMAGEMAGICK);
  check([dest]);
}

const args = positional();
switch (command) {
  case "check":
    check(args);
    break;
  case "fetch":
    if (args.length < 2) fail("usage: npm run image -- fetch <url> <dest>");
    fetchImage(args[0], args[1]);
    break;
  case "capture":
    if (args.length < 2) {
      fail("usage: npm run image -- capture <url|pdf> <dest> [page] [--dpi 150]");
    }
    capture(args[0], args[1], args[2]);
    break;
  case "pdf-list":
    if (args.length < 1) fail("usage: npm run image -- pdf-list <pdf> [--pages 1-9]");
    pdfList(args[0]);
    break;
  case "pdf-extract":
    if (args.length < 3) fail("usage: npm run image -- pdf-extract <pdf> <page> <outdir>");
    pdfExtract(args[0], args[1], args[2]);
    break;
  case "pdf-page":
    if (args.length < 3) fail("usage: npm run image -- pdf-page <pdf> <page> <dest.png> [--dpi 200]");
    pdfPage(args[0], args[1], args[2]);
    break;
  case "crop":
    if (args.length < 2) fail("usage: npm run image -- crop <src> <dest> <WxH+X+Y|--trim>");
    crop(args[0], args[1], args[2]);
    break;
  case "fit":
    if (args.length < 2) fail("usage: npm run image -- fit <src> <dest> [--max-width N]");
    fit(args[0], args[1]);
    break;
  default:
    console.log(
      [
        "usage: npm run image -- <command>",
        "  check <file…>                       verify files are real, complete images",
        "  fetch <url> <dest>                  download, then check",
        "  capture <url|pdf> <dest> [page]     grab raw material for the dossier:",
        "                                      stored PDF figures + the page render",
        "                                      [--dpi 200] [--max-width 2400] [--no-embedded]",
        "  pdf-list <pdf> [--pages 1-9]        list images stored in a PDF page",
        "  pdf-extract <pdf> <page> <outdir>   pull embedded images out of a page",
        "  pdf-page <pdf> <page> <dest.png>    render a page      [--dpi 200]",
        "  crop <src> <dest> <WxH+X+Y|--trim>  cut a figure out of a page render",
        "                                      [--extent WxH] pad frames to one size",
        "  fit <src> <dest>                    normalize for the web",
        "                                      [--max-width 2400] [--quality 82] [--flatten]",
      ].join("\n"),
    );
    process.exit(command === undefined ? 0 : 1);
}
