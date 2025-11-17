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
