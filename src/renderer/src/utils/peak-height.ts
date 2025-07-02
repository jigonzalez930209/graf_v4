import Decimal from 'decimal.js'

/**
 * Calculates the perpendicular distance from a point to a line defined by two points.
 *
 * @param x - The x-coordinate of the point
 * @param y - The y-coordinate of the point
 * @param x1 - The x-coordinate of the first point on the line
 * @param y1 - The y-coordinate of the first point on the line
 * @param x2 - The x-coordinate of the second point on the line
 * @param y2 - The y-coordinate of the second point on the line
 * @returns The perpendicular distance from the point to the line
 */
export const calculatePerpendicularDistance = (
  x: Decimal,
  y: Decimal,
  x1: Decimal,
  y1: Decimal,
  x2: Decimal,
  y2: Decimal
): Decimal => {
  // Calculate the line equation: ax + by + c = 0
  const a = y2.minus(y1)
  const b = x1.minus(x2)
  const c = x2.times(y1).minus(x1.times(y2))

  // Calculate the perpendicular distance
  const numerator = a.times(x).plus(b.times(y)).plus(c).abs()
  const denominator = a.pow(2).plus(b.pow(2)).sqrt()

  // Avoid division by zero
  if (denominator.isZero()) {
    return new Decimal(0)
  }

  return numerator.div(denominator)
}

/**
 * Calculates the peak height of a curve relative to a baseline defined by two points.
 * The peak height is the maximum perpendicular distance from any point on the curve to the baseline.
 *
 * @param points - Array of [x, y] coordinates as strings or numbers
 * @param p1 - First point defining the baseline {x, y}
 * @param p2 - Second point defining the baseline {x, y}
 * @returns The peak height as a Decimal
 */
export const calculatePeakHeight = (
  points: [string | number, string | number][],
  p1: { x: Decimal; y: Decimal },
  p2: { x: Decimal; y: Decimal }
): Decimal => {
  if (points.length === 0) {
    return new Decimal(0)
  }

  let maxDistance = new Decimal(0)

  // Find the point with the maximum perpendicular distance to the baseline
  for (let i = 0; i < points.length; i++) {
    const x = new Decimal(points[i][0])
    const y = new Decimal(points[i][1])

    const distance = calculatePerpendicularDistance(x, y, p1.x, p1.y, p2.x, p2.y)

    if (distance.greaterThan(maxDistance)) {
      maxDistance = distance
    }
  }

  return maxDistance
}

/**
 * Calculates the peak height and returns additional information about the peak.
 *
 * @param points - Array of [x, y] coordinates as strings or numbers
 * @param p1 - First point defining the baseline {x, y, pointIndex}
 * @param p2 - Second point defining the baseline {x, y, pointIndex}
 * @returns Object containing peak height, peak position, and peak index
 */
export const calculatePeakInfo = (
  points: [string | number, string | number][],
  p1: { x: Decimal; y: Decimal; pointIndex: number },
  p2: { x: Decimal; y: Decimal; pointIndex: number }
): {
  peakHeight: Decimal
  peakX: Decimal
  peakY: Decimal
  peakIndex: number
} => {
  if (points.length === 0) {
    return {
      peakHeight: new Decimal(0),
      peakX: new Decimal(0),
      peakY: new Decimal(0),
      peakIndex: -1
    }
  }

  let maxDistance = new Decimal(0)
  let peakIndex = -1

  // Find the point with the maximum perpendicular distance to the baseline
  for (let i = 0; i < points.length; i++) {
    const x = new Decimal(points[i][0])
    const y = new Decimal(points[i][1])

    const distance = calculatePerpendicularDistance(x, y, p1.x, p1.y, p2.x, p2.y)

    if (distance.greaterThan(maxDistance)) {
      maxDistance = distance
      peakIndex = i
    }
  }

  // If no peak found, return zeros
  if (peakIndex === -1) {
    return {
      peakHeight: new Decimal(0),
      peakX: new Decimal(0),
      peakY: new Decimal(0),
      peakIndex: -1
    }
  }

  // Return peak information
  return {
    peakHeight: maxDistance,
    peakX: new Decimal(points[peakIndex][0]),
    peakY: new Decimal(points[peakIndex][1]),
    peakIndex
  }
}
