import { CVConfig, Peak } from '../types'

const RANDLES_COEFFICIENT = 2.69e5

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

export const comparePeakWithRandles = (
  peak: Peak | undefined,
  config: CVConfig
): { expected?: number; ratio?: number } => {
  if (!peak) return {}
  const expected = estimateDiffusionalCurrent(config)
  if (!expected) return { expected }
  return { expected, ratio: peak.Ip / expected }
}
