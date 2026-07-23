import type { ComponentType } from "react";

/**
 * Demo registry: PascalCase name -> lazy loader. The <Demo> MDX component
 * resolves `name` here; /demo-builder appends one entry per component it
 * creates. The content validator checks reviewed+ lessons' demo components
 * against this file.
 */
export const demos: Record<
  string,
  () => Promise<{ default: ComponentType<object> }>
> = {
  SurprisalSlider: () => import("./information-theory/SurprisalSlider"),
  EntropyExplorer: () => import("./information-theory/EntropyExplorer"),
};
