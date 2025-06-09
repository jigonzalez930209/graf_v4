import Decimal from 'decimal.js'
import { mean, sum, transpose, multiply, lusolve } from 'mathjs'

export type Point = Decimal[]

export interface FitResult {
  degree: Decimal
  coefficients: Decimal[]
  r2: Decimal
  mse: Decimal
}

/**
 * Performs polynomial fitting of a given degree and calculates R² and MSE.
 * @param {Point[]} points - List of points [{x, y},...]
 * @param {number} degree - Polynomial degree
 * @returns {FitResult} Fit results
 */
export const polynomialFit = (points: Point[], degree: Decimal): FitResult => {
  const X = points.map((p) =>
    Array.from({ length: degree.add(1).toNumber() }, (_, i) => p[0].pow(i))
  )
  const Y = points.map((p) => [p[1]])

  try {
    // Solve the system X * coef = Y
    const XT = transpose(X)
    const XTX = multiply(XT, X)
    const XTY = multiply(XT, Y)
    const coefficients = lusolve(XTX, XTY).map((row) => {
      console.log(row[0].toNumber())
      return new Decimal(row[0])
    })

    // Compute predicted values
    const predictedY = points.map((p) =>
      coefficients.reduce((sum, c, i) => sum.add(c.mul(p[0].pow(i))), new Decimal(0))
    )

    // Compute R²
    const yMean = mean(Y.flat())
    const ssTotal = sum(Y.map((p) => p[0].sub(yMean).pow(2)))
    const ssResidual = sum(points.map((p, i) => p[1].sub(predictedY[i]).pow(2)))
    const r2 = new Decimal(1).sub(ssResidual.div(ssTotal))

    // Compute MSE
    const mse = ssResidual.div(points.length)

    return { degree, coefficients, r2, mse }
  } catch (error) {
    console.error(`Error calculating fit for degree ${degree}:`, error)
    return { degree, coefficients: [], r2: new Decimal(-Infinity), mse: new Decimal(Infinity) }
  }
}

/**
 * Finds and sorts polynomial fits from degree 1 to 10 by best R².
 * @param {Point[]} points - List of points [{x, y},...]
 * @returns {FitResult[]} Sorted fits from highest to lowest R²
 */
export const findBestFits = (points: Point[]): FitResult[] => {
  return Array.from({ length: 10 }, (_, i) => polynomialFit(points, new Decimal(i + 1)))
    .filter((result) => result.r2.isFinite()) // Filter out errors
    .sort((a, b) => b.r2.sub(a.r2).toNumber()) // Sort from highest to lowest R²
}

/**
 * Generates points based on the best polynomial fit found by findBestFits.
 * @param {Point[]} dataPoints - The original data points used for fitting.
 * @param {number} numberOfPoints - The number of points to generate.
 * @returns {Point} An array of generated points.
 */
export const generatePointsFromBestFit = (dataPoints: Point[], numberOfPoints: number): Point[] => {
  const bestFits = findBestFits(dataPoints)

  if (bestFits.length === 0) {
    console.warn('No valid fits found.')
    return []
  }

  // Use the best fit (the first one in the sorted array)
  const bestFit = bestFits[0]
  const { coefficients } = bestFit

  // Determine the range of x-values for generating points
  const minX = Decimal.min(...dataPoints.map((p) => p[0]))
  const maxX = Decimal.max(...dataPoints.map((p) => p[0]))

  const generatedPoints: Point[] = Array<Point>()
  for (let i = 0; i < numberOfPoints; i++) {
    const x = minX.add(maxX.sub(minX).mul(i / (numberOfPoints - 1)))
    let y = new Decimal(0)
    for (let j = 0; j < coefficients.length; j++) {
      y = y.add(coefficients[j].mul(x.pow(j)))
    }
    generatedPoints.push([x, y])
  }

  return generatedPoints
}

/**
 * Generates points based on a specific polynomial fit result.
 * @param {FitResult} fitResult - The result of a polynomial fit.
 * @param {number} numberOfPoints - The number of points to generate.
 * @param {number} minX - The minimum x-value for the generated points.
 * @param {number} maxX - The maximum x-value for the generated points.
 * @returns {Point} An array of generated points.
 */
export const generatePointsFromFitResult = (
  fitResult: FitResult,
  numberOfPoints: number,
  minX: Decimal,
  maxX: Decimal
): Point[] => {
  const { coefficients } = fitResult
  const generatedPoints: Point[] = Array<Point>()
  for (let i = 0; i < numberOfPoints; i++) {
    const x = minX.add(maxX.sub(minX).mul(i / (numberOfPoints - 1)))
    let y = new Decimal(0)
    for (let j = 0; j < coefficients.length; j++) {
      y = y.add(coefficients[j].mul(x.pow(j)))
    }
    generatedPoints.push([x, y])
  }
  return generatedPoints
}

/**
 * Generates points for all the best fits found by findBestFits.
 * @param {Point} dataPoints - The original data points used for fitting.
 * @param {number} numberOfPoints - The number of points to generate for each fit.
 * @returns {Record<number, Point>} An object where keys are the degree of the fit and values are the generated points.
 */
export const generatePointsForAllBestFits = (
  dataPoints: Point[],
  numberOfPoints: number
): Record<number, Point[]> => {
  const bestFits = findBestFits(dataPoints)
  const allGeneratedPoints: Record<number, Point[]> = {}

  if (bestFits.length === 0) {
    console.warn('No valid fits found.')
    return {}
  }

  const minX = Decimal.min(...dataPoints.map((p) => p[0]))
  const maxX = Decimal.max(...dataPoints.map((p) => p[0]))

  bestFits.forEach((fit) => {
    const generatedPoints: Point[] = Array<Point>()
    for (let i = 0; i < numberOfPoints; i++) {
      const x = minX.add(maxX.sub(minX).mul(i / (numberOfPoints - 1)))
      let y = new Decimal(0)
      for (let j = 0; j < fit.coefficients.length; j++) {
        y = y.add(fit.coefficients[j].mul(x.pow(j)))
      }
      generatedPoints.push([x, y])
    }
    allGeneratedPoints[fit.degree.toNumber()] = generatedPoints
  })

  return allGeneratedPoints
}
