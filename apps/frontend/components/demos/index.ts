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
  WelchTradeoffLab: () =>
    import("./digital-signal-processing/WelchTradeoffLab"),
  BiasVarianceExplorer: () =>
    import("./classical-ml-interview/BiasVarianceExplorer"),
  GradientDescentExplorer: () =>
    import("./classical-ml-interview/GradientDescentExplorer"),
  KnnBoundaryExplorer: () =>
    import("./classical-ml-interview/KnnBoundaryExplorer"),
  CoefficientPathExplorer: () =>
    import("./classical-ml-interview/CoefficientPathExplorer"),
  ThresholdMetricsExplorer: () =>
    import("./classical-ml-interview/ThresholdMetricsExplorer"),
  SvmMarginExplorer: () =>
    import("./classical-ml-interview/SvmMarginExplorer"),
  KernelBoundaryExplorer: () =>
    import("./classical-ml-interview/KernelBoundaryExplorer"),
  TreeDepthExplorer: () =>
    import("./classical-ml-interview/TreeDepthExplorer"),
  BoostingStagesExplorer: () =>
    import("./classical-ml-interview/BoostingStagesExplorer"),
  KMeansStepper: () => import("./classical-ml-interview/KMeansStepper"),
  PcaExplorer: () => import("./classical-ml-interview/PcaExplorer"),
  PerplexityExplorer: () =>
    import("./classical-ml-interview/PerplexityExplorer"),
  EmStepper: () => import("./classical-ml-interview/EmStepper"),
  SbgFitLab: () => import("./quantitative-mba/SbgFitLab"),
  SmootherRobustnessExplorer: () =>
    import("./classical-ml/SmootherRobustnessExplorer"),
  NeighborEmbeddingExplorer: () =>
    import("./classical-ml/NeighborEmbeddingExplorer"),
  GpPosteriorExplorer: () => import("./classical-ml/GpPosteriorExplorer"),
  TailLatencyExplorer: () =>
    import("./ml-system-design/TailLatencyExplorer"),
  ReshardingExplorer: () =>
    import("./ml-system-design/ReshardingExplorer"),
  ArbitrageLock: () => import("./quant/ArbitrageLock"),
  ReplicationWalker: () => import("./quant/ReplicationWalker"),
  ExerciseRuleExplorer: () => import("./quant/ExerciseRuleExplorer"),
  QuadraticVariationZoom: () => import("./quant/QuadraticVariationZoom"),
};
