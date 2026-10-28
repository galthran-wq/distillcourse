import { readdirSync } from "node:fs";
import { join } from "node:path";
import { figures } from "@/components/figures";
import { creditFor, loadCredits } from "@/lib/content/credits";
import { loadFigureSvg } from "@/lib/content/figure-svg";
import { RASTER_EXTENSIONS } from "@/lib/content/images";
import FrameStepper from "./FrameStepper";
import FrameStepperNodes from "./FrameStepperNodes";
import SourcedImage, { resolveImage } from "./SourcedImage";

interface Props {
  /**
   * Sequence name. Kebab-case: frames are figures/<name>-1.svg,
   * <name>-2.svg, … in the lesson dir. PascalCase: a component figure
   * registered in components/figures/index.ts with frames: N (>=2).
   */
  name: string;
  alt: string;
  caption?: string;
  /** Injected by the lesson page, not authored in MDX. */
  lessonDir: string;
}

/**
 * Server component: resolves the sequence's frames and hands them to a
 * client stepper. Two tiers, mirroring Figure: PascalCase names render the
 * registered component once per frame (frame={1..N}); kebab-case names
 * discover and inline SVG files (numerically sorted). Same currentColor /
 * theme rationale as Figure.
 */
export default function FigureSequence({ name, alt, caption, lessonDir }: Props) {
  // Component tier: registered multi-frame figure.
  if (/^[A-Z][A-Za-z0-9]*$/.test(name)) {
    const reg = figures[name];
    if (reg !== undefined && reg.frames !== undefined && reg.frames >= 2) {
      const Comp = reg.component;
      const nodes = Array.from({ length: reg.frames }, (_, i) => (
        <Comp key={i} frame={i + 1} />
      ));
      return <FrameStepperNodes frames={nodes} alt={alt} caption={caption} />;
    }
    return (
      <div className="my-10 rounded-md border border-dashed border-line px-5 py-8 text-center font-mono text-sm text-faint">
        sequence “{name}” is not registered with frames &gt;= 2 in
        components/figures/index.ts
      </div>
    );
  }

  // File tiers: figures/<name>-1.<ext>, <name>-2.<ext>, … in the lesson dir.
  let files: string[] = [];
  if (/^[a-z0-9-]+$/.test(name)) {
    try {
      const re = new RegExp(
        `^${name}-\\d+\\.(svg|${RASTER_EXTENSIONS.map((e) => e.slice(1)).join("|")})$`,
      );
      files = readdirSync(join(lessonDir, "figures"))
        .filter((f) => re.test(f))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    } catch {
      files = [];
    }
  }

  // Sourced-image tier: raster frames step through the same carousel, each
  // frame carrying its own credit line (frames may come from one plate or
  // from several sources).
  if (files.length > 0 && !files[0].endsWith(".svg")) {
    const credits = loadCredits(lessonDir);
    const resolved = files.flatMap((f) => {
      const image = resolveImage(lessonDir, `figures/${f}`);
      return image === undefined ? [] : [{ file: f, image }];
    });
    if (resolved.length > 0) {
      return (
        <FrameStepperNodes
          frames={resolved.map(({ file, image }) => (
            <SourcedImage
              key={file}
              image={image}
              alt={alt}
              background={creditFor(credits, file)?.background}
            />
          ))}
          alt={alt}
          caption={caption}
        />
      );
    }
  }

  const frames = files
    .filter((f) => f.endsWith(".svg"))
    .flatMap((f) => loadFigureSvg(lessonDir, `figures/${f}`) ?? []);

  if (frames.length === 0) {
    return (
      <div className="my-10 rounded-md border border-dashed border-line px-5 py-8 text-center font-mono text-sm text-faint">
        sequence “{name}” has no frames (figures/{name}-1.svg|.png, …)
      </div>
    );
  }

  return <FrameStepper frames={frames} alt={alt} caption={caption} />;
}
