import { IProcessFile } from '@shared/models/files'
import { linearRegression, linearRegressionLine, rSquared } from 'simple-statistics'

export type PotentialRange = {
  min: number
  max: number
}

export type PeakPoint = {
  potential: number
  current: number
}

export type FileExtremes = {
  fileId: string
  fileName: string
  scanRate: number
  positivePeak?: PeakPoint
  negativePeak?: PeakPoint
}

export type LinearFit = {
  m: number
  b: number
  r: number
}

export type GraphData = {
  x: number[]
  y: number[]
  labels?: string[]
}

export type ScanRateCorrelationResult = {
  files: FileExtremes[]
  positive: {
    potential: LinearFit | null
    current: LinearFit | null
  }
  negative: {
    potential: LinearFit | null
    current: LinearFit | null
  }
  // Datos para gráficos
  graphData: {
    potentialVsScanRate: GraphData
    positiveCurrentVsScanRate: GraphData
    negativeCurrentVsScanRate: GraphData
  }
}

export type ScanRateCorrelationParams = {
  files: IProcessFile[]
  potentialRange: PotentialRange
  /**
   * Función que devuelve la velocidad de barrido (V/s) para un archivo.
   * Puedes usar la metadata `voltammeter` o cualquier otra fuente.
   */
  getScanRate: (file: IProcessFile) => number | null | undefined
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const buildLinearFit = (points: number[][]): LinearFit | null => {
  if (!points || points.length < 2) return null

  const reg = linearRegression(points)
  const lineEq = linearRegressionLine(reg)
  const r = rSquared(points, lineEq)

  return {
    m: reg.m,
    b: reg.b,
    r
  }
}

const computeFileExtremes = (
  file: IProcessFile,
  potentialRange: PotentialRange,
  scanRate: number
): FileExtremes | null => {
  const [minE, maxE] = [potentialRange.min, potentialRange.max].sort((a, b) => a - b)

  let positivePeak: PeakPoint | undefined
  let negativePeak: PeakPoint | undefined

  for (const row of file.content) {
    const potential = parseFloat(row[0])
    const current = parseFloat(row[1])

    if (!isFiniteNumber(potential) || !isFiniteNumber(current)) continue
    if (potential < minE || potential > maxE) continue

    if (!positivePeak || current > positivePeak.current) {
      positivePeak = { potential, current }
    }
    if (!negativePeak || current < negativePeak.current) {
      negativePeak = { potential, current }
    }
  }

  if (!positivePeak && !negativePeak) {
    return null
  }

  return {
    fileId: file.id,
    fileName: file.name,
    scanRate,
    positivePeak,
    negativePeak
  }
}

/**
 * Hook para calcular las correlaciones entre velocidad de barrido y
 * potencial/corriente en los extremos (mínimo y máximo de I) de cada curva.
 */
export const useScanRateCorrelation = () => {
  const calculateCorrelation = ({
    files,
    potentialRange,
    getScanRate
  }: ScanRateCorrelationParams): ScanRateCorrelationResult => {
    const extremes: FileExtremes[] = []

    for (const file of files) {
      const scanRate = getScanRate(file)
      if (!isFiniteNumber(scanRate)) continue

      const fileExtremes = computeFileExtremes(file, potentialRange, scanRate)
      if (fileExtremes) {
        extremes.push(fileExtremes)
      }
    }

    const positivePotentialPoints: number[][] = []
    const positiveCurrentPoints: number[][] = []
    const negativePotentialPoints: number[][] = []
    const negativeCurrentPoints: number[][] = []

    for (const item of extremes) {
      const { scanRate, positivePeak, negativePeak } = item

      if (positivePeak) {
        positivePotentialPoints.push([scanRate, positivePeak.potential])
        positiveCurrentPoints.push([scanRate, positivePeak.current])
      }

      if (negativePeak) {
        negativePotentialPoints.push([scanRate, negativePeak.potential])
        negativeCurrentPoints.push([scanRate, negativePeak.current])
      }
    }

    const positivePotentialFit = buildLinearFit(positivePotentialPoints)
    const positiveCurrentFit = buildLinearFit(positiveCurrentPoints)
    const negativePotentialFit = buildLinearFit(negativePotentialPoints)
    const negativeCurrentFit = buildLinearFit(negativeCurrentPoints)

    // Preparar datos para gráficos
    const potentialVsScanRate: GraphData = {
      x: [...positivePotentialPoints.map((p) => p[0]), ...negativePotentialPoints.map((p) => p[0])],
      y: [...positivePotentialPoints.map((p) => p[1]), ...negativePotentialPoints.map((p) => p[1])],
      labels: [
        ...positivePotentialPoints.map(() => 'Positive'),
        ...negativePotentialPoints.map(() => 'Negative')
      ]
    }

    const positiveCurrentVsScanRate: GraphData = {
      x: positiveCurrentPoints.map((p) => p[0]),
      y: positiveCurrentPoints.map((p) => p[1]),
      labels: positiveCurrentPoints.map(() => 'Imax')
    }

    const negativeCurrentVsScanRate: GraphData = {
      x: negativeCurrentPoints.map((p) => p[0]),
      y: negativeCurrentPoints.map((p) => p[1]),
      labels: negativeCurrentPoints.map(() => 'Imin')
    }

    return {
      files: extremes,
      positive: {
        potential: positivePotentialFit,
        current: positiveCurrentFit
      },
      negative: {
        potential: negativePotentialFit,
        current: negativeCurrentFit
      },
      graphData: {
        potentialVsScanRate,
        positiveCurrentVsScanRate,
        negativeCurrentVsScanRate
      }
    }
  }

  return { calculateCorrelation }
}
