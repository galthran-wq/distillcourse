import { readFileSync } from "node:fs";
import { join, normalize } from "node:path";
import { figures } from "@/components/figures";

/** Props authored in MDX (the lesson page injects lessonDir). */
export interface FigureProps {
  /** Raw-SVG figure: path relative to the lesson directory. */
  src?: string;
  /** Component figure: name registered in components/figures/index.ts. */
  name?: string;
  alt: string;
  caption?: string;
  /** Voita-style text wrap: float the figure beside the prose. */
  float?: "left" | "right";
  /** Max width when floated: s ≈ 260px, m ≈ 380px (default m). */
  width?: "s" | "m";
}

interface Props extends FigureProps {
  /** Injected by the lesson page, not authored in MDX. */
  lessonDir: string;
}

/**
 * Two figure tiers (docs/figures.md): simple raw SVGs inlined from the
 * lesson's figures/ dir (currentColor -> theme-aware), and rich component
 * figures (HTML + KaTeX + SVG) resolved from the registry.
 */
export default function Figure({
  src,
  name,
  alt,
  caption,
  float,
  width,
  lessonDir,
}: Props) {
  let body: React.ReactNode = null;

  if (name !== undefined) {
    const reg = figures[name];
    if (reg !== undefined) {
      const Comp = reg.component;
      body = (
        <div className="mx-auto max-w-2xl" role="img" aria-label={alt}>
          <Comp />
        </div>
      );
    }
  } else if (src !== undefined) {
    const rel = normalize(src.replace(/^\.\//, ""));
    let svg: string | null = null;
    if (!rel.startsWith("..")) {
      try {
        svg = readFileSync(join(lessonDir, rel), "utf8");
      } catch {
        svg = null;
      }
    }
    if (svg !== null) {
      body = (
        <div
          className="figure-svg mx-auto max-w-xl"
          role="img"
          aria-label={alt}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      );
    }
  }

  const floatClass =
    float !== undefined
      ? ` figure-float-${float} figure-w-${width ?? "m"}`
      : "";

  return (
    <figure className={`my-10${floatClass}`}>
      {body ?? (
        <div className="rounded-md border border-dashed border-line px-5 py-8 text-center font-mono text-sm text-faint">
          figure “{name ?? src}” missing
        </div>
      )}
      {caption !== undefined && (
        <figcaption className="mt-2 text-center font-mono text-[0.8rem] tracking-wide text-faint">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
