import { RegressionResult } from '../types'

const computeRegression = (x: number[], y: number[]): RegressionResult | null => {
  if (x.length < 2 || y.length < 2 || x.length !== y.length) {
    return null
  }

  const n = x.length
  const sumX = x.reduce((acc, value) => acc + value, 0)
  const sumY = y.reduce((acc, value) => acc + value, 0)
  const sumXY = x.reduce((acc, value, idx) => acc + value * y[idx], 0)
  const sumX2 = x.reduce((acc, value) => acc + value * value, 0)
  const sumY2 = y.reduce((acc, value) => acc + value * value, 0)

  const denominator = n * sumX2 - sumX * sumX
  if (denominator === 0) return null

  const slope = (n * sumXY - sumX * sumY) / denominator
  const intercept = (sumY - slope * sumX) / n

  const ssTot = sumY2 - (sumY * sumY) / n
  const ssRes = y.reduce((acc, value, idx) => {
    const predicted = slope * x[idx] + intercept
    const residual = value - predicted
    return acc + residual * residual
  }, 0)

  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot

  return { slope, intercept, r2, points: n }
}

export const linearRegression = (x: number[], y: number[]): RegressionResult | null =>
  computeRegression(x, y)

export const regressionWithTransform = (
  x: number[],
  y: number[],
  transform: (value: number) => number
): RegressionResult | null => {
  const tx: number[] = []
  const ty: number[] = []

  for (let i = 0; i < x.length; i++) {
    const transformedX = transform(x[i])
    const transformedY = transform(y[i])
    if (Number.isFinite(transformedX) && Number.isFinite(transformedY)) {
      tx.push(transformedX)
      ty.push(transformedY)
    }
  }

  return computeRegression(tx, ty)
}

export const regressionLogLog = (x: number[], y: number[]): RegressionResult | null => {
  // Validate that all values are non-zero (required for log of absolute value)
  if (x.some((v) => v === 0) || y.some((v) => v === 0)) {
    return null
  }
  return regressionWithTransform(x, y, (value) => Math.log(Math.abs(value)))
}

export const regressionVsSqrt = (x: number[], y: number[]): RegressionResult | null => {
  // Validate that all x values are non-negative (required for sqrt)
  if (x.some((v) => v < 0)) {
    return null
  }

  const tx: number[] = []
  const ty: number[] = []

  for (let i = 0; i < x.length; i++) {
    const transformedX = Math.sqrt(x[i])
    if (Number.isFinite(transformedX) && Number.isFinite(y[i])) {
      tx.push(transformedX)
      ty.push(y[i])
    }
  }

  return computeRegression(tx, ty)
}

/**
 * Regresión lineal forzada al origen (y = mx, donde n = 0)
 * Usada cuando se quiere que la recta pase por el punto (0,0)
 */
export const linearRegressionThroughOrigin = (
  x: number[],
  y: number[]
): RegressionResult | null => {
  if (x.length < 2 || y.length < 2 || x.length !== y.length) {
    return null
  }

  const n = x.length
  const sumXY = x.reduce((acc, value, idx) => acc + value * y[idx], 0)
  const sumX2 = x.reduce((acc, value) => acc + value * value, 0)

  if (sumX2 === 0) return null

  // Pendiente: m = Σ(xy) / Σ(x²)
  const slope = sumXY / sumX2
  const intercept = 0 // Forzado al origen

  // Calcular R²
  const sumY = y.reduce((acc, value) => acc + value, 0)
  const sumY2 = y.reduce((acc, value) => acc + value * value, 0)
  const ssTot = sumY2 - (sumY * sumY) / n
  const ssRes = y.reduce((acc, value, idx) => {
    const predicted = slope * x[idx]
    const residual = value - predicted
    return acc + residual * residual
  }, 0)

  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot

  return { slope, intercept, r2, points: n }
}
