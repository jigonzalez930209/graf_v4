import { useMemo } from 'react'
import { IProcessFile } from '@shared/models/files'
import { analyzeCV } from './useCVAnalysis'
import {
  linearRegression,
  regressionLogLog,
  regressionVsSqrt,
  linearRegressionThroughOrigin
} from './helpers/slopes'
import {
  calculateCriticalScanRate,
  calculateFormalPotential,
  calculateTransferCoefficient,
  calculateBilinearRegression,
  type CriticalScanRateResult,
  type BilinearRegressionResult
} from './helpers/laviron'
import type { CVConfig, CVAnalysisResult, RegressionResult } from './types'

/**
 * Resultado de análisis individual de un archivo CV
 */
export interface MultiCVFileAnalysis {
  fileId: string
  fileName: string
  scanRate: number
  analysis: CVAnalysisResult
}

/**
 * Correlaciones calculadas a partir de múltiples CVs
 */
export interface MultiCVCorrelations {
  ipVsSqrtV?: { anodic?: RegressionResult | null; cathodic?: RegressionResult | null } | null
  ipVsV?: { anodic?: RegressionResult | null; cathodic?: RegressionResult | null } | null
  logIpVsLogV?: { anodic?: RegressionResult | null; cathodic?: RegressionResult | null } | null
  epVsLnV?: RegressionResult | null
  // Laviron analysis: Ep vs ln(v)
  epAVsLnV?: RegressionResult | null
  epCVsLnV?: RegressionResult | null
}

/**
 * Resultado completo del análisis multi-CV
 */
export interface MultiCVAnalysisResult {
  files: MultiCVFileAnalysis[]
  correlations: MultiCVCorrelations
  averageDeltaEp?: number
  averageHysteresisArea?: number
  mechanismConsensus?: string
  // Laviron kinetics analysis
  laviron?: {
    criticalScanRateAnodic?: CriticalScanRateResult
    criticalScanRateCathodic?: CriticalScanRateResult
    formalPotential?: number
    transferCoefficientAnodic?: number
    transferCoefficientCathodic?: number
    bilinearAnodicRegression?: BilinearRegressionResult
    bilinearCathodicRegression?: BilinearRegressionResult
  }
}

export interface UseMultiCVAnalysisParams {
  files: IProcessFile[]
  config: CVConfig
  includeOrigin?: boolean
}

/**
 * Función pura para análisis de múltiples archivos CV
 * Calcula correlaciones entre scan rate y parámetros CV
 * Reutiliza la lógica de analyzeCV para cada archivo
 */
export const analyzeMultiCV = (params: UseMultiCVAnalysisParams): MultiCVAnalysisResult | null => {
  if (!params || !params.files || params.files.length === 0) {
    return null
  }

  try {
    const { files, config } = params

    // Analizar cada archivo
    const fileAnalyses: MultiCVFileAnalysis[] = []
    const scanRates: number[] = []
    const anodicCurrents: number[] = []
    const cathodicCurrents: number[] = []
    const deltaEps: number[] = []
    const hysteresisAreas: number[] = []
    const anodicPotentials: number[] = []
    const cathodicPotentials: number[] = []

    for (const file of files) {
      const scanRate = file.voltammeter?.scanRate
      if (!scanRate || !Number.isFinite(scanRate)) continue

      // Usar analyzeCV para cada archivo
      const analysis = analyzeCV({ file, config })
      if (!analysis) continue

      fileAnalyses.push({
        fileId: file.id,
        fileName: file.name,
        scanRate,
        analysis
      })

      // Recolectar datos para correlaciones
      scanRates.push(scanRate)

      // Pico anódico (positivo)
      const anodicPeak = analysis.peaks.anodic
      if (anodicPeak && Number.isFinite(anodicPeak.Ip)) {
        anodicCurrents.push(anodicPeak.Ip)
      }
      if (anodicPeak && Number.isFinite(anodicPeak.Ep)) {
        anodicPotentials.push(anodicPeak.Ep)
      }

      // Pico catódico (negativo, mantener signo)
      const cathodicPeak = analysis.peaks.cathodic
      if (cathodicPeak && Number.isFinite(cathodicPeak.Ip)) {
        cathodicCurrents.push(cathodicPeak.Ip)
      }
      if (cathodicPeak && Number.isFinite(cathodicPeak.Ep)) {
        cathodicPotentials.push(cathodicPeak.Ep)
      }

      // Delta Ep
      if (analysis.parameters.deltaEp && Number.isFinite(analysis.parameters.deltaEp)) {
        deltaEps.push(analysis.parameters.deltaEp)
      }

      // Hysteresis
      if (analysis.hysteresis.area && Number.isFinite(analysis.hysteresis.area)) {
        hysteresisAreas.push(analysis.hysteresis.area)
      }
    }

    if (fileAnalyses.length === 0) {
      return null
    }

    // Calcular correlaciones
    const correlations: MultiCVCorrelations = {}

    // Agregar punto (0,0) si se solicita
    const finalScanRates = params.includeOrigin ? [0, ...scanRates] : scanRates
    const finalAnodicCurrents = params.includeOrigin ? [0, ...anodicCurrents] : anodicCurrents
    const finalCathodicCurrents = params.includeOrigin ? [0, ...cathodicCurrents] : cathodicCurrents

    // ip vs sqrt(v) - separado para anódico y catódico
    if (finalAnodicCurrents.length >= 2 && finalScanRates.length === finalAnodicCurrents.length) {
      // Transformar scanRates a sqrt para usar con regresión through origin si es necesario
      const sqrtScanRates = finalScanRates.map((v) => Math.sqrt(v))
      const regressionFunc = params.includeOrigin ? linearRegressionThroughOrigin : linearRegression

      const anodicReg = params.includeOrigin
        ? regressionFunc(sqrtScanRates, finalAnodicCurrents)
        : regressionVsSqrt(finalScanRates, finalAnodicCurrents)

      const cathodicReg =
        finalCathodicCurrents.length >= 2 && finalScanRates.length === finalCathodicCurrents.length
          ? params.includeOrigin
            ? regressionFunc(sqrtScanRates, finalCathodicCurrents)
            : regressionVsSqrt(finalScanRates, finalCathodicCurrents)
          : null
      correlations.ipVsSqrtV = { anodic: anodicReg, cathodic: cathodicReg }
    }

    // ip vs v (linear) - separado para anódico y catódico
    if (finalAnodicCurrents.length >= 2 && finalScanRates.length === finalAnodicCurrents.length) {
      const regressionFunc = params.includeOrigin ? linearRegressionThroughOrigin : linearRegression
      const anodicReg = regressionFunc(finalScanRates, finalAnodicCurrents)
      const cathodicReg =
        finalCathodicCurrents.length >= 2 && finalScanRates.length === finalCathodicCurrents.length
          ? regressionFunc(finalScanRates, finalCathodicCurrents)
          : null
      correlations.ipVsV = { anodic: anodicReg, cathodic: cathodicReg }
    }

    // log(ip) vs log(v) - separado para anódico y catódico
    // Nota: Para log-log NUNCA forzamos paso por origen, siempre usamos regresión normal
    // Y NUNCA incluimos el punto (0,0) porque Math.log(0) es indefinido
    if (anodicCurrents.length >= 2 && scanRates.length === anodicCurrents.length) {
      const anodicReg = regressionLogLog(scanRates, anodicCurrents)

      const cathodicReg =
        cathodicCurrents.length >= 2 && scanRates.length === cathodicCurrents.length
          ? regressionLogLog(scanRates, cathodicCurrents)
          : null
      correlations.logIpVsLogV = { anodic: anodicReg, cathodic: cathodicReg }
    }

    // Ep vs ln(v) - convertir deltaEps a Volts (dividir por 1000)
    if (deltaEps.length >= 2 && scanRates.length === deltaEps.length) {
      const lnScanRates = scanRates.map((v) => Math.log(v))
      const deltaEpsInVolts = deltaEps.map((ep) => ep / 1000)
      correlations.epVsLnV = linearRegression(lnScanRates, deltaEpsInVolts)
    }

    // Laviron analysis: Ep,a vs ln(v) - anodic peak potential
    if (anodicPotentials.length >= 2 && scanRates.length === anodicPotentials.length) {
      const lnScanRates = scanRates.map((v) => Math.log(v))
      correlations.epAVsLnV = linearRegression(lnScanRates, anodicPotentials)
    }

    // Laviron analysis: Ep,c vs ln(v) - cathodic peak potential
    if (cathodicPotentials.length >= 2 && scanRates.length === cathodicPotentials.length) {
      const lnScanRates = scanRates.map((v) => Math.log(v))
      correlations.epCVsLnV = linearRegression(lnScanRates, cathodicPotentials)
    }

    // Calcular promedios
    const averageDeltaEp =
      deltaEps.length > 0 ? deltaEps.reduce((a, b) => a + b, 0) / deltaEps.length : undefined
    const averageHysteresisArea =
      hysteresisAreas.length > 0
        ? hysteresisAreas.reduce((a, b) => a + b, 0) / hysteresisAreas.length
        : undefined

    // Determinar consenso de mecanismo
    const mechanisms = fileAnalyses.map((f) => f.analysis.diagnostics.mechanism)
    const mechanismCounts = mechanisms.reduce(
      (acc, m) => {
        acc[m] = (acc[m] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
    const mechanismConsensus = Object.entries(mechanismCounts).sort((a, b) => b[1] - a[1])[0]?.[0]

    // Laviron analysis: Detectar velocidad crítica y parámetros cinéticos
    let laviron: MultiCVAnalysisResult['laviron'] | undefined

    if (anodicPotentials.length >= 4 || cathodicPotentials.length >= 4) {
      laviron = {}

      // Detectar velocidad crítica para picos anódicos
      if (anodicPotentials.length >= 4) {
        const criticalAnodic = calculateCriticalScanRate(scanRates, anodicPotentials, 4, 0.95, 2)
        laviron.criticalScanRateAnodic = criticalAnodic

        // Calcular coeficiente de transferencia si se encontró correlación
        if (correlations.epAVsLnV?.slope) {
          laviron.transferCoefficientAnodic =
            calculateTransferCoefficient(correlations.epAVsLnV.slope, 1, 298.15) ?? undefined
        }

        // Calcular regresión bilineal para picos anódicos
        if (criticalAnodic.isFound) {
          const lnScanRates = scanRates.map((v) => Math.log(v))
          laviron.bilinearAnodicRegression = calculateBilinearRegression(
            lnScanRates,
            anodicPotentials,
            criticalAnodic.indexCritical
          )
        }
      }

      // Detectar velocidad crítica para picos catódicos
      if (cathodicPotentials.length >= 4) {
        const criticalCathodic = calculateCriticalScanRate(
          scanRates,
          cathodicPotentials,
          4,
          0.95,
          2
        )
        laviron.criticalScanRateCathodic = criticalCathodic

        // Calcular coeficiente de transferencia si se encontró correlación
        if (correlations.epCVsLnV?.slope) {
          laviron.transferCoefficientCathodic =
            calculateTransferCoefficient(correlations.epCVsLnV.slope, 1, 298.15) ?? undefined
        }

        // Calcular regresión bilineal para picos catódicos
        if (criticalCathodic.isFound) {
          const lnScanRates = scanRates.map((v) => Math.log(v))
          laviron.bilinearCathodicRegression = calculateBilinearRegression(
            lnScanRates,
            cathodicPotentials,
            criticalCathodic.indexCritical
          )
        }
      }

      // Calcular potencial formal
      if (anodicPotentials.length > 0 && cathodicPotentials.length > 0) {
        laviron.formalPotential =
          calculateFormalPotential(anodicPotentials, cathodicPotentials) ?? undefined
      }
    }

    return {
      files: fileAnalyses,
      correlations,
      averageDeltaEp,
      averageHysteresisArea,
      mechanismConsensus,
      laviron
    }
  } catch (error) {
    console.error('Error in analyzeMultiCV:', error)
    return null
  }
}

/**
 * Hook para análisis de múltiples archivos CV
 * Calcula correlaciones entre scan rate y parámetros CV
 * Reutiliza la lógica de useCVAnalysis para cada archivo
 */
export const useMultiCVAnalysis = (
  params?: UseMultiCVAnalysisParams | null
): MultiCVAnalysisResult | null => {
  // Memoizar las dependencias
  const fileIds = params?.files?.map((f) => f.id).join(',') ?? ''
  const configStr = JSON.stringify(params?.config ?? {})
  const includeOrigin = params?.includeOrigin ?? false

  return useMemo(() => {
    if (!params) {
      return null
    }
    return analyzeMultiCV(params)
  }, [fileIds, configStr, includeOrigin])
}
