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
  ArithmeticInterval: () => import("./information-theory/ArithmeticInterval"),
  EntropyExplorer: () => import("./information-theory/EntropyExplorer"),
  CodewordBudget: () => import("./information-theory/CodewordBudget"),
  BlockCodingGap: () => import("./information-theory/BlockCodingGap"),
  JointEntropyGrid: () => import("./information-theory/JointEntropyGrid"),
  MutualInfoDial: () => import("./information-theory/MutualInfoDial"),
  ChannelCapacityDial: () => import("./information-theory/ChannelCapacityDial"),
  KLMismatch: () => import("./information-theory/KLMismatch"),
  ChannelCodingThreshold: () =>
    import("./information-theory/ChannelCodingThreshold"),
  HammingSyndrome: () => import("./information-theory/HammingSyndrome"),
  PredictiveCompressor: () =>
    import("./information-theory/PredictiveCompressor"),
  MaxEntDice: () => import("./information-theory/MaxEntDice"),
  RateDistortionCurve: () =>
    import("./information-theory/RateDistortionCurve"),
  TwoPartCode: () => import("./information-theory/TwoPartCode"),
  InformationPlane: () => import("./information-theory/InformationPlane"),
  InfoNCESaturation: () => import("./information-theory/InfoNCESaturation"),
  LZ77Window: () => import("./information-theory/LZ77Window"),
  MIEstimatorBias: () => import("./information-theory/MIEstimatorBias"),
};
