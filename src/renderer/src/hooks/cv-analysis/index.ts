export { useCVAnalysis, analyzeCV } from './useCVAnalysis'
export { useMultiCVAnalysis, analyzeMultiCV } from './useMultiCVAnalysis'
export { toCVData, extractCVData, validateMultipleCVFiles } from './helpers/normalization'
export type { ValidationResult, NormalizedCVData } from './helpers/normalization'
export {
  calculateK0Nicholson,
  performNicholsonAnalysis,
  calculateK0Statistics,
  analyzeDeltaEpVsScanRate,
  classifyKineticRegime,
  isNicholsonApplicable,
  interpolatePsi
} from './helpers/nicholson'
export type { NicholsonAnalysisResult } from './helpers/nicholson'
export {
  analyzeControl,
  classifyReversibility,
  comprehensiveDiagnosis
} from './helpers/diagnostics'
export type {
  ControlType,
  ControlAnalysisResult,
  ReversibilityType,
  ReversibilityClassification,
  ComprehensiveDiagnostics
} from './helpers/diagnostics'
export type {
  CVData,
  CVConfig,
  Peak,
  Parameters,
  HysteresisData,
  Diagnostics,
  CVAnalysisResult,
  UseCVAnalysisParams,
  RegressionResult,
  DiagnoseParams,
  MechanismType,
  PlotSeries,
  CVPlotsData
} from './types'
export type {
  MultiCVFileAnalysis,
  MultiCVCorrelations,
  MultiCVAnalysisResult,
  UseMultiCVAnalysisParams
} from './useMultiCVAnalysis'
export { CV_DEFAULTS, CV_THRESHOLDS } from './constants'
