"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

interface Props {
  /** One rendered React node per frame, in order. */
  frames: React.ReactNode[];
  alt: string;
  caption?: string;
}

/**
 * Client half of the component-tier FigureSequence: the same step-through
 * UI as FrameStepper, but for React nodes instead of raw SVG strings. All
 * frames are kept in the DOM (server-rendered children survive inside a
 * client component) and every frame except the active one is hidden.
 */
export default function FrameStepperNodes({ frames, alt, caption }: Props) {
  const [i, setI] = useState(0);

  return (
    <figure className="my-10">
      <div
        className="figure-scroll"
        role="img"
        aria-label={`${alt} — step ${i + 1} of ${frames.length}`}
      >
        {frames.map((frame, idx) => (
          <div key={idx} style={idx === i ? undefined : { display: "none" }}>
            {frame}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-center gap-3">
        <Button onClick={() => setI(i - 1)} disabled={i === 0} aria-label="Previous step">
          ←
        </Button>
        <span className="text-[13px] tabular-nums text-faint">
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
        <figcaption className="mt-2">{caption}</figcaption>
      )}
    </figure>
  );
}
