import React from 'react'
import { IProcessFile } from '@shared/models/files'
import { generateRandomId } from '@renderer/utils/common'
import Decimal from 'decimal.js'

// Define a type for the wasm module to avoid using 'any'
// This improves type safety and autocompletion.
type WasmModule = typeof import('math-lib')

export type Point = Decimal[]

export interface FitResult {
  degree: Decimal
  coefficients: Decimal[]
  r2: Decimal
  mse: Decimal
}

const polynomialFit = (wasm: WasmModule, points: Point[], degree: Decimal): FitResult => {
  if (!wasm) {
    throw new Error('Wasm module is not loaded.')
  }

  const pointsJson = JSON.stringify(
    points.map((p) => ({
      x: p[0].toString(),
      y: p[1].toString()
    }))
  )

  try {
    const result = wasm.polynomial_fit(pointsJson, degree.toNumber())

    return {
      degree,
      coefficients: result.coefficients.map((c: string) => new Decimal(c)),
      r2: new Decimal(result.r2),
      mse: new Decimal(result.mse)
    }
  } catch (error) {
    console.error('Error in polynomial fitting:', error)
    return {
      degree,
      coefficients: [],
      r2: new Decimal(0),
      mse: new Decimal(Infinity)
    }
  }
}

const findBestFits = (wasm: WasmModule, points: Point[]): FitResult[] => {
  return Array.from({ length: 10 }, (_, i) => polynomialFit(wasm, points, new Decimal(i + 1)))
    .filter((result) => result.r2.isFinite()) // Filter out errors
    .sort((a, b) => b.r2.sub(a.r2).toNumber()) // Sort from highest to lowest R²
}

const generatePointsFromFitResult = (
  fitResult: FitResult,
  numberOfPoints: number,
  minX: Decimal,
  maxX: Decimal
): Point[] => {
  const points: Point[] = []
  const step = maxX.sub(minX).div(numberOfPoints - 1)

  for (let i = 0; i < numberOfPoints; i++) {
    const x = minX.add(step.mul(i))
    let y = new Decimal(0)

    fitResult.coefficients.forEach((coef, index) => {
      y = y.add(coef.mul(x.pow(index)))
    })

    points.push([x, y])
  }

  return points
}

/**
 * Custom hook providing polynomial fit functions.
 * fit: fits a subset of points with optional degree|
 * fitMultiple: fits multiple files with optional degree
 */
export const useFit = () => {
  const [wasm, setWasm] = React.useState<typeof import('math-lib') | null>(null)

  React.useEffect(() => {
    import('math-lib').then((wasm) => setWasm(wasm)).catch(console.error)
  }, [])

  const fit = React.useCallback(
    (
      toAnalysis: Point[],
      selectedPoints: number[],
      selectedDegree: number = 0
    ): { point: Point[]; fit: FitResult } | null => {
      if (!wasm) return null
      const dataPoints =
        selectedPoints.length > 0
          ? toAnalysis.filter((_, idx) => selectedPoints.includes(idx))
          : toAnalysis
      let fitResult: FitResult
      if (selectedDegree === 0) {
        const bestFits = findBestFits(wasm, dataPoints)
        if (bestFits.length === 0) {
          console.warn('No valid fits found.')
          return null
        }
        fitResult = bestFits[0]
      } else {
        fitResult = polynomialFit(wasm, dataPoints, new Decimal(selectedDegree))
      }

      const generatedPoints = generatePointsFromFitResult(
        fitResult,
        toAnalysis.length,
        Decimal.min(...toAnalysis.map((p) => p[0])),
        Decimal.max(...toAnalysis.map((p) => p[0]))
      )

      return { point: generatedPoints, fit: fitResult }
    },
    [wasm]
  )

  const fitMultiple = React.useCallback(
    (
      toAnalysis: IProcessFile[],
      selectedDegree: number = 0
    ): { file: IProcessFile; fit: FitResult }[] => {
      if (!wasm) return []
      return toAnalysis
        .map((file) => {
          const dataPoints: Point[] = file.content.map((c) => [
            new Decimal(c[0]),
            new Decimal(c[1])
          ])
          let fitResult: FitResult
          if (selectedDegree === 0) {
            const bestFits = findBestFits(wasm, dataPoints)
            if (bestFits.length === 0) {
              console.warn('No valid fits found.')
              return null
            }
            fitResult = bestFits[0]
          } else {
            fitResult = polynomialFit(wasm, dataPoints, new Decimal(selectedDegree))
          }

          const generatedPoints = generatePointsFromFitResult(
            fitResult,
            dataPoints.length,
            Decimal.min(...dataPoints.map((p) => p[0])),
            Decimal.max(...dataPoints.map((p) => p[0]))
          )

          const newFile: IProcessFile = {
            ...file,
            id: generateRandomId(),
            content: generatedPoints.map((p) => [p[0].toString(), p[1].toString()])
          }

          return { file: newFile, fit: fitResult }
        })
        .filter((result) => result !== null) as { file: IProcessFile; fit: FitResult }[]
    },
    [wasm]
  )

  return { fit, fitMultiple }
}
