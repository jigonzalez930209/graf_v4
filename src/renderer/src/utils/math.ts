import Decimal from 'decimal.js'
import { lusolve } from 'mathjs'

/**
 * Calculates the area of a polygon using the Shoelace formula.
 * The coordinates are expected to be in order (clockwise or counter-clockwise).
 *
 * @param xCoords - An array of x-coordinates (string, number, or Decimal).
 * @param yCoords - An array of y-coordinates (string, number, or Decimal).
 * @returns The area of the polygon as a Decimal instance.
 */
export const calculatePolygonArea = (
  xCoords: (string | number | Decimal)[],
  yCoords: (string | number | Decimal)[]
): Decimal => {
  const n = xCoords.length
  if (n !== yCoords.length || n < 3) {
    return new Decimal(0) // Not a polygon
  }

  let area = new Decimal(0)

  for (let i = 0; i < n; i++) {
    const x1 = new Decimal(xCoords[i])
    const y1 = new Decimal(yCoords[i])
    const x2 = new Decimal(xCoords[(i + 1) % n])
    const y2 = new Decimal(yCoords[(i + 1) % n])

    area = area.plus(x1.times(y2).minus(x2.times(y1)))
  }

  // The formula gives a signed area, so we take the absolute value.
  return area.abs().div(2)
}

/**
 * Calculates the numerical first derivative of a curve given by (x, y) points using central differences.
 * @param coords - An array of [x, y] coordinates.
 * @returns An array of [x, dy/dx] coordinates.
 */
export function numericalDerivative(coords: [Decimal, Decimal][]): [Decimal, Decimal][] {
  const n = coords.length
  if (n < 2) return []
  const derivative: [Decimal, Decimal][] = []
  for (let i = 0; i < n; i++) {
    let dx: Decimal
    let dy: Decimal
    if (i === 0) {
      // Forward difference for the first point
      dx = coords[i + 1][0].minus(coords[i][0])
      dy = coords[i + 1][1].minus(coords[i][1])
    } else if (i === n - 1) {
      // Backward difference for the last point
      dx = coords[i][0].minus(coords[i - 1][0])
      dy = coords[i][1].minus(coords[i - 1][1])
    } else {
      // Central difference for intermediate points
      dx = coords[i + 1][0].minus(coords[i - 1][0])
      dy = coords[i + 1][1].minus(coords[i - 1][1])
    }
    // Avoid division by zero if x points are identical
    const deriv = dx.isZero() ? new Decimal(0) : dy.div(dx)
    derivative.push([coords[i][0], deriv])
  }
  return derivative
}

/**
 * Smooths data using a Savitzky-Golay filter.
 * This method fits a polynomial of a specified order to a window of data points
 * using a least-squares approach and then uses the resulting polynomial to estimate
 * the smoothed value at the center of the window.
 *
 * @param coords The array of [x, y] coordinates to smooth, as Decimal objects.
 * @param windowSize The number of points in the smoothing window. Must be an odd integer >= 3.
 * @param polyOrder The order of the polynomial to fit (e.g., 1 for linear, 2 for quadratic).
 * Must be less than windowSize and between 1 and 5.
 * @returns A new array of smoothed [x, ySmoothed] coordinates as Decimal objects.
 */
export function savitzkyGolaySmooth(
  coords: [Decimal, Decimal][],
  windowSize: number,
  polyOrder: number
): [Decimal, Decimal][] {
  // 1. Validations
  if (windowSize % 2 === 0 || windowSize < 3) {
    throw new Error('windowSize must be odd and >= 3')
  }
  if (polyOrder >= windowSize) {
    throw new Error('polyOrder must be less than windowSize')
  }
  if (polyOrder < 1 || polyOrder > 5) {
    throw new Error('polyOrder must be between 1 and 5. Higher orders require a larger windowSize.')
  }

  const n = coords.length
  const half = Math.floor(windowSize / 2)
  const result: [Decimal, Decimal][] = []

  for (let i = 0; i < n; i++) {
    // Do not smooth the edges where the window is not complete, return original points
    if (i < half || i >= n - half) {
      result.push(coords[i])
      continue
    }

    const window = coords.slice(i - half, i + half + 1)
    const xCenter = coords[i][0]

    // Build Vandermonde matrix X and y-vector using relative x-coordinates for stability
    const X: Decimal[][] = window.map((p) => {
      const row: Decimal[] = []
      const xRelative = p[0].minus(xCenter) // Use relative x for numerical stability
      for (let j = 0; j <= polyOrder; j++) {
        row.push(xRelative.pow(j))
      }
      return row
    })
    const y: Decimal[] = window.map((p) => p[1])

    // Manually compute X^T, XTX, and XTY using Decimal arithmetic
    const XT: Decimal[][] = Array.from({ length: polyOrder + 1 }, (_, col) =>
      X.map((row) => row[col])
    )

    const XTX: Decimal[][] = Array.from({ length: polyOrder + 1 }, () =>
      Array(polyOrder + 1).fill(new Decimal(0))
    )
    for (let r = 0; r <= polyOrder; r++) {
      for (let c = 0; c <= polyOrder; c++) {
        let sum = new Decimal(0)
        for (let k = 0; k < window.length; k++) {
          sum = sum.plus(XT[r][k].times(X[k][c]))
        }
        XTX[r][c] = sum
      }
    }

    const XTY: Decimal[] = Array(polyOrder + 1).fill(new Decimal(0))
    for (let r = 0; r <= polyOrder; r++) {
      let sum = new Decimal(0)
      for (let k = 0; k < window.length; k++) {
        sum = sum.plus(XT[r][k].times(y[k]))
      }
      XTY[r] = sum
    }

    // Convert to numbers to use math.js solver. Precision loss is minimized here.
    const XTX_num = XTX.map((row) => row.map((d) => d.toNumber()))
    const XTY_num = XTY.map((d) => d.toNumber())

    try {
      // Solve the system (XTX)c = XTY for coefficients c
      const coeffsMatrix = lusolve(XTX_num, XTY_num)
      // Explicitly cast the result from math.js to a 2D array for TypeScript
      const coeffs: number[] = (coeffsMatrix.valueOf() as number[][]).flat()

      // With relative coordinates, the smoothed value at the center (where x_relative=0)
      // is simply the first coefficient of the polynomial, c[0].
      const ySmoothed = new Decimal(coeffs[0])
      result.push([xCenter, ySmoothed])
    } catch (error) {
      console.warn(
        `Could not compute smoothed value at index ${i} (matrix may be singular). Falling back to original point.`,
        error
      )
      result.push(coords[i])
    }
  }

  return result
}

/**
 * Calculates the first derivative of data using a Savitzky-Golay filter.
 * This method fits a polynomial to a window of data and then calculates the
 * analytical derivative of that polynomial at the center point.
 *
 * @param coords The array of [x, y] coordinates.
 * @param windowSize The number of points in the window. Must be an odd integer >= 3.
 * @param polyOrder The order of the polynomial to fit. Must be >= 1.
 * @returns A new array of [x, dy/dx] coordinates.
 */
export function savitzkyGolayDerivative(
  coords: [Decimal, Decimal][],
  windowSize: number,
  polyOrder: number
): [Decimal, Decimal][] {
  if (windowSize % 2 === 0 || windowSize < 3) {
    throw new Error('windowSize must be odd and >= 3')
  }
  if (polyOrder >= windowSize) {
    throw new Error('polyOrder must be less than windowSize')
  }
  if (polyOrder < 1 || polyOrder > 5) {
    throw new Error('polyOrder must be between 1 and 5.')
  }

  const n = coords.length
  const half = Math.floor(windowSize / 2)
  const result: [Decimal, Decimal][] = []

  // Fallback for insufficient data points
  if (n < windowSize) {
    console.warn(
      `Not enough data points (${n}) for window size (${windowSize}). Falling back to simple numerical derivative.`
    )
    return numericalDerivative(coords)
  }

  for (let i = 0; i < n; i++) {
    // Fallback to simpler difference methods for edges where the full window is not available
    if (i < half || i >= n - half) {
      let dx: Decimal
      let dy: Decimal
      if (i === 0 && n > 1) {
        // Forward difference for the first point
        dx = coords[i + 1][0].minus(coords[i][0])
        dy = coords[i + 1][1].minus(coords[i][1])
      } else if (i === n - 1 && n > 1) {
        // Backward difference for the last point
        dx = coords[i][0].minus(coords[i - 1][0])
        dy = coords[i][1].minus(coords[i - 1][1])
      } else if (i > 0 && i < n - 1) {
        // Central difference for other edge points
        dx = coords[i + 1][0].minus(coords[i - 1][0])
        dy = coords[i + 1][1].minus(coords[i - 1][1])
      } else {
        // Not enough points for any difference (e.g., n=1), derivative is 0
        result.push([coords[i][0], new Decimal(0)])
        continue
      }

      const deriv = dx.isZero() ? new Decimal(0) : dy.div(dx)
      result.push([coords[i][0], deriv])
      continue
    }

    const window = coords.slice(i - half, i + half + 1)
    const xCenter = coords[i][0]

    const X: Decimal[][] = window.map((p) => {
      const row: Decimal[] = []
      const xRelative = p[0].minus(xCenter)
      for (let j = 0; j <= polyOrder; j++) {
        row.push(xRelative.pow(j))
      }
      return row
    })
    const y: Decimal[] = window.map((p) => p[1])

    const XT: Decimal[][] = Array.from({ length: polyOrder + 1 }, (_, col) =>
      X.map((row) => row[col])
    )

    const XTX: Decimal[][] = Array.from({ length: polyOrder + 1 }, () =>
      Array(polyOrder + 1).fill(new Decimal(0))
    )
    for (let r = 0; r <= polyOrder; r++) {
      for (let c = 0; c <= polyOrder; c++) {
        let sum = new Decimal(0)
        for (let k = 0; k < window.length; k++) {
          sum = sum.plus(XT[r][k].times(X[k][c]))
        }
        XTX[r][c] = sum
      }
    }

    const XTY: Decimal[] = Array(polyOrder + 1).fill(new Decimal(0))
    for (let r = 0; r <= polyOrder; r++) {
      let sum = new Decimal(0)
      for (let k = 0; k < window.length; k++) {
        sum = sum.plus(XT[r][k].times(y[k]))
      }
      XTY[r] = sum
    }

    const XTX_num = XTX.map((row) => row.map((d) => d.toNumber()))
    const XTY_num = XTY.map((d) => d.toNumber())

    try {
      const coeffsMatrix = lusolve(XTX_num, XTY_num)
      const coeffs: number[] = (coeffsMatrix.valueOf() as number[][]).flat()

      // The first derivative at the center (x_relative=0) is the c[1] coefficient.
      const derivative = new Decimal(coeffs[1] || 0)
      result.push([xCenter, derivative])
    } catch (error) {
      console.warn(`Could not compute derivative at index ${i}. Falling back to zero.`, error)
      result.push([coords[i][0], new Decimal(0)])
    }
  }

  return result
}
