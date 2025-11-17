import { IProcessFile } from '@shared/models/files'

import { CVData, Peak } from '../types'

export const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

export const extractCVData = (file: IProcessFile): CVData => {
  const potential: number[] = []
  const current: number[] = []

  if (!file?.content?.length) {
    return { potential, current }
  }

  for (const row of file.content) {
    if (!row || row.length < 2) continue

    const e = Number(row[0])
    const i = Number(row[1])

    if (!isFiniteNumber(e) || !isFiniteNumber(i)) continue

    potential.push(e)
    current.push(i)
  }

  return { potential, current }
}

export const pickPrimaryPeaks = (
  peaks: Peak[]
): {
  anodic?: Peak
  cathodic?: Peak
} => {
  const anodic = peaks.filter((peak) => peak.direction === 'anodic').sort((a, b) => b.Ip - a.Ip)[0]

  const cathodic = peaks
    .filter((peak) => peak.direction === 'cathodic')
    .sort((a, b) => a.Ip - b.Ip)[0]

  return { anodic, cathodic }
}

export const calculateDeltaEp = (anodic?: Peak, cathodic?: Peak): number | undefined => {
  if (!anodic || !cathodic) return undefined
  return Math.abs(anodic.Ep - cathodic.Ep)
}

export const trapezoidalIntegral = (x: number[], y: number[]): number => {
  if (x.length < 2 || y.length < 2 || x.length !== y.length) return 0

  let area = 0
  for (let i = 1; i < x.length; i++) {
    const deltaX = x[i] - x[i - 1]
    if (!Number.isFinite(deltaX)) continue
    const avgY = (y[i] + y[i - 1]) / 2
    area += deltaX * avgY
  }
  return area
}
