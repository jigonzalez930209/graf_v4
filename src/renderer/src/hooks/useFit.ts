import React from 'react'
import {
  findBestFits,
  polynomialFit,
  FitResult,
  generatePointsFromFitResult,
  Point
} from '@renderer/utils/fits'
import { IProcessFile } from '@shared/models/files'
import { generateRandomId } from '@renderer/utils/common'
import Decimal from 'decimal.js'

/**
 * Custom hook providing polynomial fit functions.
 * fit: fits a subset of points with optional degree|
 * fitMultiple: fits multiple files with optional degree
 */
export const useFit = () => {
  const fit = React.useCallback(
    (
      toAnalysis: Point[],
      selectedPoints: number[],
      selectedDegree: number = 0
    ): { point: Point[]; fit: FitResult } | null => {
      const dataPoints = toAnalysis.filter((_, idx) => selectedPoints.includes(idx))
      let fitResult: FitResult
      if (selectedDegree === 0) {
        const bestFits = findBestFits(dataPoints)
        if (bestFits.length === 0) {
          console.warn('No valid fits found.')
          return null
        }
        fitResult = bestFits[0]
      } else {
        fitResult = polynomialFit(dataPoints, new Decimal(selectedDegree))
      }

      const generatedPoints = generatePointsFromFitResult(
        fitResult,
        toAnalysis.length,
        Decimal.min(...toAnalysis.map((p) => p[0])),
        Decimal.max(...toAnalysis.map((p) => p[0])),
        selectedDegree
      )

      return { point: generatedPoints, fit: fitResult }
    },
    []
  )

  const fitMultiple = React.useCallback(
    (
      toAnalysis: IProcessFile[],
      selectedDegree: number = 0
    ): { file: IProcessFile; fit: FitResult }[] => {
      return toAnalysis
        .map((file) => {
          const dataPoints: Point[] = file.content.map((c) => [
            new Decimal(c[0]),
            new Decimal(c[1])
          ])
          let fitResult: FitResult
          if (selectedDegree === 0) {
            const bestFits = findBestFits(dataPoints)
            if (bestFits.length === 0) {
              console.warn('No valid fits found.')
              return null
            }
            fitResult = bestFits[0]
          } else {
            fitResult = polynomialFit(dataPoints, new Decimal(selectedDegree))
          }

          const generatedPoints = generatePointsFromFitResult(
            fitResult,
            file.content.length,
            Decimal.min(...file.content.map((p) => p[0])),
            Decimal.max(...file.content.map((p) => p[0])),
            selectedDegree
          )
          const id = generateRandomId()
          const f: IProcessFile = {
            ...file,
            id,
            content: generatedPoints.map((p) => [p[0].toString(), p[1].toString()]),
            selected: true,
            name: file.name + ' fit',
            type: file.type
          }

          return { file: f, fit: fitResult }
        })
        .filter((r): r is { file: IProcessFile; fit: FitResult } => r !== null)
    },
    []
  )

  return { fit, fitMultiple }
}
