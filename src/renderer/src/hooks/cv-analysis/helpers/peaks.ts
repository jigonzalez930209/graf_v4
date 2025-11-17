import { Peak } from '../types'

export type PeakDetectionOptions = {
  minProminence?: number
}

export const detectPeaks = (
  potential: number[],
  current: number[],
  options: PeakDetectionOptions = {}
): Peak[] => {
  const { minProminence = 0 } = options
  const peaks: Peak[] = []

  if (potential.length < 3 || current.length < 3 || potential.length !== current.length) {
    return peaks
  }

  for (let i = 1; i < current.length - 1; i++) {
    const prev = current[i - 1]
    const next = current[i + 1]
    const value = current[i]

    const rising = value - prev
    const falling = next - value

    const prominence = Math.max(Math.abs(value - prev), Math.abs(value - next))
    if (prominence < minProminence) continue

    if (rising > 0 && falling < 0) {
      peaks.push({
        Ep: potential[i],
        Ip: value,
        index: i,
        direction: 'anodic'
      })
    }

    if (rising < 0 && falling > 0) {
      peaks.push({
        Ep: potential[i],
        Ip: value,
        index: i,
        direction: 'cathodic'
      })
    }
  }

  return peaks
}
