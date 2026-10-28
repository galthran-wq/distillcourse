import { join, normalize } from "node:path";
import {
  assetUrl,
  isProbeError,
  isRasterFile,
  probeImageFile,
  slugsFromLessonDir,
} from "@/lib/content/images";
import type { ImageCredit } from "@/lib/content/schema";
import { LABEL_CLASS } from "@/components/ui/styles";
import Lightbox from "./Lightbox";

/**
 * The sourced-image tier (docs/figures.md): a real photograph, scan, or
 * published plot that cannot honestly be redrawn. The bytes live next to the
 * lesson's SVGs and are copied into `public/course-assets/` by
 * `scripts/sync-assets.ts`; provenance lives in `figures/credits.yaml` and is
 * always rendered with the image.
 */

export interface ResolvedImage {
  url: string;
  width: number;
  height: number;
}

/**
 * Resolves a lesson-relative raster path to its public URL plus intrinsic
 * size (given to the browser so the page does not jump while loading).
 * Returns undefined for anything unreadable — the caller renders its own
 * "missing figure" placeholder, and the linter turns the same condition into
 * a validation error.
 */
export function resolveImage(
  lessonDir: string,
  src: string,
): ResolvedImage | undefined {
  const rel = normalize(src.replace(/^\.\//, ""));
  if (rel.startsWith("..") || !isRasterFile(rel)) return undefined;
  const slugs = slugsFromLessonDir(lessonDir);
  if (slugs === undefined) return undefined;
  const probe = probeImageFile(join(lessonDir, rel));
  if (isProbeError(probe)) return undefined;
  return {
    url: assetUrl(slugs.course, slugs.lesson, rel),
    width: probe.width,
    height: probe.height,
  };
}

export default function SourcedImage({
  image,
  alt,
  background = "none",
}: {
  image: ResolvedImage;
  alt: string;
  background?: ImageCredit["background"];
}) {
  return (
    // Clickable: expands to the full-resolution file in a modal (Lightbox).
    <Lightbox
      src={image.url}
      alt={alt}
      width={image.width}
      height={image.height}
      className={`mx-auto block h-auto w-full rounded-sm${
        background === "light" ? " bg-white p-3 [filter:var(--photo-filter)]" : ""
      }`}
    />
  );
}

/**
 * Provenance of every sourced image in the lesson, rendered at the end of
 * <References> — not under the figures, where the licence text drowns the
 * caption. One entry per image, in credits.yaml order.
 */
export function ImageCredits({ credits }: { credits: ImageCredit[] }) {
  if (credits.length === 0) return null;
  const link = "underline decoration-line underline-offset-2 hover:decoration-accent";
  return (
    <div className="mt-6">
      <p className={`mb-2 ${LABEL_CLASS}`}>
        Image credits
      </p>
      <ul className="list-none space-y-1.5 pl-0 text-[0.85rem] leading-relaxed text-soft">
        {credits.map((c) => (
          <li key={c.file}>
            <span className="italic">{c.title}</span> — {c.credit}
            {c.located !== undefined && `, ${c.located}`}.{" "}
            <a href={c.source_url} target="_blank" rel="noopener noreferrer" className={link}>
              source
            </a>
            {" · "}
            {c.license_url !== undefined ? (
              <a href={c.license_url} target="_blank" rel="noopener noreferrer" className={link}>
                {c.license}
              </a>
            ) : (
              c.license
            )}
            {c.modifications !== undefined && ` · ${c.modifications}`}
          </li>
        ))}
      </ul>
    </div>
  );
}
