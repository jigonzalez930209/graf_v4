# CV Analysis Hook - Documentación Completa

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Instalación y Setup](#instalación-y-setup)
3. [API Reference](#api-reference)
4. [Ejemplos de Uso](#ejemplos-de-uso)
5. [Tipos y Interfaces](#tipos-e-interfaces)
6. [Guía de Troubleshooting](#guía-de-troubleshooting)

---

## Introducción

El **CV Analysis Hook** es un módulo TypeScript completo para análisis de Voltametría Cíclica (CV). Proporciona:

- ✅ Análisis individual de archivos CV (`useCVAnalysis`)
- ✅ Análisis de múltiples scan rates (`useMultiCVAnalysis`)
- ✅ Detección automática de picos anódico/catódico
- ✅ Cálculo de parámetros electroquímicos (ΔEp, histéresis, etc.)
- ✅ Diagnóstico automático de mecanismos (diffusion, adsorption, EC, etc.)
- ✅ Regresiones lineales con R² para análisis de dependencias
- ✅ Suavizado Savitzky-Golay opcional
- ✅ Interfaz UI con gráficos Plotly

---

## Instalación y Setup

### 1. Importar el Hook

```typescript
import {
  useCVAnalysis,
  useMultiCVAnalysis,
  analyzeCV,
  analyzeMultiCV
} from '@renderer/hooks/cv-analysis'
import type { CVConfig, CVAnalysisResult, MultiCVAnalysisResult } from '@renderer/hooks/cv-analysis'
```

### 2. Configuración Básica

```typescript
const config: CVConfig = {
  scanRate: 0.1, // V/s (velocidad de barrido)
  smooth: true, // Aplicar suavizado
  windowSize: 5, // Tamaño de ventana Savitzky-Golay
  polyOrder: 2, // Orden del polinomio
  temperature: 298, // K (temperatura, opcional)
  diffusionCoefficient: 1e-5 // cm²/s (coeficiente de difusión, opcional)
}
```

### 3. Estructura de Datos de Entrada

```typescript
// IProcessFile es la estructura estándar del proyecto
const file: IProcessFile = {
  id: 'file-1',
  name: 'cv-sample.teq4',
  type: 'teq4',
  content: [
    ['0.0', '0.0'],
    ['0.1', '1.5e-5'],
    ['0.2', '2.8e-5']
    // ... más puntos [potencial, corriente]
  ],
  selected: true,
  color: '#FF0000',
  voltammeter: {
    scanRate: 0.1,
    samplesSec: 1000,
    range: 1.0,
    totalTime: 10,
    cicles: 1
  }
}
```

---

## API Reference

### `useCVAnalysis(params)`

Hook React para análisis de un archivo CV individual.

**Parámetros:**

```typescript
interface UseCVAnalysisParams {
  file: IProcessFile
  config: CVConfig
}
```

**Retorna:**

```typescript
CVAnalysisResult | null
```

**Ejemplo:**

```typescript
const result = useCVAnalysis({
  file: myFile,
  config: { scanRate: 0.1, smooth: true }
})

if (result) {
  console.log('Pico anódico:', result.peaks.anodic)
  console.log('ΔEp:', result.parameters.deltaEp)
  console.log('Mecanismo:', result.diagnostics.mechanism)
}
```

---

### `useMultiCVAnalysis(params)`

Hook React para análisis de múltiples archivos CV.

**Parámetros:**

```typescript
interface UseMultiCVAnalysisParams {
  files: IProcessFile[]
  config: CVConfig
}
```

**Retorna:**

```typescript
MultiCVAnalysisResult | null
```

**Ejemplo:**

```typescript
const result = useMultiCVAnalysis({
  files: [file1, file2, file3],
  config: { scanRate: 0.1 }
})

if (result) {
  // Correlaciones calculadas
  console.log('Ip vs √v:', result.correlations.ipVsSqrtV)
  console.log('ΔEp vs ln(v):', result.correlations.epVsLnV)

  // Estadísticas agregadas
  console.log('Avg ΔEp:', result.averageDeltaEp)
  console.log('Mecanismo consenso:', result.mechanismConsensus)

  // Análisis individual por archivo
  result.files.forEach((f) => {
    console.log(`${f.fileName}: ${f.analysis.diagnostics.mechanism}`)
  })
}
```

---

### `analyzeCV(params)`

Función pura para análisis de un archivo CV (sin hook React).

**Uso:**

```typescript
const result = analyzeCV({
  file: myFile,
  config: { scanRate: 0.1 }
})
```

---

### `analyzeMultiCV(params)`

Función pura para análisis de múltiples CVs (sin hook React).

**Uso:**

```typescript
const result = analyzeMultiCV({
  files: [file1, file2, file3],
  config: { scanRate: 0.1 }
})
```

---

## Ejemplos de Uso

### Ejemplo 1: Análisis Simple en Componente React

```typescript
import React from 'react'
import { useCVAnalysis } from '@renderer/hooks/cv-analysis'
import type { IProcessFile } from '@shared/models/files'

export const CVAnalysisComponent: React.FC<{ file: IProcessFile }> = ({ file }) => {
  const result = useCVAnalysis({
    file,
    config: {
      scanRate: 0.1,
      smooth: true,
      windowSize: 5,
      polyOrder: 2
    }
  })

  if (!result) return <div>No analysis available</div>

  return (
    <div>
      <h2>CV Analysis Results</h2>

      <section>
        <h3>Peaks</h3>
        <p>Anodic: Ep = {result.peaks.anodic?.Ep.toFixed(4)} V,
                 Ip = {result.peaks.anodic?.Ip.toExponential(2)} A</p>
        <p>Cathodic: Ep = {result.peaks.cathodic?.Ep.toFixed(4)} V,
                   Ip = {result.peaks.cathodic?.Ip.toExponential(2)} A</p>
      </section>

      <section>
        <h3>Parameters</h3>
        <p>ΔEp = {result.parameters.deltaEp?.toFixed(4)} V</p>
        <p>Hysteresis Area = {result.hysteresis.area?.toExponential(2)} A·V</p>
      </section>

      <section>
        <h3>Diagnostics</h3>
        <p>Mechanism: {result.diagnostics.mechanism}</p>
        <p>Confidence: {result.diagnostics.confidence.toFixed(2)}</p>
        <p>Notes: {result.diagnostics.notes}</p>
      </section>
    </div>
  )
}
```

---

### Ejemplo 2: Análisis Multi-Scan Rate

```typescript
import React from 'react'
import { useMultiCVAnalysis } from '@renderer/hooks/cv-analysis'
import type { IProcessFile } from '@shared/models/files'

export const MultiCVAnalysisComponent: React.FC<{ files: IProcessFile[] }> = ({ files }) => {
  const result = useMultiCVAnalysis({
    files: files.filter(f => f.type === 'teq4' && f.selected),
    config: { scanRate: 0.1 }
  })

  if (!result) return <div>Select at least 2 CV files</div>

  return (
    <div>
      <h2>Multi-CV Analysis</h2>

      <section>
        <h3>Randles-Sevcik (Ip vs √v)</h3>
        {result.correlations.ipVsSqrtV && (
          <>
            <p>Slope: {result.correlations.ipVsSqrtV.slope.toFixed(6)}</p>
            <p>R²: {result.correlations.ipVsSqrtV.r2.toFixed(6)}</p>
          </>
        )}
      </section>

      <section>
        <h3>Peak Separation (ΔEp vs ln(v))</h3>
        {result.correlations.epVsLnV && (
          <>
            <p>Slope: {result.correlations.epVsLnV.slope.toFixed(6)}</p>
            <p>R²: {result.correlations.epVsLnV.r2.toFixed(6)}</p>
          </>
        )}
      </section>

      <section>
        <h3>Summary</h3>
        <p>Avg ΔEp: {result.averageDeltaEp?.toFixed(4)} V</p>
        <p>Avg Hysteresis: {result.averageHysteresisArea?.toExponential(2)} A·V</p>
        <p>Mechanism Consensus: {result.mechanismConsensus}</p>
      </section>

      <section>
        <h3>Individual Files</h3>
        <table>
          <thead>
            <tr>
              <th>File</th>
              <th>Scan Rate (V/s)</th>
              <th>ΔEp (V)</th>
              <th>Mechanism</th>
            </tr>
          </thead>
          <tbody>
            {result.files.map(f => (
              <tr key={f.fileId}>
                <td>{f.fileName}</td>
                <td>{f.scanRate.toFixed(4)}</td>
                <td>{f.analysis.parameters.deltaEp?.toFixed(4)}</td>
                <td>{f.analysis.diagnostics.mechanism}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
```

---

## Tipos e Interfaces

### CVConfig

```typescript
interface CVConfig {
  scanRate: number // V/s
  temperature?: number // K
  diffusionCoefficient?: number // cm²/s
  smooth?: boolean
  windowSize?: number // Savitzky-Golay window
  polyOrder?: number // Savitzky-Golay polynomial order
}
```

### Peak

```typescript
interface Peak {
  Ep: number // Potencial del pico (V)
  Ip: number // Corriente del pico (A)
  index: number // Índice en el array
  direction: 'anodic' | 'cathodic'
}
```

### Parameters

```typescript
interface Parameters {
  anodicPeak?: Peak
  cathodicPeak?: Peak
  deltaEp?: number // Ep(anodic) - Ep(cathodic)
  ipVsSqrtV?: number[]
}
```

### HysteresisData

```typescript
interface HysteresisData {
  area: number // Área del lazo (A·V)
  curve: number[] // Puntos de la curva
}
```

### Diagnostics

```typescript
interface Diagnostics {
  mechanism: 'diffusion' | 'adsorption' | 'EC' | 'ECE' | 'kinetic' | 'unknown'
  confidence: number // 0-1
  notes: string
}
```

### CVAnalysisResult

```typescript
interface CVAnalysisResult {
  peaks: {
    anodic: Peak | null
    cathodic: Peak | null
  }
  parameters: Parameters
  hysteresis: HysteresisData
  diagnostics: Diagnostics
  plotsData: CVPlotsData
}
```

### MultiCVAnalysisResult

```typescript
interface MultiCVAnalysisResult {
  files: MultiCVFileAnalysis[]
  correlations: MultiCVCorrelations
  averageDeltaEp?: number
  averageHysteresisArea?: number
  mechanismConsensus?: string
}
```

---

## Guía de Troubleshooting

### Problema: "No peaks detected"

**Causa:** Los datos no tienen suficientes puntos o el rango de potencial es muy pequeño.

**Solución:**

```typescript
// Verificar que los datos tengan suficientes puntos
console.log('Data points:', file.content.length)

// Aumentar windowSize si los datos son ruidosos
const config = {
  scanRate: 0.1,
  smooth: true,
  windowSize: 7, // Aumentar de 5 a 7
  polyOrder: 2
}
```

---

### Problema: "R² muy bajo en correlaciones"

**Causa:** Los datos de múltiples archivos no siguen una correlación lineal clara.

**Solución:**

```typescript
// Verificar que los archivos tengan scan rates variados
result.files.forEach((f) => {
  console.log(`${f.fileName}: ${f.scanRate} V/s`)
})

// Filtrar outliers si es necesario
const validFiles = result.files.filter(
  (f) => f.analysis.parameters.deltaEp !== undefined && f.analysis.peaks.anodic !== null
)
```

---

### Problema: "Mecanismo incorrecto"

**Causa:** Los parámetros calculados no coinciden con el mecanismo esperado.

**Solución:**

```typescript
// Revisar los parámetros individuales
console.log('ΔEp:', result.parameters.deltaEp)
console.log('Ip ratio:', result.peaks.anodic?.Ip / result.peaks.cathodic?.Ip)
console.log('Hysteresis:', result.hysteresis.area)

// Ajustar config si es necesario
const config = {
  scanRate: 0.1,
  temperature: 298, // Especificar temperatura
  diffusionCoefficient: 1e-5 // Especificar coeficiente
}
```

---

## Testing

### Ejecutar Tests

```bash
# Todos los tests de CV Analysis
pnpm test -- src/renderer/src/hooks/cv-analysis/__tests__/ --run

# Tests específicos
pnpm test -- src/renderer/src/hooks/cv-analysis/__tests__/helpers.utils.test.ts --run

# Con cobertura
pnpm test:coverage -- src/renderer/src/hooks/cv-analysis/
```

### Escribir Tests Personalizados

```typescript
import { describe, it, expect } from 'vitest'
import { analyzeCV } from '../useCVAnalysis'

describe('Custom CV Analysis Tests', () => {
  it('should analyze my custom data', () => {
    const customFile = {
      id: 'custom-1',
      name: 'my-cv.teq4',
      type: 'teq4',
      content: [
        ['0.0', '0.0']
        // ... tu data aquí
      ],
      selected: true,
      color: '#FF0000',
      voltammeter: {
        scanRate: 0.1,
        samplesSec: 1000,
        range: 1.0,
        totalTime: 10,
        cicles: 1
      }
    }

    const result = analyzeCV({
      file: customFile,
      config: { scanRate: 0.1 }
    })

    expect(result).not.toBeNull()
    expect(result?.peaks.anodic).toBeDefined()
  })
})
```

---

## Performance Tips

1. **Memoización:** El hook usa `useMemo` automáticamente, pero asegúrate de memoizar archivos:

   ```typescript
   const files = React.useMemo(() => data || [], [data])
   ```

2. **Suavizado:** Desactiva si no es necesario:

   ```typescript
   const config = { scanRate: 0.1, smooth: false }
   ```

3. **Múltiples archivos:** Limita a 10-20 archivos para mejor performance.

---

## Contribuir

Para agregar nuevas características o mejorar el análisis:

1. Crear tests en `__tests__/`
2. Implementar en helpers correspondiente
3. Actualizar tipos en `types.ts`
4. Documentar en este README

---

## Licencia

Parte del proyecto GRAF v4.

---

**Última actualización:** Noviembre 2025
