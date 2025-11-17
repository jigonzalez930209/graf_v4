import { describe, it, expect } from 'vitest'
import {
  isFiniteNumber,
  calculateDeltaEp,
  trapezoidalIntegral,
  pickPrimaryPeaks
} from '../helpers/utils'
import type { Peak } from '../types'

describe('CV Analysis Helpers - Utils', () => {
  describe('isFiniteNumber', () => {
    it('should return true for valid finite numbers', () => {
      expect(isFiniteNumber(0)).toBe(true)
      expect(isFiniteNumber(1.5)).toBe(true)
      expect(isFiniteNumber(-100)).toBe(true)
      expect(isFiniteNumber(1e-10)).toBe(true)
    })

    it('should return false for non-numbers', () => {
      expect(isFiniteNumber('123')).toBe(false)
      expect(isFiniteNumber(null)).toBe(false)
      expect(isFiniteNumber(undefined)).toBe(false)
      expect(isFiniteNumber({})).toBe(false)
    })

    it('should return false for Infinity and NaN', () => {
      expect(isFiniteNumber(Infinity)).toBe(false)
      expect(isFiniteNumber(-Infinity)).toBe(false)
      expect(isFiniteNumber(NaN)).toBe(false)
    })
  })

  describe('calculateDeltaEp', () => {
    it('should calculate delta Ep correctly', () => {
      const anodic: Peak = { Ep: 0.5, Ip: 1e-5, index: 10, direction: 'anodic' }
      const cathodic: Peak = { Ep: -0.3, Ip: -1e-5, index: 5, direction: 'cathodic' }

      const deltaEp = calculateDeltaEp(anodic, cathodic)
      expect(deltaEp).toBeCloseTo(0.8, 5)
    })

    it('should return undefined if either peak is missing', () => {
      const anodic: Peak = { Ep: 0.5, Ip: 1e-5, index: 10, direction: 'anodic' }

      expect(calculateDeltaEp(anodic, undefined)).toBeUndefined()
      expect(calculateDeltaEp(undefined, anodic)).toBeUndefined()
      expect(calculateDeltaEp(undefined, undefined)).toBeUndefined()
    })

    it('should handle same potential (reversible case)', () => {
      const peak1: Peak = { Ep: 0.0, Ip: 1e-5, index: 10, direction: 'anodic' }
      const peak2: Peak = { Ep: 0.0, Ip: -1e-5, index: 5, direction: 'cathodic' }

      const deltaEp = calculateDeltaEp(peak1, peak2)
      expect(deltaEp).toBeCloseTo(0, 5)
    })
  })

  describe('trapezoidalIntegral', () => {
    it('should calculate integral of linear function correctly', () => {
      const x = [0, 1, 2, 3, 4]
      const y = [0, 1, 2, 3, 4] // y = x

      const integral = trapezoidalIntegral(x, y)
      // Integral of x from 0 to 4 = 8
      expect(integral).toBeCloseTo(8, 5)
    })

    it('should handle constant function', () => {
      const x = [0, 1, 2, 3]
      const y = [5, 5, 5, 5]

      const integral = trapezoidalIntegral(x, y)
      // Integral of 5 from 0 to 3 = 15
      expect(integral).toBeCloseTo(15, 5)
    })

    it('should return 0 for empty arrays', () => {
      expect(trapezoidalIntegral([], [])).toBe(0)
    })

    it('should return 0 for single point', () => {
      expect(trapezoidalIntegral([1], [1])).toBe(0)
    })

    it('should handle negative values', () => {
      const x = [0, 1, 2]
      const y = [-1, 0, 1]

      const integral = trapezoidalIntegral(x, y)
      // Area under curve: (-1 + 0)/2 * 1 + (0 + 1)/2 * 1 = -0.5 + 0.5 = 0
      expect(integral).toBeCloseTo(0, 5)
    })
  })

  describe('pickPrimaryPeaks', () => {
    it('should pick the highest anodic and cathodic peaks', () => {
      const peaks: Peak[] = [
        { Ep: 0.2, Ip: 5e-6, index: 5, direction: 'anodic' },
        { Ep: 0.5, Ip: 1e-5, index: 10, direction: 'anodic' }, // highest anodic
        { Ep: -0.1, Ip: -8e-6, index: 3, direction: 'cathodic' }, // highest cathodic
        { Ep: -0.4, Ip: -3e-6, index: 8, direction: 'cathodic' }
      ]

      const result = pickPrimaryPeaks(peaks)

      expect(result.anodic?.Ip).toBe(1e-5)
      expect(result.cathodic?.Ip).toBe(-8e-6)
    })

    it('should handle missing cathodic peak', () => {
      const peaks: Peak[] = [
        { Ep: 0.2, Ip: 5e-6, index: 5, direction: 'anodic' },
        { Ep: 0.5, Ip: 1e-5, index: 10, direction: 'anodic' }
      ]

      const result = pickPrimaryPeaks(peaks)

      expect(result.anodic?.Ip).toBe(1e-5)
      expect(result.cathodic).toBeUndefined()
    })

    it('should handle empty peaks array', () => {
      const result = pickPrimaryPeaks([])

      expect(result.anodic).toBeUndefined()
      expect(result.cathodic).toBeUndefined()
    })
  })
})
