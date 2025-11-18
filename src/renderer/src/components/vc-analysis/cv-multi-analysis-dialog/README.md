# CV Multi-Analysis Dialog

Componente refactorizado para análisis de múltiples voltamogramas cíclicos (CV) con velocidades de barrido variables.

## Estructura

```
cv-multi-analysis-dialog/
├── index.tsx                      # Componente principal (Dialog wrapper)
├── constants.ts                   # Constantes compartidas (colores, layouts, config)
├── charts-section.tsx             # Gráficos de correlaciones (Randles-Sevcik, lineal, log-log)
├── laviron-chart-section.tsx      # Gráfico de análisis Laviron (Ep vs ln(v))
├── tables-section.tsx             # Tablas de resultados y datos detallados
├── laviron-kinetics-section.tsx   # Sección de cinética Laviron
├── executive-summary-section.tsx  # Resumen ejecutivo de resultados
└── README.md                      # Este archivo
```

## Componentes

### `index.tsx`
Componente principal que integra todos los sub-componentes. Gestiona:
- Estado del diálogo
- Hook `useMultiCVAnalysis` para análisis
- Tabs (Analysis Results / Theoretical Foundation)
- Checkbox para incluir origen en ajustes

### `constants.ts`
Exporta:
- `COLORS`: Paleta de colores para gráficos
- `PLOTLY_CONFIG`: Configuración de Plotly
- `buildBaseLayout()`: Función para crear layout base con tema
- `ChartConfig`: Tipo para configuración de gráficos

### `charts-section.tsx`
Renderiza 4 gráficos de correlaciones:
1. **Ip vs √(v)** - Randles-Sevcik (anódico/catódico)
2. **ΔEp vs ln(v)** - Separación de picos
3. **Ip vs v** - Correlación lineal
4. **log(Ip) vs log(v)** - Análisis de ley de potencias

### `laviron-chart-section.tsx`
Gráfico unificado de Laviron:
- Ep,a vs ln(v) con regresión bilineal (antes/después de νc)
- Ep,c vs ln(v) con regresión bilineal
- Línea de potencial formal (E°)
- Líneas verticales de velocidades críticas

### `tables-section.tsx`
Dos tablas principales:
1. **Regression Results**: Parámetros de ajuste (m, b, R², n) para cada correlación
2. **Detailed Files Analysis**: Datos por archivo (Ep, Ip, ΔEp, mecanismo, confianza)

### `laviron-kinetics-section.tsx`
Tarjetas informativas:
- Velocidad crítica anódica (νc,a)
- Velocidad crítica catódica (νc,c)
- Potencial formal (E°)
- Coeficientes de transferencia (α,a y α,c)

### `executive-summary-section.tsx`
Resumen de 5 KPIs:
- Número de archivos analizados
- ΔEp promedio
- Área de histéresis promedio
- Mecanismo consenso
- Mejor R²

## Uso

```tsx
import CVMultiAnalysisDialog from '@renderer/components/vc-analysis/cv-multi-analysis-dialog'

export default function MyComponent() {
  return <CVMultiAnalysisDialog />
}
```

## Flujo de datos

1. Usuario selecciona archivos CV (teq4) y hace clic en "Analyze"
2. Hook `useMultiCVAnalysis` procesa los datos
3. Componente principal distribuye resultados a sub-componentes
4. Cada sub-componente renderiza su sección específica

## Dependencias

- React
- Plotly.js (vía componente `Plot`)
- next-themes (para tema)
- Componentes UI (dialog, button, tabs)
- Hook `useMultiCVAnalysis`
- Hook `useData`

## Notas

- Todos los gráficos son interactivos (zoom, pan, hover)
- Los datos se recalculan automáticamente cuando cambia `includeOrigin`
- El tema se aplica dinámicamente a todos los gráficos
