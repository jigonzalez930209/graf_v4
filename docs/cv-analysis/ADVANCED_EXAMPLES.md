# CV Analysis Hook - Ejemplos Avanzados

## 📚 Tabla de Contenidos

1. [Análisis Comparativo](#análisis-comparativo)
2. [Exportación de Datos](#exportación-de-datos)
3. [Visualización Personalizada](#visualización-personalizada)
4. [Integración con Contexto](#integración-con-contexto)
5. [Casos de Uso Especiales](#casos-de-uso-especiales)

---

## Análisis Comparativo

### Comparar Múltiples Archivos CV

```typescript
import React from 'react'
import { useMultiCVAnalysis } from '@renderer/hooks/cv-analysis'
import type { IProcessFile, MultiCVAnalysisResult } from '@shared/models/files'

export const CVComparisonComponent: React.FC<{ files: IProcessFile[] }> = ({ files }) => {
  const result = useMultiCVAnalysis({
    files: files.filter(f => f.type === 'teq4'),
    config: { scanRate: 0.1, smooth: true }
  })

  if (!result) return null

  // Agrupar por mecanismo
  const byMechanism = result.files.reduce((acc, f) => {
    const mech = f.analysis.diagnostics.mechanism
    if (!acc[mech]) acc[mech] = []
    acc[mech].push(f)
    return acc
  }, {} as Record<string, typeof result.files>)

  return (
    <div className="space-y-6">
      {Object.entries(byMechanism).map(([mechanism, files]) => (
        <div key={mechanism} className="border rounded-lg p-4">
          <h3 className="font-bold text-lg mb-4">{mechanism.toUpperCase()}</h3>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">File</th>
                <th className="text-right p-2">Scan Rate</th>
                <th className="text-right p-2">ΔEp</th>
                <th className="text-right p-2">Ip</th>
                <th className="text-right p-2">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {files.map(f => (
                <tr key={f.fileId} className="border-b hover:bg-accent/5">
                  <td className="p-2">{f.fileName}</td>
                  <td className="text-right p-2">{f.scanRate.toFixed(4)} V/s</td>
                  <td className="text-right p-2">
                    {f.analysis.parameters.deltaEp?.toFixed(4)} V
                  </td>
                  <td className="text-right p-2">
                    {f.analysis.peaks.anodic?.Ip.toExponential(2)} A
                  </td>
                  <td className="text-right p-2">
                    {(f.analysis.diagnostics.confidence * 100).toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Estadísticas por grupo */}
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Avg ΔEp:</span>
              <span className="font-mono ml-2">
                {(
                  files.reduce((sum, f) => sum + (f.analysis.parameters.deltaEp || 0), 0) /
                  files.length
                ).toFixed(4)} V
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Avg Confidence:</span>
              <span className="font-mono ml-2">
                {(
                  (files.reduce((sum, f) => sum + f.analysis.diagnostics.confidence, 0) /
                    files.length) *
                  100
                ).toFixed(0)}%
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Count:</span>
              <span className="font-mono ml-2">{files.length}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
```

---

## Exportación de Datos

### Exportar Resultados a JSON

```typescript
import { analyzeMultiCV } from '@renderer/hooks/cv-analysis'
import type { IProcessFile } from '@shared/models/files'

export const exportAnalysisToJSON = (
  files: IProcessFile[],
  filename: string = 'cv-analysis.json'
) => {
  const result = analyzeMultiCV({
    files,
    config: { scanRate: 0.1, smooth: true }
  })

  if (!result) {
    console.error('Analysis failed')
    return
  }

  // Preparar datos para exportación
  const exportData = {
    timestamp: new Date().toISOString(),
    filesCount: result.files.length,
    summary: {
      averageDeltaEp: result.averageDeltaEp,
      averageHysteresisArea: result.averageHysteresisArea,
      mechanismConsensus: result.mechanismConsensus
    },
    correlations: {
      ipVsSqrtV: result.correlations.ipVsSqrtV
        ? {
            slope: result.correlations.ipVsSqrtV.slope,
            intercept: result.correlations.ipVsSqrtV.intercept,
            r2: result.correlations.ipVsSqrtV.r2,
            points: result.correlations.ipVsSqrtV.points
          }
        : null,
      epVsLnV: result.correlations.epVsLnV
        ? {
            slope: result.correlations.epVsLnV.slope,
            intercept: result.correlations.epVsLnV.intercept,
            r2: result.correlations.epVsLnV.r2,
            points: result.correlations.epVsLnV.points
          }
        : null
    },
    files: result.files.map((f) => ({
      fileName: f.fileName,
      scanRate: f.scanRate,
      peaks: {
        anodic: f.analysis.peaks.anodic
          ? {
              Ep: f.analysis.peaks.anodic.Ep,
              Ip: f.analysis.peaks.anodic.Ip
            }
          : null,
        cathodic: f.analysis.peaks.cathodic
          ? {
              Ep: f.analysis.peaks.cathodic.Ep,
              Ip: f.analysis.peaks.cathodic.Ip
            }
          : null
      },
      parameters: {
        deltaEp: f.analysis.parameters.deltaEp
      },
      hysteresis: {
        area: f.analysis.hysteresis.area
      },
      diagnostics: {
        mechanism: f.analysis.diagnostics.mechanism,
        confidence: f.analysis.diagnostics.confidence,
        notes: f.analysis.diagnostics.notes
      }
    }))
  }

  // Descargar JSON
  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json'
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
```

### Exportar a CSV

```typescript
export const exportAnalysisToCSV = (
  files: IProcessFile[],
  filename: string = 'cv-analysis.csv'
) => {
  const result = analyzeMultiCV({
    files,
    config: { scanRate: 0.1 }
  })

  if (!result) return

  // Encabezados
  const headers = [
    'File Name',
    'Scan Rate (V/s)',
    'Ep Anodic (V)',
    'Ip Anodic (A)',
    'Ep Cathodic (V)',
    'Ip Cathodic (A)',
    'ΔEp (V)',
    'Hysteresis (A·V)',
    'Mechanism',
    'Confidence'
  ]

  // Datos
  const rows = result.files.map((f) => [
    f.fileName,
    f.scanRate.toFixed(6),
    f.analysis.peaks.anodic?.Ep.toFixed(6) || '',
    f.analysis.peaks.anodic?.Ip.toExponential(6) || '',
    f.analysis.peaks.cathodic?.Ep.toFixed(6) || '',
    f.analysis.peaks.cathodic?.Ip.toExponential(6) || '',
    f.analysis.parameters.deltaEp?.toFixed(6) || '',
    f.analysis.hysteresis.area?.toExponential(6) || '',
    f.analysis.diagnostics.mechanism,
    (f.analysis.diagnostics.confidence * 100).toFixed(2) + '%'
  ])

  // Crear CSV
  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))
  ].join('\n')

  // Descargar
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
```

---

## Visualización Personalizada

### Gráfico Personalizado con Recharts

```typescript
import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { useMultiCVAnalysis } from '@renderer/hooks/cv-analysis'
import type { IProcessFile } from '@shared/models/files'

export const CustomCVChart: React.FC<{ files: IProcessFile[] }> = ({ files }) => {
  const result = useMultiCVAnalysis({
    files,
    config: { scanRate: 0.1 }
  })

  if (!result) return null

  // Preparar datos para Recharts
  const data = result.files.map(f => ({
    name: f.fileName,
    scanRate: f.scanRate,
    deltaEp: f.analysis.parameters.deltaEp || 0,
    ipAnodic: f.analysis.peaks.anodic?.Ip ? Math.abs(f.analysis.peaks.anodic.Ip) : 0,
    hysteresis: f.analysis.hysteresis.area || 0
  }))

  return (
    <div className="space-y-6">
      {/* ΔEp vs Scan Rate */}
      <div>
        <h3 className="font-semibold mb-4">Peak Separation vs Scan Rate</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="scanRate" label={{ value: 'Scan Rate (V/s)', position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: 'ΔEp (V)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="deltaEp" stroke="#8884d8" name="ΔEp" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Ip vs Scan Rate */}
      <div>
        <h3 className="font-semibold mb-4">Peak Current vs Scan Rate</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="scanRate" label={{ value: 'Scan Rate (V/s)', position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: 'Ip (A)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="ipAnodic" stroke="#82ca9d" name="Ip Anodic" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Hysteresis vs Scan Rate */}
      <div>
        <h3 className="font-semibold mb-4">Hysteresis vs Scan Rate</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="scanRate" label={{ value: 'Scan Rate (V/s)', position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: 'Area (A·V)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="hysteresis" stroke="#ffc658" name="Hysteresis" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
```

---

## Integración con Contexto

### Usar en VCAnalysisContext

```typescript
import React from 'react'
import { useCVAnalysis } from '@renderer/hooks/cv-analysis'
import { VCAnalysisContext } from '@/context/VCAnalysisContext'

export const CVAnalysisProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedFile, setSelectedFile] = React.useState(null)
  const [analysisResult, setAnalysisResult] = React.useState(null)

  // Usar el hook
  const result = useCVAnalysis(
    selectedFile
      ? {
          file: selectedFile,
          config: {
            scanRate: 0.1,
            smooth: true,
            windowSize: 5,
            polyOrder: 2
          }
        }
      : null
  )

  React.useEffect(() => {
    if (result) {
      setAnalysisResult(result)
    }
  }, [result])

  return (
    <VCAnalysisContext.Provider
      value={{
        selectedFile,
        setSelectedFile,
        analysisResult,
        // ... otros valores del contexto
      }}
    >
      {children}
    </VCAnalysisContext.Provider>
  )
}
```

---

## Casos de Uso Especiales

### Análisis Batch de Múltiples Carpetas

```typescript
export const batchAnalyzeFiles = async (
  fileGroups: Record<string, IProcessFile[]>
): Promise<Record<string, MultiCVAnalysisResult | null>> => {
  const results: Record<string, MultiCVAnalysisResult | null> = {}

  for (const [groupName, files] of Object.entries(fileGroups)) {
    try {
      results[groupName] = analyzeMultiCV({
        files,
        config: { scanRate: 0.1, smooth: true }
      })
    } catch (error) {
      console.error(`Error analyzing group ${groupName}:`, error)
      results[groupName] = null
    }
  }

  return results
}
```

### Análisis con Validación Automática

```typescript
export const analyzeWithValidation = (
  files: IProcessFile[],
  expectedMechanism?: string
): { result: MultiCVAnalysisResult | null; isValid: boolean; warnings: string[] } => {
  const warnings: string[] = []

  // Validar archivos
  if (files.length < 2) {
    warnings.push('At least 2 files required for multi-CV analysis')
    return { result: null, isValid: false, warnings }
  }

  // Validar scan rates
  const scanRates = files.map((f) => f.voltammeter?.scanRate).filter(Boolean)
  if (scanRates.length !== files.length) {
    warnings.push('Some files missing scan rate information')
  }

  if (new Set(scanRates).size === 1) {
    warnings.push('All files have the same scan rate - correlation analysis may be unreliable')
  }

  // Ejecutar análisis
  const result = analyzeMultiCV({
    files,
    config: { scanRate: 0.1, smooth: true }
  })

  if (!result) {
    warnings.push('Analysis failed')
    return { result: null, isValid: false, warnings }
  }

  // Validar resultado
  if (expectedMechanism && result.mechanismConsensus !== expectedMechanism) {
    warnings.push(`Expected mechanism ${expectedMechanism}, got ${result.mechanismConsensus}`)
  }

  if (result.correlations.ipVsSqrtV && result.correlations.ipVsSqrtV.r2 < 0.8) {
    warnings.push('Low R² for Randles-Sevcik correlation (< 0.8)')
  }

  const isValid = warnings.length === 0

  return { result, isValid, warnings }
}
```

### Análisis Temporal (Tracking de Cambios)

```typescript
export const trackAnalysisOverTime = (
  filesByTime: Record<string, IProcessFile[]>
): Record<string, { result: MultiCVAnalysisResult | null; timestamp: Date }> => {
  const timeline: Record<string, { result: MultiCVAnalysisResult | null; timestamp: Date }> = {}

  for (const [timeKey, files] of Object.entries(filesByTime)) {
    const result = analyzeMultiCV({
      files,
      config: { scanRate: 0.1, smooth: true }
    })

    timeline[timeKey] = {
      result,
      timestamp: new Date(timeKey)
    }
  }

  return timeline
}

// Uso
const timeline = trackAnalysisOverTime({
  '2025-01-01': [file1, file2],
  '2025-01-02': [file3, file4],
  '2025-01-03': [file5, file6]
})

// Analizar tendencias
const deltaEpTrend = Object.entries(timeline).map(([date, data]) => ({
  date,
  avgDeltaEp: data.result?.averageDeltaEp || 0
}))
```

---

## Performance Tips

### Memoización Avanzada

```typescript
import { useMemo, useCallback } from 'react'

export const AdvancedCVAnalysis: React.FC<{ files: IProcessFile[] }> = ({ files }) => {
  // Memoizar archivos filtrados
  const selectedFiles = useMemo(
    () => files.filter(f => f.type === 'teq4' && f.selected),
    [files]
  )

  // Memoizar configuración
  const config = useMemo(
    () => ({
      scanRate: 0.1,
      smooth: true,
      windowSize: 5,
      polyOrder: 2
    }),
    []
  )

  // Usar hook con dependencias memoizadas
  const result = useMultiCVAnalysis(
    selectedFiles.length >= 2 ? { files: selectedFiles, config } : null
  )

  // Memoizar transformaciones
  const statistics = useMemo(() => {
    if (!result) return null

    return {
      avgDeltaEp: result.averageDeltaEp,
      avgHysteresis: result.averageHysteresisArea,
      mechanism: result.mechanismConsensus,
      fileCount: result.files.length,
      r2Values: {
        ipVsSqrtV: result.correlations.ipVsSqrtV?.r2,
        epVsLnV: result.correlations.epVsLnV?.r2
      }
    }
  }, [result])

  return (
    <div>
      {statistics && (
        <div>
          <p>Avg ΔEp: {statistics.avgDeltaEp?.toFixed(4)} V</p>
          <p>R² (Randles-Sevcik): {statistics.r2Values.ipVsSqrtV?.toFixed(4)}</p>
        </div>
      )}
    </div>
  )
}
```

---

**Última actualización:** Noviembre 2025
