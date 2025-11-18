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
 * Calcula el coeficiente de transferencia (α) a partir de la pendiente de Ep vs ln(ν)
 * Laviron: slope = (RT/αnF) × ln(v)
 * A 25°C: slope = (59/αn) mV/decade
 * Asumiendo n=1: α = 59 / (slope × 1000) [si slope está en V]
 */
export const calculateTransferCoefficient = (
  slope: number,
  n: number = 1,
  temperature: number = 298.15 // 25°C en Kelvin
): number | null => {
  if (slope === 0) return null

  // Constantes
  const R = 8.314 // J/(mol·K)
  const F = 96485 // C/mol
  const RT_F = (R * temperature) / F // ≈ 0.0257 V a 25°C

  // De: slope = (RT/αnF) × ln(10) para log10
  // O: slope = (RT/αnF) para ln natural
  // Asumiendo slope es para ln natural:
  const alpha = RT_F / (slope * n)

  return Math.abs(alpha)
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
