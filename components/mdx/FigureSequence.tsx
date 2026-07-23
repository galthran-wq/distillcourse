import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { figures } from "@/components/figures";
import FrameStepper from "./FrameStepper";
import FrameStepperNodes from "./FrameStepperNodes";

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

  // SVG-file tier: figures/<name>-1.svg, <name>-2.svg, … in the lesson dir.
  let frames: string[] = [];
  if (/^[a-z0-9-]+$/.test(name)) {
    try {
      const dir = join(lessonDir, "figures");
      const re = new RegExp(`^${name}-\\d+\\.svg$`);
      frames = readdirSync(dir)
        .filter((f) => re.test(f))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
        .map((f) => readFileSync(join(dir, f), "utf8"));
    } catch {
      frames = [];
    }
  }

  if (frames.length === 0) {
    return (
      <div className="my-10 rounded-md border border-dashed border-line px-5 py-8 text-center font-mono text-sm text-faint">
        sequence “{name}” has no frames (figures/{name}-1.svg, …)
      </div>
    );
  }

  return <FrameStepper frames={frames} alt={alt} caption={caption} />;
}
