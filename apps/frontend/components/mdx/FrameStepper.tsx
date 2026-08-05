"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

interface Props {
  /** Inlined SVG markup, one entry per frame, in order. */
  frames: string[];
  alt: string;
  caption?: string;
}

/** Client half of FigureSequence: the step-through carousel. */
export default function FrameStepper({ frames, alt, caption }: Props) {
  const [i, setI] = useState(0);

  return (
    <figure className="my-10">
      <div
        className="figure-svg mx-auto max-w-xl"
        role="img"
        aria-label={`${alt} — step ${i + 1} of ${frames.length}`}
        dangerouslySetInnerHTML={{ __html: frames[i] }}
      />
      <div className="mt-2 flex items-center justify-center gap-3">
        <Button onClick={() => setI(i - 1)} disabled={i === 0} aria-label="Previous step">
          ←
        </Button>
        <span className="font-mono text-[12px] text-faint">
          {i + 1} / {frames.length}
        </span>
        <Button
          onClick={() => setI(i + 1)}
          disabled={i === frames.length - 1}
          aria-label="Next step"
        >
          →
        </Button>
      </div>
      {caption !== undefined && (
        <figcaption className="mt-2 text-center font-mono text-[0.8rem] tracking-wide text-faint">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
