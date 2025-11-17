import { IProcessFile } from '@shared/models/files'

export interface CVData {
  potential: number[]
  current: number[]
}

export interface CVConfig {
  scanRate: number
  area?: number
  concentration?: number
  n?: number
  temperature?: number
  diffusionCoefficient?: number
  smooth?: boolean
  windowSize?: number
  polyOrder?: number
}

export interface Peak {
  Ep: number
  Ip: number
  index: number
  direction: 'anodic' | 'cathodic'
}

export interface Parameters {
  anodicPeak?: Peak
  cathodicPeak?: Peak
  deltaEp?: number
  ipVsSqrtV?: number[]
}

export interface HysteresisData {
  area: number
  curve: number[]
}

export type MechanismType = 'diffusion' | 'adsorption' | 'EC' | 'ECE' | 'kinetic' | 'unknown'

export interface Diagnostics {
  mechanism: MechanismType
  confidence: number
  notes: string[]
}

export interface PlotSeries {
  x: number[]
  y: number[]
  label?: string
}

export interface CVPlotsData {
  raw: PlotSeries
  processed: PlotSeries
  peaks: {
    anodic?: Peak
    cathodic?: Peak
  }
}

export interface RegressionResult {
  slope: number
  intercept: number
  r2: number
  points: number
}

export interface DiagnoseParams {
  anodicPeak?: Peak
  cathodicPeak?: Peak
  deltaEp?: number
  hysteresisArea: number
  slopeLogLog?: number | null
}

export interface CVAnalysisResult {
  peaks: {
    anodic?: Peak
    cathodic?: Peak
  }
  parameters: Parameters
  hysteresis: HysteresisData
  diagnostics: Diagnostics
  plotsData: CVPlotsData
}

export interface UseCVAnalysisParams {
  file: IProcessFile
  config: CVConfig
}
