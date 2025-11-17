import { describe, it, expect } from 'vitest'
import { diagnoseMechanism } from '../helpers/diagnostics'
import type { DiagnoseParams } from '../types'

describe('CV Analysis Helpers - Diagnostics', () => {
  describe('diagnoseMechanism', () => {
    it('should diagnose diffusion mechanism (slope ≈ 0.5)', () => {
      const params: DiagnoseParams = {
        hysteresisArea: 5e-7,
        slopeLogLog: 0.5,
        deltaEp: 0.06
      }

      const result = diagnoseMechanism(params)

      expect(result.mechanism).toBe('diffusion')
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('should diagnose adsorption mechanism (slope ≈ 1)', () => {
      const params: DiagnoseParams = {
        hysteresisArea: 1e-6,
        slopeLogLog: 1.0,
        deltaEp: 0.08
      }

      const result = diagnoseMechanism(params)

      expect(result.mechanism).toBe('adsorption')
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('should diagnose kinetic mechanism (deltaEp > 120 mV)', () => {
      const params: DiagnoseParams = {
        hysteresisArea: 2e-6,
        slopeLogLog: 0.5,
        deltaEp: 0.15 // 150 mV > 120 mV
      }

      const result = diagnoseMechanism(params)

      expect(result.mechanism).toBe('kinetic')
    })

    it('should diagnose EC mechanism (high hysteresis, no cathodic peak)', () => {
      const params: DiagnoseParams = {
        anodicPeak: { Ep: 0.5, Ip: 1e-5, index: 10, direction: 'anodic' },
        cathodicPeak: undefined,
        hysteresisArea: 5e-6, // High hysteresis
        slopeLogLog: 0.7,
        deltaEp: undefined
      }

      const result = diagnoseMechanism(params)

      expect(result.mechanism).toBe('EC')
    })

    it('should handle unknown mechanism', () => {
      const params: DiagnoseParams = {
        hysteresisArea: 1e-8,
        slopeLogLog: 0.3, // Unusual slope
        deltaEp: 0.05
      }

      const result = diagnoseMechanism(params)

      expect(result.mechanism).toBe('unknown')
    })

    it('should include diagnostic notes', () => {
      const params: DiagnoseParams = {
        hysteresisArea: 5e-7,
        slopeLogLog: 0.5,
        deltaEp: 0.06
      }

      const result = diagnoseMechanism(params)

      expect(result.notes).toBeDefined()
      expect(Array.isArray(result.notes)).toBe(true)
      expect(result.notes.length).toBeGreaterThan(0)
    })

    it('should calculate confidence score', () => {
      const params: DiagnoseParams = {
        hysteresisArea: 5e-7,
        slopeLogLog: 0.5,
        deltaEp: 0.06
      }

      const result = diagnoseMechanism(params)

      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })

    it('should handle reversible case (low deltaEp)', () => {
      const params: DiagnoseParams = {
        hysteresisArea: 1e-7,
        slopeLogLog: 0.5,
        deltaEp: 0.03 // Very low, reversible
      }

      const result = diagnoseMechanism(params)

      expect(result.mechanism).toBe('diffusion')
      expect(result.confidence).toBeGreaterThan(0.7)
    })

    it('should handle missing optional parameters', () => {
      const params: DiagnoseParams = {
        hysteresisArea: 1e-6
      }

      const result = diagnoseMechanism(params)

      expect(result.mechanism).toBeDefined()
      expect(result.confidence).toBeGreaterThanOrEqual(0)
    })
  })
})
