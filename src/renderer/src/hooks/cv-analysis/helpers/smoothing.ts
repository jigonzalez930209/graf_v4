import Decimal from 'decimal.js'

import { savitzkyGolaySmooth } from '@renderer/utils/math'

export type SmoothingParams = {
  windowSize: number
  polyOrder: number
}

export const applySavitzkyGolay = (
  potential: number[],
  current: number[],
  params: SmoothingParams
): number[] => {
  if (!potential.length || potential.length !== current.length) return current

  const coords = potential.map(
    (e, idx) => [new Decimal(e), new Decimal(current[idx])] as [Decimal, Decimal]
  )

  const smoothed = savitzkyGolaySmooth(coords, params.windowSize, params.polyOrder)
  return smoothed.map(([, y]) => y.toNumber())
}

/**
 * Suavizado simple con promedio móvil (fallback cuando Savitzky-Golay no está disponible)
 */
export const applyMovingAverage = (data: number[], windowSize: number = 5): number[] => {
  if (data.length < windowSize) return data

  const result: number[] = []
  const halfWindow = Math.floor(windowSize / 2)

  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - halfWindow)
    const end = Math.min(data.length, i + halfWindow + 1)
    const window = data.slice(start, end)
    const avg = window.reduce((sum, val) => sum + val, 0) / window.length
    result.push(avg)
  }

  return result
}
