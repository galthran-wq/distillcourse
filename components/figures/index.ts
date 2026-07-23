import type { ComponentType } from "react";
import W2vOneStep from "./examples/W2vOneStep";

export interface FigureComponentProps {
  /** 1-based frame number for multi-frame figures. */
  frame?: number;
}

export interface RegisteredFigure {
  component: ComponentType<FigureComponentProps>;
  /** Number of frames; present only for step-through figures. */
  frames?: number;
}

/**
 * Component-figure registry: PascalCase name -> pure (hook-free, client-free)
 * component. <Figure name="..."> and <FigureSequence name="..."> resolve
 * here; scripts/render-figure.ts renders entries standalone for the
 * figure-artist visual verification loop.
 *
 * Step-through figures declare frames: N (>=2); <FigureSequence name="...">
 * renders the component once per frame with frame={1..N}.
 */
export const figures: Record<string, RegisteredFigure> = {
  W2vOneStep: { component: W2vOneStep },
};
