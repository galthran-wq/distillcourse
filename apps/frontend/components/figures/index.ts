import type { ComponentType } from "react";
import W2vOneStep from "./examples/W2vOneStep";
import ConvolutionThreeViews from "./digital-signal-processing/ConvolutionThreeViews";
import PoleModePairings from "./digital-signal-processing/PoleModePairings";
import ResonatorStateLedger from "./digital-signal-processing/ResonatorStateLedger";
import X8ValidationDiagnostics from "./digital-signal-processing/X8ValidationDiagnostics";
import X8IdentificationPipeline from "./digital-signal-processing/X8IdentificationPipeline";
import PhasorCoordinateLedger from "./digital-signal-processing/PhasorCoordinateLedger";
import ComplexModeEigenfunction from "./digital-signal-processing/ComplexModeEigenfunction";
import ConvolutionMultiplicationBridge from "./digital-signal-processing/ConvolutionMultiplicationBridge";
import GroupDelayPackets from "./digital-signal-processing/GroupDelayPackets";
import DftBasisCorrelations from "./digital-signal-processing/DftBasisCorrelations";
import RealDftConventionLedger from "./digital-signal-processing/RealDftConventionLedger";
import PaddingDurationResolution from "./digital-signal-processing/PaddingDurationResolution";
import FftButterflyLedger from "./digital-signal-processing/FftButterflyLedger";
import FftCostGrowth from "./digital-signal-processing/FftCostGrowth";
import FftMemoryOrderLedger from "./digital-signal-processing/FftMemoryOrderLedger";
import DtmfFeatureTimingPipeline from "./digital-signal-processing/DtmfFeatureTimingPipeline";
import DtmfCoordinateComparison from "./digital-signal-processing/DtmfCoordinateComparison";
import DtmfCoordinateCostLatencyLedger from "./digital-signal-processing/DtmfCoordinateCostLatencyLedger";
import WindowShapeSpectrumPair from "./digital-signal-processing/WindowShapeSpectrumPair";
import WindowCalibrationLedger from "./digital-signal-processing/WindowCalibrationLedger";
import WindowTradeoffMap from "./digital-signal-processing/WindowTradeoffMap";
import PeakParabolaFit from "./digital-signal-processing/PeakParabolaFit";
import PhaseFalseResolution from "./digital-signal-processing/PhaseFalseResolution";
import LocalizationResolutionLedger from "./digital-signal-processing/LocalizationResolutionLedger";
import PeriodogramVarianceEnvelope from "./digital-signal-processing/PeriodogramVarianceEnvelope";
import WelchAveragingPipeline from "./digital-signal-processing/WelchAveragingPipeline";
import BiasVarianceProofSteps from "./classical-ml-interview/BiasVarianceProofSteps";
import LogisticGradientSteps from "./classical-ml-interview/LogisticGradientSteps";
import OddsRatioCard from "./classical-ml-interview/OddsRatioCard";
import CeVsMseLoss from "./classical-ml-interview/CeVsMseLoss";
import SpamPosteriorSteps from "./classical-ml-interview/SpamPosteriorSteps";
import ZeroCountRepair from "./classical-ml-interview/ZeroCountRepair";
import NbLinearScore from "./classical-ml-interview/NbLinearScore";
import GenDiscTaxonomy from "./classical-ml-interview/GenDiscTaxonomy";
import GdaSigmoidSteps from "./classical-ml-interview/GdaSigmoidSteps";
import GenDiscScorecard from "./classical-ml-interview/GenDiscScorecard";
import BernoulliExpFamSteps from "./classical-ml-interview/BernoulliExpFamSteps";
import GlmAssemblyLine from "./classical-ml-interview/GlmAssemblyLine";
import UniformGradientCard from "./classical-ml-interview/UniformGradientCard";
import PoissonCalibrationVerdict from "./classical-ml-interview/PoissonCalibrationVerdict";
import ConfusionMatrixMaster from "./classical-ml-interview/ConfusionMatrixMaster";
import HoeffdingBin from "./classical-ml-interview/HoeffdingBin";
import VcBoundAnatomy from "./classical-ml-interview/VcBoundAnatomy";
import KmeansDescentLemmas from "./classical-ml-interview/KmeansDescentLemmas";
import CodeTreeCorrespondence from "./information-theory/CodeTreeCorrespondence";
import NonPrefixAmbiguity from "./information-theory/NonPrefixAmbiguity";
import TwoCodesOneSource from "./information-theory/TwoCodesOneSource";
import EntropyFloor from "./information-theory/EntropyFloor";
import SubtreeClaim from "./information-theory/SubtreeClaim";
import ImpossibleVsTight from "./information-theory/ImpossibleVsTight";
import McMillanReach from "./information-theory/McMillanReach";
import HuffmanResult from "./information-theory/HuffmanResult";
import TwoHuffmanTrees from "./information-theory/TwoHuffmanTrees";
import OneBitGap from "./information-theory/OneBitGap";
import CodeAsBet from "./information-theory/CodeAsBet";
import CostDecomposition from "./information-theory/CostDecomposition";
import ShannonCodeRounding from "./information-theory/ShannonCodeRounding";
import TypicalSetMap from "./information-theory/TypicalSetMap";
import EntropyWall from "./information-theory/EntropyWall";
import EntropySplitBar from "./information-theory/EntropySplitBar";
import MutualInfoArea from "./information-theory/MutualInfoArea";
import JointVsProduct from "./information-theory/JointVsProduct";
import CorrelationBlindSpot from "./information-theory/CorrelationBlindSpot";
import DpiMergeDrop from "./information-theory/DpiMergeDrop";
import DpiMarkovChain from "./information-theory/DpiMarkovChain";
import DpiProofTwoWays from "./information-theory/DpiProofTwoWays";
import DpiCeilingStack from "./information-theory/DpiCeilingStack";
import DpiSufficiencyBars from "./information-theory/DpiSufficiencyBars";
import ApproximationsLadder from "./information-theory/ApproximationsLadder";
import BitsPerContext from "./information-theory/BitsPerContext";
import GuessRankHistogram from "./information-theory/GuessRankHistogram";
import RedundancyBar from "./information-theory/RedundancyBar";
import BscTransition from "./information-theory/BscTransition";
import CapacityOverInputs from "./information-theory/CapacityOverInputs";
import BscCapacityDerivation from "./information-theory/BscCapacityDerivation";
import BscCapacityCurve from "./information-theory/BscCapacityCurve";
import BecTransition from "./information-theory/BecTransition";
import BscVsBecBars from "./information-theory/BscVsBecBars";
import TwoLimitsMap from "./information-theory/TwoLimitsMap";
import CodingPipeline from "./information-theory/CodingPipeline";
import CapacityThreshold from "./information-theory/CapacityThreshold";
import ThresholdSharpens from "./information-theory/ThresholdSharpens";
import JointTypicalityDecode from "./information-theory/JointTypicalityDecode";
import ConverseChain from "./information-theory/ConverseChain";
import HammingVenn from "./information-theory/HammingVenn";
import HammingVsRepetition from "./information-theory/HammingVsRepetition";
import KlGapBars from "./information-theory/KlGapBars";
import JensenChord from "./information-theory/JensenChord";
import KlAsymmetryPanels from "./information-theory/KlAsymmetryPanels";
import MissingOutcomeBlowup from "./information-theory/MissingOutcomeBlowup";
import LogLossSurprisal from "./information-theory/LogLossSurprisal";
import CrossEntropyStack from "./information-theory/CrossEntropyStack";
import TrainingShrinksKl from "./information-theory/TrainingShrinksKl";
import OneHotCollapse from "./information-theory/OneHotCollapse";
import ConfidentWrongBlowup from "./information-theory/ConfidentWrongBlowup";
import PredictThenCode from "./information-theory/PredictThenCode";
import PredictorCompressorLoop from "./information-theory/PredictorCompressorLoop";
import StreamCostStack from "./information-theory/StreamCostStack";
import BitsPerCharLadder from "./information-theory/BitsPerCharLadder";
import CourseSpine from "./information-theory/CourseSpine";
import ThreeProgramsBars from "./information-theory/ThreeProgramsBars";
import InterpreterOverhead from "./information-theory/InterpreterOverhead";
import SelfExtractingArchive from "./information-theory/SelfExtractingArchive";
import IncompressibleCount from "./information-theory/IncompressibleCount";
import BerryLoop from "./information-theory/BerryLoop";
import ComplexityMeetsEntropy from "./information-theory/ComplexityMeetsEntropy";
import CompressionCeilingLadder from "./information-theory/CompressionCeilingLadder";
import FeasibleSetSimplex from "./information-theory/FeasibleSetSimplex";
import LambdaTiltDial from "./information-theory/LambdaTiltDial";
import MaxEntFormula from "./information-theory/MaxEntFormula";
import BoltzmannSoftmax from "./information-theory/BoltzmannSoftmax";
import RdPlane from "./information-theory/RdPlane";
import RdObjective from "./information-theory/RdObjective";
import CapacityVsRateDistortion from "./information-theory/CapacityVsRateDistortion";
import GaussianRdCurve from "./information-theory/GaussianRdCurve";
import NeuralCodecLoop from "./information-theory/NeuralCodecLoop";
import CodecIdentity from "./information-theory/CodecIdentity";
import ThreeStringsThreeCodes from "./information-theory/ThreeStringsThreeCodes";
import TwoPartMessage from "./information-theory/TwoPartMessage";
import PolyFitTally from "./information-theory/PolyFitTally";
import MarkovUCurve from "./information-theory/MarkovUCurve";
import ParameterPrecision from "./information-theory/ParameterPrecision";
import AdjustedRateUCurves from "./information-theory/AdjustedRateUCurves";
import OccamFactorSplit from "./information-theory/OccamFactorSplit";
import RegularVsSingular from "./information-theory/RegularVsSingular";
import IbVsRd from "./information-theory/IbVsRd";
import IbObjective from "./information-theory/IbObjective";
import IbToyMerges from "./information-theory/IbToyMerges";
import IbPlane from "./information-theory/IbPlane";
import IbGibbsEncoder from "./information-theory/IbGibbsEncoder";
import IbBetaExtremes from "./information-theory/IbBetaExtremes";
import VibVsVae from "./information-theory/VibVsVae";
import ContrastiveLineup from "./information-theory/ContrastiveLineup";
import InfonceDerivation from "./information-theory/InfonceDerivation";
import CertifiedBitsBudget from "./information-theory/CertifiedBitsBudget";
import InfonceToyTally from "./information-theory/InfonceToyTally";
import InfonceSaturationCurves from "./information-theory/InfonceSaturationCurves";
import CpcPipeline from "./information-theory/CpcPipeline";
import NeuronAsChannel from "./information-theory/NeuronAsChannel";
import DirectMethodSteps from "./information-theory/DirectMethodSteps";
import MiBeatsTuningCurve from "./information-theory/MiBeatsTuningCurve";
import BitsPerSpikeTally from "./information-theory/BitsPerSpikeTally";
import CodingEfficiencyBars from "./information-theory/CodingEfficiencyBars";
import EstimationBias from "./information-theory/EstimationBias";
import UnitsBridge from "./information-theory/UnitsBridge";
import LandauerErasure from "./information-theory/LandauerErasure";
import FeedbackSecondLaw from "./information-theory/FeedbackSecondLaw";
import TwoPhysicsFaces from "./information-theory/TwoPhysicsFaces";
import GroupingTree from "./information-theory/GroupingTree";
import CapacityPacking from "./information-theory/CapacityPacking";
import LossVsGradient from "./information-theory/LossVsGradient";
import AdaptiveCoderStep from "./information-theory/AdaptiveCoderStep";
import UkSeparation from "./information-theory/UkSeparation";
import SzilardFreeEnergy from "./information-theory/SzilardFreeEnergy";
import DeflatePipeline from "./information-theory/DeflatePipeline";
import FanoTwoExpansions from "./information-theory/FanoTwoExpansions";
import FanoLeCamReduction from "./information-theory/FanoLeCamReduction";
import BitsPerByteConversion from "./information-theory/BitsPerByteConversion";
import TokenizerRankingFlip from "./information-theory/TokenizerRankingFlip";
import ModelCoderPipeline from "./information-theory/ModelCoderPipeline";
import GlmAssemblyDiagram from "./classical-ml/GlmAssemblyDiagram";
import OneGradientThreeModels from "./classical-ml/OneGradientThreeModels";
import NewtonPriceLedger from "./classical-ml/NewtonPriceLedger";
import SgdTwoTargets from "./classical-ml/SgdTwoTargets";
import LarPathSteps from "./classical-ml/LarPathSteps";
import ElasticNetGrouping from "./classical-ml/ElasticNetGrouping";
import BlrSquareCompletion from "./classical-ml/BlrSquareCompletion";
import OptimismFormulaAnatomy from "./classical-ml/OptimismFormulaAnatomy";
import VarianceFormulaAnatomy from "./classical-ml/VarianceFormulaAnatomy";
import AdaboostStagewiseCrosswalk from "./classical-ml/AdaboostStagewiseCrosswalk";
import TwoBlockDescent from "./classical-ml/TwoBlockDescent";
import LogSumApart from "./classical-ml/LogSumApart";
import LaplacianQuadraticForm from "./classical-ml/LaplacianQuadraticForm";
import RelaxationFeasibleSets from "./classical-ml/RelaxationFeasibleSets";
import SpectralEmbeddingRows from "./classical-ml/SpectralEmbeddingRows";
import UmapConstructionStrip from "./classical-ml/UmapConstructionStrip";
import GpInheritance from "./classical-ml/GpInheritance";
import GpPredictiveDissection from "./classical-ml/GpPredictiveDissection";
import KernelMachineFamily from "./classical-ml/KernelMachineFamily";
import Co2KernelLedger from "./classical-ml/Co2KernelLedger";
import RffIdentityDissected from "./classical-ml/RffIdentityDissected";
import ClassicalSpineMap from "./classical-ml/ClassicalSpineMap";

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
  ConvolutionThreeViews: { component: ConvolutionThreeViews },
  PoleModePairings: { component: PoleModePairings },
  ResonatorStateLedger: { component: ResonatorStateLedger },
  X8ValidationDiagnostics: { component: X8ValidationDiagnostics },
  X8IdentificationPipeline: { component: X8IdentificationPipeline },
  PhasorCoordinateLedger: { component: PhasorCoordinateLedger },
  ComplexModeEigenfunction: { component: ComplexModeEigenfunction },
  ConvolutionMultiplicationBridge: { component: ConvolutionMultiplicationBridge },
  GroupDelayPackets: { component: GroupDelayPackets },
  DftBasisCorrelations: { component: DftBasisCorrelations },
  RealDftConventionLedger: { component: RealDftConventionLedger },
  PaddingDurationResolution: { component: PaddingDurationResolution },
  FftButterflyLedger: { component: FftButterflyLedger },
  FftCostGrowth: { component: FftCostGrowth },
  FftMemoryOrderLedger: { component: FftMemoryOrderLedger },
  DtmfFeatureTimingPipeline: { component: DtmfFeatureTimingPipeline },
  DtmfCoordinateComparison: { component: DtmfCoordinateComparison },
  DtmfCoordinateCostLatencyLedger: { component: DtmfCoordinateCostLatencyLedger },
  WindowShapeSpectrumPair: { component: WindowShapeSpectrumPair },
  WindowCalibrationLedger: { component: WindowCalibrationLedger },
  WindowTradeoffMap: { component: WindowTradeoffMap },
  PeakParabolaFit: { component: PeakParabolaFit },
  PhaseFalseResolution: { component: PhaseFalseResolution },
  LocalizationResolutionLedger: { component: LocalizationResolutionLedger },
  PeriodogramVarianceEnvelope: { component: PeriodogramVarianceEnvelope },
  WelchAveragingPipeline: { component: WelchAveragingPipeline },
  BiasVarianceProofSteps: { component: BiasVarianceProofSteps, frames: 4 },
  LogisticGradientSteps: { component: LogisticGradientSteps, frames: 4 },
  OddsRatioCard: { component: OddsRatioCard },
  CeVsMseLoss: { component: CeVsMseLoss },
  SpamPosteriorSteps: { component: SpamPosteriorSteps, frames: 4 },
  ZeroCountRepair: { component: ZeroCountRepair },
  NbLinearScore: { component: NbLinearScore },
  GenDiscTaxonomy: { component: GenDiscTaxonomy },
  GdaSigmoidSteps: { component: GdaSigmoidSteps, frames: 3 },
  GenDiscScorecard: { component: GenDiscScorecard },
  BernoulliExpFamSteps: { component: BernoulliExpFamSteps, frames: 3 },
  GlmAssemblyLine: { component: GlmAssemblyLine },
  UniformGradientCard: { component: UniformGradientCard },
  PoissonCalibrationVerdict: { component: PoissonCalibrationVerdict },
  ConfusionMatrixMaster: { component: ConfusionMatrixMaster },
  HoeffdingBin: { component: HoeffdingBin },
  VcBoundAnatomy: { component: VcBoundAnatomy },
  KmeansDescentLemmas: { component: KmeansDescentLemmas },
  CodeTreeCorrespondence: { component: CodeTreeCorrespondence },
  NonPrefixAmbiguity: { component: NonPrefixAmbiguity },
  TwoCodesOneSource: { component: TwoCodesOneSource },
  EntropyFloor: { component: EntropyFloor },
  SubtreeClaim: { component: SubtreeClaim },
  ImpossibleVsTight: { component: ImpossibleVsTight },
  McMillanReach: { component: McMillanReach },
  HuffmanResult: { component: HuffmanResult },
  TwoHuffmanTrees: { component: TwoHuffmanTrees },
  OneBitGap: { component: OneBitGap },
  CodeAsBet: { component: CodeAsBet },
  CostDecomposition: { component: CostDecomposition },
  ShannonCodeRounding: { component: ShannonCodeRounding },
  TypicalSetMap: { component: TypicalSetMap },
  EntropyWall: { component: EntropyWall },
  EntropySplitBar: { component: EntropySplitBar },
  MutualInfoArea: { component: MutualInfoArea },
  JointVsProduct: { component: JointVsProduct },
  CorrelationBlindSpot: { component: CorrelationBlindSpot },
  DpiMergeDrop: { component: DpiMergeDrop },
  DpiMarkovChain: { component: DpiMarkovChain },
  DpiProofTwoWays: { component: DpiProofTwoWays, frames: 3 },
  DpiCeilingStack: { component: DpiCeilingStack },
  DpiSufficiencyBars: { component: DpiSufficiencyBars },
  ApproximationsLadder: { component: ApproximationsLadder },
  BitsPerContext: { component: BitsPerContext },
  GuessRankHistogram: { component: GuessRankHistogram },
  RedundancyBar: { component: RedundancyBar },
  BscTransition: { component: BscTransition },
  CapacityOverInputs: { component: CapacityOverInputs },
  BscCapacityDerivation: { component: BscCapacityDerivation, frames: 3 },
  BscCapacityCurve: { component: BscCapacityCurve },
  BecTransition: { component: BecTransition },
  BscVsBecBars: { component: BscVsBecBars },
  TwoLimitsMap: { component: TwoLimitsMap },
  CodingPipeline: { component: CodingPipeline },
  CapacityThreshold: { component: CapacityThreshold },
  ThresholdSharpens: { component: ThresholdSharpens, frames: 3 },
  JointTypicalityDecode: { component: JointTypicalityDecode, frames: 4 },
  ConverseChain: { component: ConverseChain },
  HammingVenn: { component: HammingVenn },
  HammingVsRepetition: { component: HammingVsRepetition },
  KlGapBars: { component: KlGapBars },
  JensenChord: { component: JensenChord },
  KlAsymmetryPanels: { component: KlAsymmetryPanels },
  MissingOutcomeBlowup: { component: MissingOutcomeBlowup },
  LogLossSurprisal: { component: LogLossSurprisal },
  CrossEntropyStack: { component: CrossEntropyStack },
  TrainingShrinksKl: { component: TrainingShrinksKl, frames: 4 },
  OneHotCollapse: { component: OneHotCollapse },
  ConfidentWrongBlowup: { component: ConfidentWrongBlowup },
  PredictThenCode: { component: PredictThenCode, frames: 5 },
  PredictorCompressorLoop: { component: PredictorCompressorLoop },
  StreamCostStack: { component: StreamCostStack },
  BitsPerCharLadder: { component: BitsPerCharLadder },
  CourseSpine: { component: CourseSpine },
  ThreeProgramsBars: { component: ThreeProgramsBars },
  InterpreterOverhead: { component: InterpreterOverhead },
  SelfExtractingArchive: { component: SelfExtractingArchive },
  IncompressibleCount: { component: IncompressibleCount },
  BerryLoop: { component: BerryLoop },
  ComplexityMeetsEntropy: { component: ComplexityMeetsEntropy },
  CompressionCeilingLadder: { component: CompressionCeilingLadder },
  FeasibleSetSimplex: { component: FeasibleSetSimplex },
  LambdaTiltDial: { component: LambdaTiltDial },
  MaxEntFormula: { component: MaxEntFormula },
  BoltzmannSoftmax: { component: BoltzmannSoftmax },
  RdPlane: { component: RdPlane },
  RdObjective: { component: RdObjective },
  CapacityVsRateDistortion: { component: CapacityVsRateDistortion },
  GaussianRdCurve: { component: GaussianRdCurve },
  NeuralCodecLoop: { component: NeuralCodecLoop },
  CodecIdentity: { component: CodecIdentity, frames: 4 },
  ThreeStringsThreeCodes: { component: ThreeStringsThreeCodes },
  TwoPartMessage: { component: TwoPartMessage },
  PolyFitTally: { component: PolyFitTally, frames: 4 },
  MarkovUCurve: { component: MarkovUCurve },
  ParameterPrecision: { component: ParameterPrecision },
  AdjustedRateUCurves: { component: AdjustedRateUCurves },
  OccamFactorSplit: { component: OccamFactorSplit },
  RegularVsSingular: { component: RegularVsSingular },
  IbVsRd: { component: IbVsRd },
  IbObjective: { component: IbObjective },
  IbToyMerges: { component: IbToyMerges, frames: 4 },
  IbPlane: { component: IbPlane },
  IbGibbsEncoder: { component: IbGibbsEncoder },
  IbBetaExtremes: { component: IbBetaExtremes },
  VibVsVae: { component: VibVsVae },
  ContrastiveLineup: { component: ContrastiveLineup },
  InfonceDerivation: { component: InfonceDerivation, frames: 4 },
  CertifiedBitsBudget: { component: CertifiedBitsBudget },
  InfonceToyTally: { component: InfonceToyTally },
  InfonceSaturationCurves: { component: InfonceSaturationCurves },
  CpcPipeline: { component: CpcPipeline },
  NeuronAsChannel: { component: NeuronAsChannel },
  DirectMethodSteps: { component: DirectMethodSteps, frames: 3 },
  MiBeatsTuningCurve: { component: MiBeatsTuningCurve },
  BitsPerSpikeTally: { component: BitsPerSpikeTally },
  CodingEfficiencyBars: { component: CodingEfficiencyBars },
  EstimationBias: { component: EstimationBias },
  UnitsBridge: { component: UnitsBridge },
  LandauerErasure: { component: LandauerErasure },
  FeedbackSecondLaw: { component: FeedbackSecondLaw },
  TwoPhysicsFaces: { component: TwoPhysicsFaces },
  GroupingTree: { component: GroupingTree },
  CapacityPacking: { component: CapacityPacking },
  LossVsGradient: { component: LossVsGradient },
  AdaptiveCoderStep: { component: AdaptiveCoderStep, frames: 4 },
  UkSeparation: { component: UkSeparation },
  SzilardFreeEnergy: { component: SzilardFreeEnergy },
  DeflatePipeline: { component: DeflatePipeline },
  FanoTwoExpansions: { component: FanoTwoExpansions, frames: 4 },
  FanoLeCamReduction: { component: FanoLeCamReduction },
  BitsPerByteConversion: { component: BitsPerByteConversion },
  TokenizerRankingFlip: { component: TokenizerRankingFlip },
  ModelCoderPipeline: { component: ModelCoderPipeline },
  GlmAssemblyDiagram: { component: GlmAssemblyDiagram },
  OneGradientThreeModels: { component: OneGradientThreeModels },
  NewtonPriceLedger: { component: NewtonPriceLedger },
  SgdTwoTargets: { component: SgdTwoTargets },
  LarPathSteps: { component: LarPathSteps, frames: 4 },
  ElasticNetGrouping: { component: ElasticNetGrouping },
  BlrSquareCompletion: { component: BlrSquareCompletion },
  OptimismFormulaAnatomy: { component: OptimismFormulaAnatomy },
  VarianceFormulaAnatomy: { component: VarianceFormulaAnatomy },
  AdaboostStagewiseCrosswalk: { component: AdaboostStagewiseCrosswalk },
  TwoBlockDescent: { component: TwoBlockDescent },
  LogSumApart: { component: LogSumApart },
  LaplacianQuadraticForm: { component: LaplacianQuadraticForm },
  RelaxationFeasibleSets: { component: RelaxationFeasibleSets },
  SpectralEmbeddingRows: { component: SpectralEmbeddingRows },
  UmapConstructionStrip: { component: UmapConstructionStrip },
  GpInheritance: { component: GpInheritance },
  GpPredictiveDissection: { component: GpPredictiveDissection },
  KernelMachineFamily: { component: KernelMachineFamily },
  Co2KernelLedger: { component: Co2KernelLedger },
  RffIdentityDissected: { component: RffIdentityDissected },
  ClassicalSpineMap: { component: ClassicalSpineMap },
};
