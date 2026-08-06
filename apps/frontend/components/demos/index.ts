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
  GrowthRaceChart: () =>
    import("./algorithms-and-data-structures/GrowthRaceChart"),
  RecursionTreeExplorer: () =>
    import("./algorithms-and-data-structures/RecursionTreeExplorer"),
  DynamicArrayGrowth: () =>
    import("./algorithms-and-data-structures/DynamicArrayGrowth"),
  HashCollisionExplorer: () =>
    import("./algorithms-and-data-structures/HashCollisionExplorer"),
  BSTInsertDelete: () =>
    import("./algorithms-and-data-structures/BSTInsertDelete"),
  RotationBalancer: () =>
    import("./algorithms-and-data-structures/RotationBalancer"),
  HeapSiftVisualizer: () =>
    import("./algorithms-and-data-structures/HeapSiftVisualizer"),
  UnionFindPathCompression: () =>
    import("./algorithms-and-data-structures/UnionFindPathCompression"),
  SortRaceComparator: () =>
    import("./algorithms-and-data-structures/SortRaceComparator"),
  QuickselectPivotChooser: () =>
    import("./algorithms-and-data-structures/QuickselectPivotChooser"),
  GreedyVsOptimalCounterexample: () =>
    import("./algorithms-and-data-structures/GreedyVsOptimalCounterexample"),
  AliasThresholdLab: () =>
    import("./digital-signal-processing/AliasThresholdLab"),
  EchoKernelLab: () => import("./digital-signal-processing/EchoKernelLab"),
  FeedbackStabilityLab: () =>
    import("./digital-signal-processing/FeedbackStabilityLab"),
  QuadratureDetectorLab: () =>
    import("./digital-signal-processing/QuadratureDetectorLab"),
  PaddingVsDataLab: () =>
    import("./digital-signal-processing/PaddingVsDataLab"),
  FftBudgetLab: () => import("./digital-signal-processing/FftBudgetLab"),
  DtmfDecisionLab: () =>
    import("./digital-signal-processing/DtmfDecisionLab"),
  WeakToneWindowLab: () =>
    import("./digital-signal-processing/WeakToneWindowLab"),
};
