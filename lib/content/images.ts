import { readFileSync, statSync } from "node:fs";
import { basename, extname } from "node:path";

/**
 * Sourced-image support (docs/figures.md, third figure tier): raster files
 * that live next to a lesson's SVGs in `figures/`.
 *
 * Everything here is dependency-free on purpose — `npm run validate` must be
 * able to prove an image is a real, complete image without ImageMagick or any
 * native module. The heavier operations (fetching, PDF extraction, resizing)
 * live in `scripts/image.ts`, which shells out to poppler/ImageMagick.
 */

export const RASTER_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif"] as const;

export function isRasterFile(path: string): boolean {
  return (RASTER_EXTENSIONS as readonly string[]).includes(
    extname(path).toLowerCase(),
  );
}

export interface ImageInfo {
  format: "png" | "jpeg" | "webp" | "gif";
  width: number;
  height: number;
  bytes: number;
  /** The container's end marker is missing — a half-downloaded file. */
  truncated: boolean;
}

export type ImageProbe = ImageInfo | { error: string };

export function isProbeError(p: ImageProbe): p is { error: string } {
  return "error" in p;
}

function endsWith(buf: Buffer, marker: Buffer, searchWindow = 64): boolean {
  const from = Math.max(0, buf.length - searchWindow);
  return buf.lastIndexOf(marker, buf.length) >= from;
}

function probePng(buf: Buffer): ImageProbe {
  if (buf.length < 24) return { error: "PNG header is incomplete" };
  if (buf.toString("ascii", 12, 16) !== "IHDR") {
    return { error: "PNG has no IHDR chunk where one must be" };
  }
  return {
    format: "png",
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
    bytes: buf.length,
    truncated: !endsWith(buf, Buffer.from("IEND", "ascii"), 32),
  };
}

// JPEG carries its size in a start-of-frame segment; which SOF marker appears
// depends on the encoding (baseline/progressive/lossless), so walk the
// segment chain rather than guessing an offset.
const SOF_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);

function probeJpeg(buf: Buffer): ImageProbe {
  let off = 2;
  while (off + 9 < buf.length) {
    if (buf[off] !== 0xff) {
      off++; // resync over padding bytes
      continue;
    }
    const marker = buf[off + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      off += 2;
      continue;
    }
    const length = buf.readUInt16BE(off + 2);
    if (SOF_MARKERS.has(marker)) {
      return {
        format: "jpeg",
        height: buf.readUInt16BE(off + 5),
        width: buf.readUInt16BE(off + 7),
        bytes: buf.length,
        truncated: !endsWith(buf, Buffer.from([0xff, 0xd9])),
      };
    }
    if (marker === 0xda) break; // start of scan: no size found before the data
    off += 2 + length;
  }
  return { error: "JPEG has no start-of-frame segment (file is not a valid JPEG)" };
}

function probeWebp(buf: Buffer): ImageProbe {
  if (buf.length < 30) return { error: "WebP header is incomplete" };
  // The RIFF size field counts every byte after it; a short file is a partial
  // download even though WebP has no end marker to look for.
  const declared = buf.readUInt32LE(4) + 8;
  const truncated = buf.length < declared;
  const chunk = buf.toString("ascii", 12, 16);
  if (chunk === "VP8X") {
    return {
      format: "webp",
      width: (buf.readUIntLE(24, 3) & 0xffffff) + 1,
      height: (buf.readUIntLE(27, 3) & 0xffffff) + 1,
      bytes: buf.length,
      truncated,
    };
  }
  if (chunk === "VP8 ") {
    const start = buf.indexOf(Buffer.from([0x9d, 0x01, 0x2a]), 20);
    if (start < 0 || start + 7 > buf.length) {
      return { error: "WebP (lossy) frame header is unreadable" };
    }
    return {
      format: "webp",
      width: buf.readUInt16LE(start + 3) & 0x3fff,
      height: buf.readUInt16LE(start + 5) & 0x3fff,
      bytes: buf.length,
      truncated,
    };
  }
  if (chunk === "VP8L") {
    const bits = buf.readUInt32LE(21);
    return {
      format: "webp",
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
      bytes: buf.length,
      truncated,
    };
  }
  return { error: `WebP has an unknown chunk type "${chunk}"` };
}

function probeGif(buf: Buffer): ImageProbe {
  if (buf.length < 10) return { error: "GIF header is incomplete" };
  return {
    format: "gif",
    width: buf.readUInt16LE(6),
    height: buf.readUInt16LE(8),
    bytes: buf.length,
    truncated: buf[buf.length - 1] !== 0x3b,
  };
}

/**
 * Reads the image's own header — the file's extension is never trusted, so a
 * downloaded HTML error page saved as `.jpg` is reported as what it is.
 */
export function probeImageBuffer(buf: Buffer): ImageProbe {
  if (buf.length === 0) return { error: "file is empty" };
  if (buf.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return probePng(buf);
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) return probeJpeg(buf);
  if (
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    return probeWebp(buf);
  }
  if (buf.toString("ascii", 0, 3) === "GIF") return probeGif(buf);

  const head = buf.toString("utf8", 0, 200).trim().toLowerCase();
  if (head.startsWith("<!doctype html") || head.startsWith("<html")) {
    return { error: "file is an HTML page, not an image (the download failed)" };
  }
  if (head.startsWith("<svg") || head.startsWith("<?xml")) {
    return { error: "file is SVG/XML — use the raw-SVG tier instead" };
  }
  if (head.startsWith("%pdf")) return { error: "file is a PDF, not an image" };
  return { error: "unrecognized image format (not PNG/JPEG/WebP/GIF)" };
}

export function probeImageFile(path: string): ImageProbe {
  let buf: Buffer;
  try {
    buf = readFileSync(path);
  } catch (err) {
    return { error: `cannot read file: ${(err as Error).message}` };
  }
  return probeImageBuffer(buf);
}

export function fileBytes(path: string): number {
  try {
    return statSync(path).size;
  } catch {
    return 0;
  }
}

/** Quality floors for a sourced image used as a lesson figure. */
export const MIN_FIGURE_WIDTH = 480;
export const MAX_FIGURE_BYTES = 2_500_000;

/**
 * Public URL of a lesson asset. Raster figures are copied out of the content
 * tree into `public/course-assets/<course>/<lesson>/` by
 * `scripts/sync-assets.ts` (Next only serves static files from `public`).
 */
export function assetUrl(course: string, lesson: string, file: string): string {
  return `/course-assets/${course}/${lesson}/${basename(file)}`;
}

/** Splits `…/content/courses/<course>/lessons/<lesson>` into its two slugs. */
export function slugsFromLessonDir(
  lessonDir: string,
): { course: string; lesson: string } | undefined {
  const parts = lessonDir.split(/[/\\]/).filter((p) => p.length > 0);
  const i = parts.lastIndexOf("lessons");
  if (i < 1 || i + 1 >= parts.length) return undefined;
  return { course: parts[i - 1], lesson: parts[i + 1] };
}
