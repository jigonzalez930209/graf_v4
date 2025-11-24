/**
 * Análisis de Nicholson para sistemas quasi-reversibles
 * Método para determinar k⁰ (constante de velocidad estándar) a partir de ΔEp
 */

import { computeLinearRegression } from './laviron'

/**
 * Constantes físicas
 */
const CONSTANTS = {
  R: 8.314, // J/(mol·K)
  F: 96485, // C/mol
  T_DEFAULT: 298.15 // K
}

/**
 * Tabla de Nicholson: ψ vs ΔEp (mV) a 25°C para n=1
 * Fuente: Nicholson, R.S. Anal. Chem. 1965, 37, 1351-1355
 *
 * ψ = k⁰ / √(D·f·v) donde f = F/(RT)
 *
 * Valores tabulados para sistemas quasi-reversibles
 */
const NICHOLSON_TABLE: Array<{ deltaEp: number; psi: number }> = [
  { deltaEp: 61, psi: 20.0 },
  { deltaEp: 63, psi: 7.0 },
  { deltaEp: 65, psi: 5.0 },
  { deltaEp: 68, psi: 3.0 },
  { deltaEp: 72, psi: 2.0 },
  { deltaEp: 76, psi: 1.5 },
  { deltaEp: 80, psi: 1.0 },
  { deltaEp: 84, psi: 0.75 },
  { deltaEp: 92, psi: 0.5 },
  { deltaEp: 105, psi: 0.3 },
  { deltaEp: 121, psi: 0.2 },
  { deltaEp: 141, psi: 0.15 },
  { deltaEp: 170, psi: 0.1 },
  { deltaEp: 212, psi: 0.05 },
  { deltaEp: 270, psi: 0.025 },
  { deltaEp: 350, psi: 0.01 }
]

/**
 * Interpola ψ para un ΔEp dado usando interpolación lineal
 *
 * @param deltaEp - Separación de picos en mV
 * @returns Valor de ψ interpolado, o null si está fuera del rango
 */
export const interpolatePsi = (deltaEp: number): number | null => {
  // Convertir a mV si está en V
  const deltaEpMv = deltaEp > 1 ? deltaEp : deltaEp * 1000

  // Verificar límites
  if (deltaEpMv < NICHOLSON_TABLE[0].deltaEp) {
    // Sistema muy reversible, ψ muy grande
    return NICHOLSON_TABLE[0].psi
  }
  if (deltaEpMv > NICHOLSON_TABLE[NICHOLSON_TABLE.length - 1].deltaEp) {
    // Sistema muy irreversible, ψ muy pequeño
    return NICHOLSON_TABLE[NICHOLSON_TABLE.length - 1].psi
  }

  // Buscar el intervalo correcto
  for (let i = 0; i < NICHOLSON_TABLE.length - 1; i++) {
    const p1 = NICHOLSON_TABLE[i]
    const p2 = NICHOLSON_TABLE[i + 1]

    if (deltaEpMv >= p1.deltaEp && deltaEpMv <= p2.deltaEp) {
      // Interpolación lineal
      const slope = (p2.psi - p1.psi) / (p2.deltaEp - p1.deltaEp)
      const psi = p1.psi + slope * (deltaEpMv - p1.deltaEp)
      return psi
    }
  }

  return null
}

/**
 * Calcula k⁰ usando el método de Nicholson
 *
 * k⁰ = ψ × √(D·f·v)
 *
 * donde:
 * - ψ: parámetro de Nicholson (de la tabla)
 * - D: coeficiente de difusión (cm²/s)
 * - f: F/(RT) ≈ 38.92 V⁻¹ a 25°C
 * - v: velocidad de barrido (V/s)
 *
 * @param deltaEp - Separación de picos (V)
 * @param scanRate - Velocidad de barrido (V/s)
 * @param D - Coeficiente de difusión (cm²/s)
 * @param n - Número de electrones
 * @param temperature - Temperatura (K)
 * @returns k⁰ en cm/s, o null si no se puede calcular
 */
export const calculateK0Nicholson = (
  deltaEp: number,
  scanRate: number,
  D: number,
  n: number = 1,
  temperature: number = CONSTANTS.T_DEFAULT
): number | null => {
  if (deltaEp <= 0 || scanRate <= 0 || D <= 0) {
    return null
  }

  // Obtener ψ de la tabla
  const psi = interpolatePsi(deltaEp)
  if (psi === null) {
    return null
  }

  // Calcular f = nF/(RT)
  const f = (n * CONSTANTS.F) / (CONSTANTS.R * temperature)

  // k⁰ = ψ × √(D·f·v)
  const k0 = psi * Math.sqrt(D * f * scanRate)

  return k0
}

/**
 * Resultado del análisis de Nicholson
 */
export interface NicholsonAnalysisResult {
  k0: number // Constante de velocidad estándar (cm/s)
  psi: number // Parámetro de Nicholson
  deltaEp: number // Separación de picos (V)
  scanRate: number // Velocidad de barrido (V/s)
  D: number // Coeficiente de difusión usado (cm²/s)
  regime: 'reversible' | 'quasi-reversible' | 'irreversible'
}

/**
 * Clasifica el régimen cinético basado en ΔEp
 *
 * @param deltaEp - Separación de picos en V
 * @param n - Número de electrones
 * @returns Régimen cinético
 */
export const classifyKineticRegime = (
  deltaEp: number,
  n: number = 1
): 'reversible' | 'quasi-reversible' | 'irreversible' => {
  const deltaEpMv = deltaEp * 1000

  // Valores teóricos a 25°C
  const reversibleThreshold = 59 / n + 10 // ~69 mV para n=1
  const irreversibleThreshold = 200 // mV

  if (deltaEpMv < reversibleThreshold) {
    return 'reversible'
  } else if (deltaEpMv < irreversibleThreshold) {
    return 'quasi-reversible'
  } else {
    return 'irreversible'
  }
}

/**
 * Análisis completo de Nicholson para un conjunto de datos
 *
 * @param deltaEps - Separaciones de picos (V)
 * @param scanRates - Velocidades de barrido (V/s)
 * @param D - Coeficiente de difusión (cm²/s)
 * @param n - Número de electrones
 * @param temperature - Temperatura (K)
 * @returns Array de resultados por cada medición
 */
export const performNicholsonAnalysis = (
  deltaEps: number[],
  scanRates: number[],
  D: number,
  n: number = 1,
  temperature: number = CONSTANTS.T_DEFAULT
): NicholsonAnalysisResult[] => {
  if (deltaEps.length !== scanRates.length || deltaEps.length === 0) {
    return []
  }

  const results: NicholsonAnalysisResult[] = []

  for (let i = 0; i < deltaEps.length; i++) {
    const deltaEp = deltaEps[i]
    const scanRate = scanRates[i]

    const k0 = calculateK0Nicholson(deltaEp, scanRate, D, n, temperature)
    const psi = interpolatePsi(deltaEp)

    if (k0 !== null && psi !== null) {
      results.push({
        k0,
        psi,
        deltaEp,
        scanRate,
        D,
        regime: classifyKineticRegime(deltaEp, n)
      })
    }
  }

  return results
}

/**
 * Calcula k⁰ promedio y desviación estándar
 *
 * @param results - Array de resultados de Nicholson
 * @returns Estadísticas de k⁰
 */
export const calculateK0Statistics = (
  results: NicholsonAnalysisResult[]
): {
  mean: number
  stdDev: number
  min: number
  max: number
  count: number
} | null => {
  if (results.length === 0) {
    return null
  }

  const k0Values = results.map((r) => r.k0)
  const mean = k0Values.reduce((a, b) => a + b, 0) / k0Values.length

  const variance = k0Values.reduce((sum, k0) => sum + Math.pow(k0 - mean, 2), 0) / k0Values.length
  const stdDev = Math.sqrt(variance)

  return {
    mean,
    stdDev,
    min: Math.min(...k0Values),
    max: Math.max(...k0Values),
    count: k0Values.length
  }
}

/**
 * Verifica si el método de Nicholson es aplicable
 *
 * @param deltaEp - Separación de picos (V)
 * @param n - Número de electrones
 * @returns true si Nicholson es aplicable
 */
export const isNicholsonApplicable = (deltaEp: number, n: number = 1): boolean => {
  const regime = classifyKineticRegime(deltaEp, n)
  return regime === 'quasi-reversible'
}

/**
 * Analiza la dependencia de ΔEp con v
 * Si ΔEp aumenta con v, indica cinética quasi-reversible
 *
 * @param deltaEps - Separaciones de picos (V)
 * @param scanRates - Velocidades de barrido (V/s)
 * @returns Resultado de regresión y diagnóstico
 */
export const analyzeDeltaEpVsScanRate = (
  deltaEps: number[],
  scanRates: number[]
): {
  regression: { slope: number; intercept: number; r2: number } | null
  isQuasiReversible: boolean
  message: string
} => {
  if (deltaEps.length < 2 || scanRates.length < 2) {
    return {
      regression: null,
      isQuasiReversible: false,
      message: 'Datos insuficientes'
    }
  }

  const regression = computeLinearRegression(scanRates, deltaEps)

  if (!regression) {
    return {
      regression: null,
      isQuasiReversible: false,
      message: 'No se pudo calcular regresión'
    }
  }

  // Si ΔEp aumenta significativamente con v, es quasi-reversible
  const isQuasiReversible = regression.slope > 0.01 && regression.r2 > 0.7

  let message = ''
  if (isQuasiReversible) {
    message = 'ΔEp aumenta con v → sistema quasi-reversible (Nicholson aplicable)'
  } else if (Math.abs(regression.slope) < 0.01) {
    message = 'ΔEp constante → sistema reversible (Nicholson no necesario)'
  } else {
    message = 'Comportamiento irregular'
  }

  return {
    regression,
    isQuasiReversible,
    message
  }
}
