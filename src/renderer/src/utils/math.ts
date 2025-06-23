import Decimal from 'decimal.js'

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
