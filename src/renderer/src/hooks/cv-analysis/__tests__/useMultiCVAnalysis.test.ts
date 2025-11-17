import { describe, it, expect } from 'vitest'
import { analyzeMultiCV } from '../useMultiCVAnalysis'
import type { IProcessFile } from '@shared/models/files'
import type { CVConfig } from '../types'

describe('Multi-CV Analysis Hook', () => {
  // Helper to create mock IProcessFile
  const createMockFile = (
    id: string,
    name: string,
    potential: number[],
    current: number[],
    scanRate: number
  ): IProcessFile => ({
    id,
    name,
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

  describe('analyzeMultiCV', () => {
    it('should return null for empty files', () => {
      const result = analyzeMultiCV({
        files: [],
        config: { scanRate: 0.1 }
      })

      expect(result).toBeNull()
    })

    it('should analyze multiple CV files', () => {
      const potential = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.4, 0.3, 0.2, 0.1, 0]
      const current = [0, 0.5e-5, 1e-5, 1.5e-5, 2e-5, 2.5e-5, 2e-5, 1.5e-5, 1e-5, 0.5e-5, 0]

      const files = [
        createMockFile('file-1', 'cv-1.teq4', potential, current, 0.1),
        createMockFile('file-2', 'cv-2.teq4', potential, current, 0.2),
        createMockFile('file-3', 'cv-3.teq4', potential, current, 0.3)
      ]

      const config: CVConfig = { scanRate: 0.1 }

      const result = analyzeMultiCV({ files, config })

      expect(result).not.toBeNull()
      expect(result?.files).toBeDefined()
      expect(result?.files.length).toBe(3)
      expect(result?.correlations).toBeDefined()
    })

    it('should calculate ip vs sqrt(v) correlation', () => {
      const potential = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.4, 0.3, 0.2, 0.1, 0]
      // Vary current based on scan rate to create correlation
      const current1 = [0, 0.5e-5, 1e-5, 1.5e-5, 2e-5, 2.5e-5, 2e-5, 1.5e-5, 1e-5, 0.5e-5, 0]
      const current2 = [0, 1e-5, 2e-5, 3e-5, 4e-5, 5e-5, 4e-5, 3e-5, 2e-5, 1e-5, 0]
      const current3 = [0, 1.5e-5, 3e-5, 4.5e-5, 6e-5, 7.5e-5, 6e-5, 4.5e-5, 3e-5, 1.5e-5, 0]

      const files = [
        createMockFile('file-1', 'cv-1.teq4', potential, current1, 0.1),
        createMockFile('file-2', 'cv-2.teq4', potential, current2, 0.2),
        createMockFile('file-3', 'cv-3.teq4', potential, current3, 0.3)
      ]

      const result = analyzeMultiCV({ files, config: { scanRate: 0.1 } })

      expect(result?.correlations.ipVsSqrtV).toBeDefined()
      if (result?.correlations.ipVsSqrtV?.anodic) {
        expect(result.correlations.ipVsSqrtV.anodic.slope).not.toBeNaN()
        expect(result.correlations.ipVsSqrtV.anodic.r2).toBeGreaterThanOrEqual(0)
      }
    })

    it('should calculate ip vs v correlation', () => {
      const potential = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.4, 0.3, 0.2, 0.1, 0]
      const current = [0, 0.5e-5, 1e-5, 1.5e-5, 2e-5, 2.5e-5, 2e-5, 1.5e-5, 1e-5, 0.5e-5, 0]

      const files = [
        createMockFile('file-1', 'cv-1.teq4', potential, current, 0.1),
        createMockFile('file-2', 'cv-2.teq4', potential, current, 0.2)
      ]

      const result = analyzeMultiCV({ files, config: { scanRate: 0.1 } })

      expect(result?.correlations.ipVsV).toBeDefined()
    })

    it('should calculate log(ip) vs log(v) correlation', () => {
      const potential = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.4, 0.3, 0.2, 0.1, 0]
      const current = [0, 0.5e-5, 1e-5, 1.5e-5, 2e-5, 2.5e-5, 2e-5, 1.5e-5, 1e-5, 0.5e-5, 0]

      const files = [
        createMockFile('file-1', 'cv-1.teq4', potential, current, 0.1),
        createMockFile('file-2', 'cv-2.teq4', potential, current, 0.2),
        createMockFile('file-3', 'cv-3.teq4', potential, current, 0.3)
      ]

      const result = analyzeMultiCV({ files, config: { scanRate: 0.1 } })

      expect(result?.correlations.logIpVsLogV).toBeDefined()
    })

    it('should calculate average delta Ep', () => {
      const potential = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.4, 0.3, 0.2, 0.1, 0]
      const current = [0, 0.5e-5, 1e-5, 1.5e-5, 2e-5, 2.5e-5, 2e-5, 1.5e-5, 1e-5, 0.5e-5, 0]

      const files = [
        createMockFile('file-1', 'cv-1.teq4', potential, current, 0.1),
        createMockFile('file-2', 'cv-2.teq4', potential, current, 0.2)
      ]

      const result = analyzeMultiCV({ files, config: { scanRate: 0.1 } })

      if (result?.averageDeltaEp !== undefined) {
        expect(result.averageDeltaEp).toBeGreaterThan(0)
      }
    })

    it('should calculate average hysteresis area', () => {
      const potential = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.4, 0.3, 0.2, 0.1, 0]
      const current = [0, 0.5e-5, 1e-5, 1.5e-5, 2e-5, 2.5e-5, 2e-5, 1.5e-5, 1e-5, 0.5e-5, 0]

      const files = [
        createMockFile('file-1', 'cv-1.teq4', potential, current, 0.1),
        createMockFile('file-2', 'cv-2.teq4', potential, current, 0.2)
      ]

      const result = analyzeMultiCV({ files, config: { scanRate: 0.1 } })

      if (result?.averageHysteresisArea !== undefined) {
        expect(result.averageHysteresisArea).toBeGreaterThanOrEqual(0)
      }
    })

    it('should determine mechanism consensus', () => {
      const potential = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.4, 0.3, 0.2, 0.1, 0]
      const current = [0, 0.5e-5, 1e-5, 1.5e-5, 2e-5, 2.5e-5, 2e-5, 1.5e-5, 1e-5, 0.5e-5, 0]

      const files = [
        createMockFile('file-1', 'cv-1.teq4', potential, current, 0.1),
        createMockFile('file-2', 'cv-2.teq4', potential, current, 0.2),
        createMockFile('file-3', 'cv-3.teq4', potential, current, 0.3)
      ]

      const result = analyzeMultiCV({ files, config: { scanRate: 0.1 } })

      expect(result?.mechanismConsensus).toBeDefined()
      expect(['diffusion', 'adsorption', 'EC', 'ECE', 'kinetic', 'unknown']).toContain(
        result?.mechanismConsensus
      )
    })

    it('should handle files without scan rate', () => {
      const potential = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.4, 0.3, 0.2, 0.1, 0]
      const current = [0, 0.5e-5, 1e-5, 1.5e-5, 2e-5, 2.5e-5, 2e-5, 1.5e-5, 1e-5, 0.5e-5, 0]

      const file1 = createMockFile('file-1', 'cv-1.teq4', potential, current, 0.1)
      const file2: IProcessFile = {
        ...createMockFile('file-2', 'cv-2.teq4', potential, current, 0.2),
        voltammeter: undefined // No scan rate
      }

      const result = analyzeMultiCV({ files: [file1, file2], config: { scanRate: 0.1 } })

      // Should only analyze file1
      expect(result?.files.length).toBe(1)
    })

    it('should include individual file analyses', () => {
      const potential = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.4, 0.3, 0.2, 0.1, 0]
      const current = [0, 0.5e-5, 1e-5, 1.5e-5, 2e-5, 2.5e-5, 2e-5, 1.5e-5, 1e-5, 0.5e-5, 0]

      const files = [
        createMockFile('file-1', 'cv-1.teq4', potential, current, 0.1),
        createMockFile('file-2', 'cv-2.teq4', potential, current, 0.2)
      ]

      const result = analyzeMultiCV({ files, config: { scanRate: 0.1 } })

      expect(result?.files).toBeDefined()
      result?.files.forEach((fileAnalysis) => {
        expect(fileAnalysis.fileId).toBeDefined()
        expect(fileAnalysis.fileName).toBeDefined()
        expect(fileAnalysis.scanRate).toBeDefined()
        expect(fileAnalysis.analysis).toBeDefined()
        expect(fileAnalysis.analysis.peaks).toBeDefined()
        expect(fileAnalysis.analysis.parameters).toBeDefined()
        expect(fileAnalysis.analysis.hysteresis).toBeDefined()
        expect(fileAnalysis.analysis.diagnostics).toBeDefined()
      })
    })
  })
})
