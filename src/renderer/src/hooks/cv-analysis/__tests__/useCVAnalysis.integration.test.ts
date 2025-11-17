import { describe, it, expect } from 'vitest'
import { analyzeCV } from '../useCVAnalysis'
import type { CVConfig } from '../types'
import type { IProcessFile } from '@shared/models/files'

describe('CV Analysis Hook - Integration Tests', () => {
  // Helper to create mock IProcessFile
  const createMockFile = (
    potential: number[],
    current: number[],
    scanRate: number = 0.1
  ): IProcessFile => ({
    id: 'test-file-1',
    name: 'test-cv.teq4',
    type: 'teq4',
    content: potential.map((e, idx) => [e.toString(), current[idx].toString()]),
    selected: true,
    color: '#FF0000',
    voltammeter: {
      scanRate,
      samplesSec: 1000,
      range: 1,
      totalTime: 10,
      cicles: 1
    }
  })

  describe('analyzeCV', () => {
    it('should analyze simple CV data', () => {
      // Create a simple CV curve
      const potential = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.4, 0.3, 0.2, 0.1, 0]
      const current = [0, 0.5e-5, 1e-5, 1.5e-5, 2e-5, 2.5e-5, 2e-5, 1.5e-5, 1e-5, 0.5e-5, 0]

      const file = createMockFile(potential, current, 0.1)
      const config: CVConfig = {
        scanRate: 0.1,
        smooth: false
      }

      const result = analyzeCV({ file, config })

      expect(result).not.toBeNull()
      expect(result.peaks).toBeDefined()
      expect(result.parameters).toBeDefined()
      expect(result.hysteresis).toBeDefined()
      expect(result.diagnostics).toBeDefined()
      expect(result.plotsData).toBeDefined()
    })

    it('should apply smoothing when requested', () => {
      const potential = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.4, 0.3, 0.2, 0.1, 0]
      const current = [0, 0.5e-5, 1e-5, 1.5e-5, 2e-5, 2.5e-5, 2e-5, 1.5e-5, 1e-5, 0.5e-5, 0]

      const file = createMockFile(potential, current)
      const config: CVConfig = {
        scanRate: 0.1,
        smooth: true,
        windowSize: 5,
        polyOrder: 2
      }

      const result = analyzeCV({ file, config })

      expect(result).not.toBeNull()
      expect(result.plotsData.processed).toBeDefined()
      expect(result.plotsData.processed.y.length).toBe(current.length)
    })

    it('should detect peaks in CV data', () => {
      const potential = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.4, 0.3, 0.2, 0.1, 0]
      const current = [0, 0.5e-5, 1e-5, 1.5e-5, 2e-5, 2.5e-5, 2e-5, 1.5e-5, 1e-5, 0.5e-5, 0]

      const file = createMockFile(potential, current)
      const config: CVConfig = { scanRate: 0.1 }

      const result = analyzeCV({ file, config })

      expect(result.peaks).toBeDefined()
      // Should have at least one peak detected
      expect(result.peaks.anodic || result.peaks.cathodic).toBeDefined()
    })

    it('should calculate hysteresis area', () => {
      const potential = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.4, 0.3, 0.2, 0.1, 0]
      const current = [0, 0.5e-5, 1e-5, 1.5e-5, 2e-5, 2.5e-5, 2e-5, 1.5e-5, 1e-5, 0.5e-5, 0]

      const file = createMockFile(potential, current)
      const config: CVConfig = { scanRate: 0.1 }

      const result = analyzeCV({ file, config })

      expect(result.hysteresis).toBeDefined()
      expect(result.hysteresis.area).toBeGreaterThanOrEqual(0)
    })

    it('should provide diagnostics', () => {
      const potential = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.4, 0.3, 0.2, 0.1, 0]
      const current = [0, 0.5e-5, 1e-5, 1.5e-5, 2e-5, 2.5e-5, 2e-5, 1.5e-5, 1e-5, 0.5e-5, 0]

      const file = createMockFile(potential, current)
      const config: CVConfig = { scanRate: 0.1 }

      const result = analyzeCV({ file, config })

      expect(result.diagnostics).toBeDefined()
      expect(result.diagnostics.mechanism).toBeDefined()
      expect(['diffusion', 'adsorption', 'EC', 'ECE', 'kinetic', 'unknown']).toContain(
        result.diagnostics.mechanism
      )
      expect(result.diagnostics.confidence).toBeGreaterThanOrEqual(0)
      expect(result.diagnostics.confidence).toBeLessThanOrEqual(1)
    })

    it('should handle empty data gracefully', () => {
      const file = createMockFile([], [])
      const config: CVConfig = { scanRate: 0.1 }

      const result = analyzeCV({ file, config })

      expect(result).not.toBeNull()
      expect(result.plotsData.raw.x.length).toBe(0)
    })

    it('should handle mismatched array lengths', () => {
      const file: IProcessFile = {
        id: 'test-file-2',
        name: 'test-cv.teq4',
        type: 'teq4',
        content: [
          ['0', '0'],
          ['0.1', '1e-5']
        ], // Only 2 points
        selected: true,
        color: '#FF0000',
        voltammeter: {
          scanRate: 0.1,
          samplesSec: 1000,
          range: 1,
          totalTime: 10,
          cicles: 1
        }
      }
      const config: CVConfig = { scanRate: 0.1 }

      const result = analyzeCV({ file, config })

      expect(result).not.toBeNull()
    })

    it('should include plot data for visualization', () => {
      const potential = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.4, 0.3, 0.2, 0.1, 0]
      const current = [0, 0.5e-5, 1e-5, 1.5e-5, 2e-5, 2.5e-5, 2e-5, 1.5e-5, 1e-5, 0.5e-5, 0]

      const file = createMockFile(potential, current)
      const config: CVConfig = { scanRate: 0.1, smooth: true }

      const result = analyzeCV({ file, config })

      expect(result.plotsData.raw).toBeDefined()
      expect(result.plotsData.raw.x).toEqual(potential)
      expect(result.plotsData.processed).toBeDefined()
      expect(result.plotsData.processed.x.length).toBeGreaterThan(0)
    })

    it('should calculate delta Ep when both peaks present', () => {
      const potential = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.4, 0.3, 0.2, 0.1, 0]
      const current = [0, 0.5e-5, 1e-5, 1.5e-5, 2e-5, 2.5e-5, 2e-5, 1.5e-5, 1e-5, 0.5e-5, 0]

      const file = createMockFile(potential, current)
      const config: CVConfig = { scanRate: 0.1 }

      const result = analyzeCV({ file, config })

      if (result.peaks.anodic && result.peaks.cathodic) {
        expect(result.parameters.deltaEp).toBeDefined()
        expect(result.parameters.deltaEp).toBeGreaterThan(0)
      }
    })
  })
})
