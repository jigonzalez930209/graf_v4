/**
 * Laviron Analysis: Detección de velocidad crítica (νc)
 * Identifica el punto donde Ep vs ln(ν) se vuelve lineal
 */

export interface LinearRegressionResult {
  slope: number
  intercept: number
  r2: number
}

export interface CriticalScanRateResult {
  vCritical: number
  indexCritical: number
  r2Values: Array<{ index: number; r2: number; slope: number; intercept: number }>
  isFound: boolean
  debugInfo: string
}

/**
 * Calcula regresión lineal para un conjunto de puntos
 */
export const computeLinearRegression = (
  xs: number[],
  ys: number[]
): LinearRegressionResult | null => {
  if (xs.length < 2 || ys.length < 2 || xs.length !== ys.length) {
    return null
  }

  const n = xs.length
  const meanX = xs.reduce((a, b) => a + b, 0) / n
  const meanY = ys.reduce((a, b) => a + b, 0) / n

  const numerator = xs.reduce((acc, x, i) => acc + (x - meanX) * (ys[i] - meanY), 0)
  const denominator = xs.reduce((acc, x) => acc + (x - meanX) ** 2, 0)

  if (denominator === 0) {
    return null
  }

  const slope = numerator / denominator
  const intercept = meanY - slope * meanX

  // Calcular R²
  const ssTot = ys.reduce((acc, y) => acc + (y - meanY) ** 2, 0)
  const ssRes = ys.reduce((acc, y, i) => {
    const predicted = slope * xs[i] + intercept
    return acc + (y - predicted) ** 2
  }, 0)

  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot

  return { slope, intercept, r2 }
}

/**
 * Detecta la velocidad crítica (νc) donde Ep vs ln(ν) se vuelve lineal
 * Utiliza ventana móvil y análisis de R² consecutivos
 *
 * @param scanRates - Velocidades de barrido en V/s
 * @param peakPotentials - Potenciales de pico en V
 * @param windowSize - Tamaño de la ventana móvil (default: 4)
 * @param thresholdR2 - Umbral de R² para considerar lineal (default: 0.95)
 * @param minStability - Mínimo de ventanas consecutivas buenas (default: 2)
 * @returns Resultado con νc, índice y valores de R²
 */
export const calculateCriticalScanRate = (
  scanRates: number[],
  peakPotentials: number[],
  windowSize: number = 4,
  thresholdR2: number = 0.95,
  minStability: number = 2
): CriticalScanRateResult => {
  // Validación
  if (
    !scanRates ||
    !peakPotentials ||
    scanRates.length < windowSize ||
    scanRates.length !== peakPotentials.length
  ) {
    return {
      vCritical: scanRates?.[0] ?? 0,
      indexCritical: 0,
      r2Values: [],
      isFound: false,
      debugInfo: 'Datos insuficientes o inconsistentes'
    }
  }

  // Paso 1: Crear pares y ordenar por velocidad creciente
  const data = scanRates.map((v, i) => ({ v, Ep: peakPotentials[i], index: i }))
  data.sort((a, b) => a.v - b.v)

  // Paso 2: Calcular ln(ν) para cada velocidad
  const lnScanRates = data.map((d) => Math.log(d.v))
  const potentials = data.map((d) => d.Ep)

  // Paso 3: Aplicar ventana móvil
  const r2Values: Array<{ index: number; r2: number; slope: number; intercept: number }> = []

  for (let i = 0; i <= lnScanRates.length - windowSize; i++) {
    const windowX = lnScanRates.slice(i, i + windowSize)
    const windowY = potentials.slice(i, i + windowSize)

    const regression = computeLinearRegression(windowX, windowY)
    if (regression) {
      r2Values.push({
        index: i,
        r2: regression.r2,
        slope: regression.slope,
        intercept: regression.intercept
      })
    }
  }

  // Paso 4: Buscar primer rango "estable"
  for (let i = 0; i <= r2Values.length - minStability; i++) {
    let isStable = true
    for (let j = 0; j < minStability; j++) {
      if (r2Values[i + j].r2 < thresholdR2) {
        isStable = false
        break
      }
    }

    if (isStable) {
      const indexCritical = r2Values[i].index
      const vCritical = data[indexCritical].v
      return {
        vCritical,
        indexCritical,
        r2Values,
        isFound: true,
        debugInfo: `νc detectada en índice ${indexCritical} (v = ${vCritical.toExponential(3)} V/s) con R² = ${r2Values[i].r2.toFixed(4)}`
      }
    }
  }

  // Si no se encontró, devolver el máximo valor disponible
  const lastIndex = lnScanRates.length - 1
  return {
    vCritical: data[lastIndex].v,
    indexCritical: lastIndex,
    r2Values,
    isFound: false,
    debugInfo: `No se encontró νc clara. Usando último punto (v = ${data[lastIndex].v.toExponential(3)} V/s)`
  }
}

/**
 * Calcula E° (potencial formal) a partir de Ep,a y Ep,c
 * Para sistemas reversibles: E° ≈ (Ep,a + Ep,c) / 2
 */
export const calculateFormalPotential = (
  anodicPotentials: number[],
  cathodicPotentials: number[]
): number | null => {
  if (
    !anodicPotentials ||
    !cathodicPotentials ||
    anodicPotentials.length === 0 ||
    cathodicPotentials.length === 0
  ) {
    return null
  }

  const avgAnodic = anodicPotentials.reduce((a, b) => a + b, 0) / anodicPotentials.length
  const avgCathodic = cathodicPotentials.reduce((a, b) => a + b, 0) / cathodicPotentials.length

  return (avgAnodic + avgCathodic) / 2
}

/**
 * Constantes físicas
 */
const CONSTANTS = {
  R: 8.314, // J/(mol·K) - Constante de gases
  F: 96485, // C/mol - Constante de Faraday
  T_DEFAULT: 298.15 // K - Temperatura ambiente (25°C)
}

/**
 * Calcula el coeficiente de transferencia (α) a partir de la pendiente de Ep vs ln(ν)
 *
 * Para sistemas quasi-reversibles/irreversibles:
 * - Pico anódico: Ep,a = E0' + (RT/αₐnF) × ln(v)
 * - Pico catódico: Ep,c = E0' - (RT/αₖnF) × ln(v)
 *
 * Donde:
 * - slope_a = RT/(αₐnF) para anódico
 * - slope_c = -RT/(αₖnF) para catódico
 *
 * @param slope - Pendiente de Ep vs ln(v) (V)
 * @param n - Número de electrones
 * @param temperature - Temperatura (K)
 * @param isAnodic - true para pico anódico, false para catódico
 * @returns Coeficiente de transferencia α
 */
export const calculateTransferCoefficient = (
  slope: number,
  n: number = 1,
  temperature: number = CONSTANTS.T_DEFAULT,
  isAnodic: boolean = true
): number | null => {
  if (slope === 0) return null

  const RT_F = (CONSTANTS.R * temperature) / CONSTANTS.F // ≈ 0.0257 V a 25°C

  // Para pico catódico, la pendiente es negativa
  const effectiveSlope = isAnodic ? slope : -slope

  if (effectiveSlope <= 0) return null

  const alpha = RT_F / (effectiveSlope * n)

  return Math.abs(alpha)
}

/**
 * Calcula la constante de velocidad heterogénea (ks) usando el método de Laviron
 *
 * Para sistemas quasi-reversibles:
 * ks = (αₐnFv/RT) × exp[-(αₐnF/RT)(Ep,a - E0')]
 *
 * Simplificación usando el intercepto de Ep vs ln(v):
 * ks ≈ exp[(αₐnF/RT) × intercept_a]
 *
 * @param alpha - Coeficiente de transferencia
 * @param intercept - Intercepto de la regresión Ep vs ln(v) (V)
 * @param n - Número de electrones
 * @param temperature - Temperatura (K)
 * @param isAnodic - true para pico anódico
 * @returns Constante de velocidad ks (cm/s)
 */
export const calculateHeterogeneousRateConstant = (
  alpha: number,
  intercept: number,
  n: number = 1,
  temperature: number = CONSTANTS.T_DEFAULT
): number | null => {
  if (alpha <= 0 || alpha > 1) return null

  const RT = CONSTANTS.R * temperature
  const F = CONSTANTS.F

  // ks se calcula del intercepto
  // Para anódico: intercept = E0' - (RT/αₐnF) × ln(ks × RT/(αₐnF))
  // Simplificación: ks ≈ exp[(αₐnF/RT) × (intercept - E0')]

  // Asumiendo E0' ≈ intercept (aproximación)
  // ks ≈ (αₐnF × v_ref) / RT donde v_ref es la velocidad de referencia

  // Método alternativo: usar la relación directa
  const exponent = (alpha * n * F * intercept) / RT
  const ks = Math.exp(exponent)

  return ks
}

/**
 * Resultado completo del análisis de Laviron
 */
export interface LavironAnalysisResult {
  alpha: number // Coeficiente de transferencia
  ks: number // Constante de velocidad heterogénea (cm/s)
  E0: number // Potencial formal (V)
  slope: number // Pendiente Ep vs ln(v)
  intercept: number // Intercepto
  r2: number // Coeficiente de determinación
  dataPoints: number
}

/**
 * Análisis completo de Laviron para un conjunto de datos
 *
 * @param scanRates - Velocidades de barrido (V/s)
 * @param peakPotentials - Potenciales de pico (V)
 * @param n - Número de electrones
 * @param temperature - Temperatura (K)
 * @param isAnodic - true para pico anódico
 * @returns Resultado completo con α, ks, E0'
 */
export const performLavironAnalysis = (
  scanRates: number[],
  peakPotentials: number[],
  n: number = 1,
  temperature: number = CONSTANTS.T_DEFAULT,
  isAnodic: boolean = true
): LavironAnalysisResult | null => {
  if (scanRates.length < 3 || peakPotentials.length < 3) {
    return null
  }

  // Calcular ln(v)
  const lnV = scanRates.map((v) => Math.log(v))

  // Regresión lineal Ep vs ln(v)
  const regression = computeLinearRegression(lnV, peakPotentials)

  if (!regression) {
    return null
  }

  // Calcular α
  const alpha = calculateTransferCoefficient(regression.slope, n, temperature, isAnodic)

  if (!alpha) {
    return null
  }

  // Calcular ks
  const ks = calculateHeterogeneousRateConstant(alpha, regression.intercept, n, temperature)

  if (!ks) {
    return null
  }

  // E0' es aproximadamente el intercepto (o promedio de Ep,a y Ep,c)
  const E0 = regression.intercept

  return {
    alpha,
    ks,
    E0,
    slope: regression.slope,
    intercept: regression.intercept,
    r2: regression.r2,
    dataPoints: scanRates.length
  }
}

/**
 * Calcula dos regresiones lineales: antes y después del punto crítico
 * Útil para visualizar el cambio de comportamiento en Laviron
 */
export interface BilinearRegressionResult {
  beforeCritical: LinearRegressionResult | null
  afterCritical: LinearRegressionResult | null
  criticalIndex: number
}

export const calculateBilinearRegression = (
  xs: number[],
  ys: number[],
  criticalIndex: number
): BilinearRegressionResult => {
  const beforeCritical =
    criticalIndex > 1
      ? computeLinearRegression(xs.slice(0, criticalIndex), ys.slice(0, criticalIndex))
      : null

  const afterCritical =
    criticalIndex < xs.length - 1
      ? computeLinearRegression(xs.slice(criticalIndex), ys.slice(criticalIndex))
      : null

  return {
    beforeCritical,
    afterCritical,
    criticalIndex
  }
}
