import { useMemo } from 'react'

import { CV_DEFAULTS } from './constants'
import {
  CVAnalysisResult,
  DiagnoseParams,
  HysteresisData,
  Parameters,
  Peak,
  PlotSeries,
  UseCVAnalysisParams
} from './types'

import { applySavitzkyGolay } from './helpers/smoothing'
import { detectPeaks } from './helpers/peaks'
import { computeHysteresis } from './helpers/hysteresis'
import { diagnoseMechanism } from './helpers/diagnostics'
import { calculateDeltaEp, extractCVData, pickPrimaryPeaks } from './helpers/utils'

const buildEmptySeries = (): PlotSeries => ({ x: [], y: [] })

const buildEmptyResult = (): CVAnalysisResult => ({
  peaks: {},
  parameters: {},
  hysteresis: { area: 0, curve: [] },
  diagnostics: {
    mechanism: 'unknown',
    confidence: 0.4,
    notes: ['Sin datos suficientes para el análisis.']
  },
  plotsData: {
    raw: buildEmptySeries(),
    processed: buildEmptySeries(),
    peaks: {}
  }
})

const ensureOddWindow = (windowSize: number, maxLength: number): number => {
  let target = Math.min(windowSize, maxLength)
  if (target % 2 === 0) target -= 1
  if (target < 3) target = Math.min(3, maxLength)
  return target
}

const resolveSmoothingParams = (length: number, windowSize?: number, polyOrder?: number) => {
  if (length < 3) {
    return null
  }

  const defaultWindow = CV_DEFAULTS.smoothing.windowSize
  const defaultPoly = CV_DEFAULTS.smoothing.polyOrder

  const resolvedWindow = ensureOddWindow(windowSize ?? defaultWindow, length)
  const resolvedPoly = Math.min(polyOrder ?? defaultPoly, resolvedWindow - 1)

  if (resolvedWindow < 3 || resolvedPoly < 1) return null

  return {
    windowSize: resolvedWindow,
    polyOrder: Math.max(1, resolvedPoly)
  }
}

const buildPlots = (
  potential: number[],
  current: number[],
  processedCurrent: number[]
): { raw: PlotSeries; processed: PlotSeries } => ({
  raw: { x: potential, y: current },
  processed: { x: potential, y: processedCurrent }
})

type PeakAnalysis = { peaks: Peak[]; anodic?: Peak; cathodic?: Peak; deltaEp?: number }

const analyzePeaks = (potential: number[], processedCurrent: number[]): PeakAnalysis => {
  const peaks = detectPeaks(potential, processedCurrent)
  const { anodic, cathodic } = pickPrimaryPeaks(peaks)
  const deltaEp = calculateDeltaEp(anodic, cathodic)
  return { peaks, anodic, cathodic, deltaEp }
}

const analyzeDiagnostics = (params: DiagnoseParams, hysteresis: HysteresisData) =>
  diagnoseMechanism({ ...params, hysteresisArea: hysteresis.area })

export const analyzeCV = ({ file, config }: UseCVAnalysisParams): CVAnalysisResult => {
  const { potential, current } = extractCVData(file)

  if (!potential.length || !current.length) {
    return buildEmptyResult()
  }

  let processedCurrent = [...current]

  if (config.smooth) {
    const smoothingParams = resolveSmoothingParams(
      potential.length,
      config.windowSize,
      config.polyOrder
    )
    if (smoothingParams) {
      try {
        processedCurrent = applySavitzkyGolay(potential, current, smoothingParams)
      } catch (error) {
        console.warn('No se pudo aplicar Savitzky-Golay, usando señal original.', error)
        processedCurrent = [...current]
      }
    }
  }

  const { anodic, cathodic, deltaEp } = analyzePeaks(potential, processedCurrent)

  const hysteresis = computeHysteresis(potential, processedCurrent)

  const diagnostics = analyzeDiagnostics(
    {
      anodicPeak: anodic,
      cathodicPeak: cathodic,
      deltaEp,
      hysteresisArea: hysteresis.area,
      slopeLogLog: null
    },
    hysteresis
  )

  const plots = buildPlots(potential, current, processedCurrent)

  const parameters: Parameters = {
    anodicPeak: anodic,
    cathodicPeak: cathodic,
    deltaEp
  }

  return {
    peaks: { anodic, cathodic },
    parameters,
    hysteresis,
    diagnostics,
    plotsData: {
      ...plots,
      peaks: { anodic, cathodic }
    }
  }
}

const buildDependencies = (params?: UseCVAnalysisParams | null) => {
  if (!params) return []
  const { file, config } = params
  return [
    file?.id,
    file?.content,
    file?.selected,
    config.scanRate,
    config.area,
    config.concentration,
    config.n,
    config.temperature,
    config.diffusionCoefficient,
    config.smooth,
    config.windowSize,
    config.polyOrder
  ]
}

export const useCVAnalysis = (params?: UseCVAnalysisParams | null): CVAnalysisResult | null => {
  const dependencies = buildDependencies(params)

  return useMemo(() => {
    if (!params) return null
    try {
      return analyzeCV(params)
    } catch (error) {
      console.error('useCVAnalysis error:', error)
      return buildEmptyResult()
    }
  }, dependencies)
}
