import Decimal from 'decimal.js'
import React from 'react'
import { findBestFits, FitResult, generatePointsFromFitResult, Point } from '@renderer/utils/fits'
import { IProcessFile } from '@shared/models/files'
import { generateRandomId } from '@renderer/utils/common'

export const useFit = () => {
  const fit = React.useCallback(
    (toAnalysis: Point[], selectedPoints: number[]): { point: Point[]; fit: FitResult } | null => {
      const bestFits = findBestFits(toAnalysis.filter((_, idx) => selectedPoints.includes(idx)))

      if (bestFits.length === 0) {
        console.warn('No valid fits found.')
        return null
      }

      const fit = bestFits[0]
      const generatedPoints = generatePointsFromFitResult(
        fit,
        toAnalysis.length,
        Decimal.min(...toAnalysis.map((p) => p[0])),
        Decimal.max(...toAnalysis.map((p) => p[0]))
      )

      return { point: generatedPoints, fit }
    },
    []
  )

  const fitMultiple = React.useCallback(
    (toAnalysis: IProcessFile[]): { file: IProcessFile; fit: FitResult }[] => {
      const res = toAnalysis.map((file) => {
        const bestFits = findBestFits([
          ...file.content.map((c) => [new Decimal(c[0]), new Decimal(c[1])])
        ])

        if (bestFits.length === 0) {
          console.warn('No valid fits found.')
          return null
        }

        const fit = bestFits[0]
        const generatedPoints = generatePointsFromFitResult(
          fit,
          file.content.length,
          Decimal.min(...file.content.map((p) => p[0])),
          Decimal.max(...file.content.map((p) => p[0]))
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

        return { file: f, fit }
      })
      // filter out nulls
      return res.filter((r): r is { file: IProcessFile; fit: FitResult } => r !== null)
    },
    []
  )

  return { fit, fitMultiple }
}
