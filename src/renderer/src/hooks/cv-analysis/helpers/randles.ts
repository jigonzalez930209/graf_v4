import { CVConfig, Peak } from '../types'
import { computeLinearRegression } from './laviron'

const RANDLES_COEFFICIENT = 2.69e5 // A·cm⁻²·M⁻¹·(V/s)⁻¹/²

export interface RandlesSevcikParams {
  n?: number // Número de electrones transferidos
  area?: number // Área del electrodo (cm²)
  concentration?: number // Concentración (M)
  temperature?: number // Temperatura (K)
}

export interface DiffusionCoefficientResult {
  D: number // Coeficiente de difusión (cm²/s)
  confidence: number // R² de la regresión
  slope: number // Pendiente de Ip vs √v
  intercept: number // Intercepto
  dataPoints: number // Número de puntos usados
}

/**
 * Calcula la corriente de pico esperada según Randles-Sevcik
 */
export const estimateDiffusionalCurrent = (config: CVConfig): number | undefined => {
  const { n = 1, area, diffusionCoefficient, concentration, scanRate } = config
  if (
    !area ||
    !diffusionCoefficient ||
    !concentration ||
    !Number.isFinite(scanRate) ||
    scanRate <= 0
  ) {
    return undefined
  }

  const ip =
    RANDLES_COEFFICIENT *
    Math.pow(n, 1.5) *
    area *
    Math.sqrt(diffusionCoefficient) *
    concentration *
    Math.sqrt(scanRate)

  return ip
}

/**
 * Calcula el coeficiente de difusión D a partir de la pendiente Ip vs √v
 *
 * Ecuación de Randles-Sevcik:
 * Ip = 2.69×10⁵ × n^(3/2) × A × D^(1/2) × C × v^(1/2)
 *
 * Despejando D:
 * D = (slope / (2.69×10⁵ × n^(3/2) × A × C))²
 *
 * @param slope - Pendiente de la regresión Ip vs √v (A/(V/s)^(1/2))
 * @param params - Parámetros experimentales
 * @returns Coeficiente de difusión en cm²/s
 */
export const calculateDiffusionCoefficient = (
  slope: number,
  params: RandlesSevcikParams
): number | null => {
  const { n = 1, area, concentration } = params

  if (!area || !concentration || slope <= 0) {
    return null
  }

  // D = (slope / (2.69×10⁵ × n^(3/2) × A × C))²
  const denominator = RANDLES_COEFFICIENT * Math.pow(n, 1.5) * area * concentration
  const D = Math.pow(slope / denominator, 2)

  return D
}

/**
 * Calcula D a partir de múltiples mediciones (Ip, v)
 *
 * @param peakCurrents - Corrientes de pico (A)
 * @param scanRates - Velocidades de barrido (V/s)
 * @param params - Parámetros experimentales
 * @param includeOrigin - Forzar regresión por el origen
 * @returns Resultado con D, R², slope, etc.
 */
export const calculateDFromMultipleScans = (
  peakCurrents: number[],
  scanRates: number[],
  params: RandlesSevcikParams,
  includeOrigin: boolean = false
): DiffusionCoefficientResult | null => {
  if (peakCurrents.length < 2 || scanRates.length < 2 || peakCurrents.length !== scanRates.length) {
    return null
  }

  // Calcular √v
  const sqrtV = scanRates.map((v) => Math.sqrt(v))

  // Regresión lineal Ip vs √v
  let regression

  if (includeOrigin) {
    // Forzar por el origen: Ip = slope × √v
    const numerator = peakCurrents.reduce((sum, ip, i) => sum + ip * sqrtV[i], 0)
    const denominator = sqrtV.reduce((sum, sv) => sum + sv * sv, 0)
    const slope = numerator / denominator

    // Calcular R² manualmente
    const meanIp = peakCurrents.reduce((a, b) => a + b, 0) / peakCurrents.length
    const ssTot = peakCurrents.reduce((sum, ip) => sum + Math.pow(ip - meanIp, 2), 0)
    const ssRes = peakCurrents.reduce((sum, ip, i) => {
      const predicted = slope * sqrtV[i]
      return sum + Math.pow(ip - predicted, 2)
    }, 0)
    const r2 = 1 - ssRes / ssTot

    regression = { slope, intercept: 0, r2 }
  } else {
    regression = computeLinearRegression(sqrtV, peakCurrents)
  }

  if (!regression) {
    return null
  }

  // Calcular D desde la pendiente
  const D = calculateDiffusionCoefficient(regression.slope, params)

  if (!D) {
    return null
  }

  return {
    D,
    confidence: regression.r2,
    slope: regression.slope,
    intercept: regression.intercept,
    dataPoints: peakCurrents.length
  }
}

/**
 * Compara un pico experimental con el esperado por Randles-Sevcik
 */
export const comparePeakWithRandles = (
  peak: Peak | undefined,
  config: CVConfig
): { expected?: number; ratio?: number } => {
  if (!peak) return {}
  const expected = estimateDiffusionalCurrent(config)
  if (!expected) return { expected }
  return { expected, ratio: peak.Ip / expected }
}

/**
 * Calcula el intervalo de confianza para D (aproximación simple)
 * Basado en propagación de errores desde R²
 */
export const calculateDConfidenceInterval = (
  D: number,
  r2: number,
  dataPoints: number
): { lower: number; upper: number; uncertainty: number } => {
  // Estimación simple: incertidumbre ~ (1 - R²) × D
  // Para un análisis más riguroso, se necesitaría la desviación estándar de la regresión
  const uncertainty = D * (1 - r2) * Math.sqrt(2 / dataPoints)

  return {
    lower: Math.max(0, D - uncertainty),
    upper: D + uncertainty,
    uncertainty
  }
}
