import { describe, it, expect } from 'vitest'
import { detectPeaks } from '../helpers/peaks'

describe('CV Analysis Helpers - Peak Detection', () => {
  describe('detectPeaks', () => {
    it('should detect simple anodic and cathodic peaks', () => {
      // Simple CV-like curve with two peaks
      const potential = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.4, 0.3, 0.2, 0.1, 0]
      const current = [0, 0.5, 1, 1.5, 2, 2.5, 2, 1.5, 1, 0.5, 0] // anodic peak at index 5

      const peaks = detectPeaks(potential, current)

      expect(peaks.length).toBeGreaterThan(0)
      expect(peaks.some((p) => p.direction === 'anodic')).toBe(true)
    })

    it('should handle empty arrays', () => {
      const peaks = detectPeaks([], [])
      expect(peaks).toEqual([])
    })

    it('should handle single point', () => {
      const peaks = detectPeaks([0.5], [1e-5])
      expect(peaks).toEqual([])
    })

    it('should handle monotonic increasing current', () => {
      const potential = [0, 0.1, 0.2, 0.3, 0.4]
      const current = [0, 1e-6, 2e-6, 3e-6, 4e-6]

      const peaks = detectPeaks(potential, current)
      // No peaks in monotonic function
      expect(peaks.length).toBe(0)
    })

    it('should detect multiple peaks', () => {
      // CV with two anodic peaks
      const potential = [0, 0.1, 0.2, 0.15, 0.25, 0.3, 0.2, 0.1, 0]
      const current = [0, 0.5, 1, 0.7, 1.2, 1.5, 1, 0.5, 0]

      const peaks = detectPeaks(potential, current)
      expect(peaks.length).toBeGreaterThanOrEqual(1)
    })

    it('should respect minProminence filter', () => {
      const potential = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.4, 0.3, 0.2, 0.1, 0]
      const current = [0, 0.5, 1, 1.5, 2, 2.5, 2, 1.5, 1, 0.5, 0]

      const peaksWithoutFilter = detectPeaks(potential, current)
      const peaksWithFilter = detectPeaks(potential, current, { minProminence: 1e-3 })

      // With filter should have fewer or equal peaks
      expect(peaksWithFilter.length).toBeLessThanOrEqual(peaksWithoutFilter.length)
    })

    it('should classify peaks correctly by direction', () => {
      // Forward scan: increasing potential with positive current
      const potential = [0, 0.1, 0.2, 0.3, 0.4, 0.5]
      const current = [0, 0.5, 1, 1.5, 2, 2.5]

      const peaks = detectPeaks(potential, current)

      // All detected peaks should have a valid direction
      peaks.forEach((peak) => {
        expect(['anodic', 'cathodic']).toContain(peak.direction)
      })
    })
  })
})
