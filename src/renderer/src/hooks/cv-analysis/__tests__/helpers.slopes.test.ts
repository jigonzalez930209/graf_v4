import { describe, it, expect } from 'vitest'
import { linearRegression, regressionLogLog, regressionVsSqrt } from '../helpers/slopes'

describe('CV Analysis Helpers - Slopes & Regressions', () => {
  describe('linearRegression', () => {
    it('should calculate linear regression for perfect line', () => {
      const x = [1, 2, 3, 4, 5]
      const y = [2, 4, 6, 8, 10] // y = 2x

      const result = linearRegression(x, y)

      expect(result).not.toBeNull()
      expect(result!.slope).toBeCloseTo(2, 5)
      expect(result!.intercept).toBeCloseTo(0, 5)
      expect(result!.r2).toBeCloseTo(1, 5)
      expect(result!.points).toBe(5)
    })

    it('should calculate linear regression with offset', () => {
      const x = [0, 1, 2, 3, 4]
      const y = [1, 3, 5, 7, 9] // y = 2x + 1

      const result = linearRegression(x, y)

      expect(result).not.toBeNull()
      expect(result!.slope).toBeCloseTo(2, 5)
      expect(result!.intercept).toBeCloseTo(1, 5)
      expect(result!.r2).toBeCloseTo(1, 5)
    })

    it('should handle noisy data', () => {
      const x = [1, 2, 3, 4, 5]
      const y = [2.1, 3.9, 6.1, 7.9, 10.2] // y ≈ 2x with noise

      const result = linearRegression(x, y)

      expect(result).not.toBeNull()
      expect(result!.slope).toBeCloseTo(2, 1) // Less precision due to noise
      expect(result!.r2).toBeLessThan(1)
      expect(result!.r2).toBeGreaterThan(0.95)
    })

    it('should return null for insufficient data', () => {
      const result = linearRegression([1], [1])
      expect(result).toBeNull()
    })

    it('should return null for empty arrays', () => {
      const result = linearRegression([], [])
      expect(result).toBeNull()
    })

    it('should handle negative slopes', () => {
      const x = [1, 2, 3, 4, 5]
      const y = [10, 8, 6, 4, 2] // y = -2x + 12

      const result = linearRegression(x, y)

      expect(result).not.toBeNull()
      expect(result!.slope).toBeCloseTo(-2, 5)
      expect(result!.r2).toBeCloseTo(1, 5)
    })
  })

  describe('regressionLogLog', () => {
    it('should handle power law relationships', () => {
      // y = x^2 => log(y) = 2*log(x)
      const x = [1, 2, 3, 4, 5]
      const y = [1, 4, 9, 16, 25]

      const result = regressionLogLog(x, y)

      expect(result).not.toBeNull()
      expect(result!.slope).toBeCloseTo(2, 1)
      expect(result!.r2).toBeGreaterThan(0.99)
    })

    it('should return null for zero or negative values', () => {
      const x = [0, 1, 2, 3]
      const y = [1, 2, 3, 4]

      const result = regressionLogLog(x, y)
      expect(result).toBeNull()
    })

    it('should return null for insufficient data', () => {
      const result = regressionLogLog([1], [1])
      expect(result).toBeNull()
    })

    it('should handle diffusion-like behavior (slope ≈ 0.5)', () => {
      // Simulate diffusion: current proportional to sqrt(scanRate)
      const scanRates = [10, 25, 50, 100, 200]
      const currents = scanRates.map((v) => Math.sqrt(v) * 1e-5)

      const result = regressionLogLog(scanRates, currents)

      expect(result).not.toBeNull()
      expect(result!.slope).toBeCloseTo(0.5, 1)
    })
  })

  describe('regressionVsSqrt', () => {
    it('should calculate regression against sqrt(x)', () => {
      // y = 2*sqrt(x)
      const x = [1, 4, 9, 16, 25]
      const y = [2, 4, 6, 8, 10]

      const result = regressionVsSqrt(x, y)

      expect(result).not.toBeNull()
      expect(result!.slope).toBeCloseTo(2, 5)
      expect(result!.r2).toBeCloseTo(1, 5)
    })

    it('should return null for negative x values', () => {
      const x = [-1, 0, 1, 2]
      const y = [1, 2, 3, 4]

      const result = regressionVsSqrt(x, y)
      expect(result).toBeNull()
    })

    it('should return null for insufficient data', () => {
      const result = regressionVsSqrt([1], [1])
      expect(result).toBeNull()
    })

    it('should handle Randles-Sevcik case (ip vs sqrt(v))', () => {
      // Randles-Sevcik: ip = k * sqrt(v)
      const scanRates = [10, 25, 50, 100, 200]
      const peakCurrents = scanRates.map((v) => 2.69e5 * Math.sqrt(v) * 1e-6)

      const result = regressionVsSqrt(scanRates, peakCurrents)

      expect(result).not.toBeNull()
      expect(result!.r2).toBeGreaterThan(0.99)
    })
  })
})
