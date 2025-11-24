import * as React from 'react'
import type { MultiCVAnalysisResult } from '@renderer/hooks/cv-analysis'
import { COLORS, type ChartConfig } from '../constants'
import { createAnnotation, createSlopeAnnotation } from '../annotation-utils'
import { ChartCard } from '../chart-card'
import type { Data, Layout } from 'plotly.js'

interface LavironAnalysisChartProps {
  result: MultiCVAnalysisResult | null
  baseLayout: Partial<Layout>
  theme: 'dark' | 'light'
}

export const LavironAnalysisChart: React.FC<LavironAnalysisChartProps> = ({
  result,
  baseLayout,
  theme
}) => {
  const chart = React.useMemo<ChartConfig | null>(() => {
    if (!result?.correlations.epAVsLnV && !result?.correlations.epCVsLnV) return null
    if (!result.files.length) return null

    const data: Data[] = []
    const annotations: Array<NonNullable<Partial<Layout>['annotations']>[number]> = []

    // Puntos anódicos
    const anodicPoints: Array<{ x: number; y: number; label: string }> = result.files
      .filter((f) => f.analysis.peaks.anodic?.Ep !== undefined)
      .map((f) => ({
        x: Math.log(f.scanRate),
        y: f.analysis.peaks.anodic!.Ep,
        label: f.fileName
      }))

    if (anodicPoints.length > 0) {
      data.push({
        x: anodicPoints.map((p) => p.x),
        y: anodicPoints.map((p) => p.y),
        mode: 'markers',
        type: 'scatter',
        name: 'Ep,a (Anodic)',
        marker: { size: 10, color: COLORS.positive, symbol: 'circle' },
        text: anodicPoints.map((p) => p.label),
        hovertemplate: '<b>%{text}</b><br>ln(v): %{x:.4f}<br>Ep,a: %{y:.4f} V<extra></extra>'
      })

      // Línea de regresión anódica bilineal
      if (result.laviron?.bilinearAnodicRegression) {
        const xValues = anodicPoints.map((p) => p.x)
        const minX = Math.min(...xValues)
        const maxX = Math.max(...xValues)
        const vCriticalLn = Math.log(result.laviron.criticalScanRateAnodic!.vCritical)
        const bilinear = result.laviron.bilinearAnodicRegression

        // Regresión ANTES de νc
        if (bilinear.beforeCritical) {
          const yBefore = [
            bilinear.beforeCritical.slope * minX + bilinear.beforeCritical.intercept,
            bilinear.beforeCritical.slope * vCriticalLn + bilinear.beforeCritical.intercept
          ]

          data.push({
            x: [minX, vCriticalLn],
            y: yBefore,
            mode: 'lines',
            type: 'scatter',
            name: 'Ep,a Before νc',
            line: { color: COLORS.positive, width: 3, dash: 'solid' },
            hovertemplate: 'Before νc: %{y:.4f}<extra></extra>'
          })

          annotations.push(
            createSlopeAnnotation(
              (minX + vCriticalLn) / 2,
              (yBefore[0] + yBefore[1]) / 2,
              bilinear.beforeCritical.slope,
              'anodic',
              theme,
              'laviron'
            )
          )
        }

        // Regresión DESPUÉS de νc
        if (bilinear.afterCritical) {
          const yAfter = [
            bilinear.afterCritical.slope * vCriticalLn + bilinear.afterCritical.intercept,
            bilinear.afterCritical.slope * maxX + bilinear.afterCritical.intercept
          ]

          data.push({
            x: [vCriticalLn, maxX],
            y: yAfter,
            mode: 'lines',
            type: 'scatter',
            name: 'Ep,a After νc',
            line: { color: COLORS.positive, width: 3, dash: 'dash' },
            hovertemplate: 'After νc: %{y:.4f}<extra></extra>'
          })

          annotations.push(
            createSlopeAnnotation(
              (vCriticalLn + maxX) / 2,
              (yAfter[0] + yAfter[1]) / 2,
              bilinear.afterCritical.slope,
              'anodic',
              theme,
              'laviron'
            )
          )
        }
      } else if (result.correlations.epAVsLnV?.r2 !== undefined) {
        const xValues = anodicPoints.map((p) => p.x)
        const minX = Math.min(...xValues)
        const maxX = Math.max(...xValues)

        const yLine = [
          result.correlations.epAVsLnV.slope * minX + result.correlations.epAVsLnV.intercept,
          result.correlations.epAVsLnV.slope * maxX + result.correlations.epAVsLnV.intercept
        ]

        data.push({
          x: [minX, maxX],
          y: yLine,
          mode: 'lines',
          type: 'scatter',
          name: 'Ep,a Fit',
          line: { color: COLORS.positive, width: 2, dash: 'dash' },
          hovertemplate: 'Fit: %{y:.4f}<extra></extra>'
        })

        annotations.push(
          createAnnotation({
            x: minX,
            y: yLine[0],
            xanchor: 'left',
            text: `Anodic: m = ${result.correlations.epAVsLnV.slope.toFixed(6)}<br>R² = ${result.correlations.epAVsLnV.r2.toFixed(4)}`,
            type: 'anodic',
            theme,
            chartType: 'laviron'
          })
        )
      }
    }

    // Puntos catódicos
    const cathodicPoints: Array<{ x: number; y: number; label: string }> = result.files
      .filter((f) => f.analysis.peaks.cathodic?.Ep !== undefined)
      .map((f) => ({
        x: Math.log(f.scanRate),
        y: f.analysis.peaks.cathodic!.Ep,
        label: f.fileName
      }))

    if (cathodicPoints.length > 0) {
      data.push({
        x: cathodicPoints.map((p) => p.x),
        y: cathodicPoints.map((p) => p.y),
        mode: 'markers',
        type: 'scatter',
        name: 'Ep,c (Cathodic)',
        marker: { size: 10, color: COLORS.negative, symbol: 'square' },
        text: cathodicPoints.map((p) => p.label),
        hovertemplate: '<b>%{text}</b><br>ln(v): %{x:.4f}<br>Ep,c: %{y:.4f} V<extra></extra>'
      })

      // Línea de regresión catódica bilineal
      if (result.laviron?.bilinearCathodicRegression) {
        const xValues = cathodicPoints.map((p) => p.x)
        const minX = Math.min(...xValues)
        const maxX = Math.max(...xValues)
        const vCriticalLn = Math.log(result.laviron.criticalScanRateCathodic!.vCritical)
        const bilinear = result.laviron.bilinearCathodicRegression

        // Regresión ANTES de νc
        if (bilinear.beforeCritical) {
          const yBefore = [
            bilinear.beforeCritical.slope * minX + bilinear.beforeCritical.intercept,
            bilinear.beforeCritical.slope * vCriticalLn + bilinear.beforeCritical.intercept
          ]

          data.push({
            x: [minX, vCriticalLn],
            y: yBefore,
            mode: 'lines',
            type: 'scatter',
            name: 'Ep,c Before νc',
            line: { color: COLORS.negative, width: 3, dash: 'solid' },
            hovertemplate: 'Before νc: %{y:.4f}<extra></extra>'
          })

          annotations.push(
            createSlopeAnnotation(
              (minX + vCriticalLn) / 2,
              (yBefore[0] + yBefore[1]) / 2,
              bilinear.beforeCritical.slope,
              'cathodic',
              theme,
              'laviron'
            )
          )
        }

        // Regresión DESPUÉS de νc
        if (bilinear.afterCritical) {
          const yAfter = [
            bilinear.afterCritical.slope * vCriticalLn + bilinear.afterCritical.intercept,
            bilinear.afterCritical.slope * maxX + bilinear.afterCritical.intercept
          ]

          data.push({
            x: [vCriticalLn, maxX],
            y: yAfter,
            mode: 'lines',
            type: 'scatter',
            name: 'Ep,c After νc',
            line: { color: COLORS.negative, width: 3, dash: 'dash' },
            hovertemplate: 'After νc: %{y:.4f}<extra></extra>'
          })

          annotations.push(
            createSlopeAnnotation(
              (vCriticalLn + maxX) / 2,
              (yAfter[0] + yAfter[1]) / 2,
              bilinear.afterCritical.slope,
              'cathodic',
              theme,
              'laviron'
            )
          )
        }
      } else if (result.correlations.epCVsLnV?.r2 !== undefined) {
        const xValues = cathodicPoints.map((p) => p.x)
        const minX = Math.min(...xValues)
        const maxX = Math.max(...xValues)

        const yLine = [
          result.correlations.epCVsLnV.slope * minX + result.correlations.epCVsLnV.intercept,
          result.correlations.epCVsLnV.slope * maxX + result.correlations.epCVsLnV.intercept
        ]

        data.push({
          x: [minX, maxX],
          y: yLine,
          mode: 'lines',
          type: 'scatter',
          name: 'Ep,c Fit',
          line: { color: COLORS.negative, width: 2, dash: 'dash' },
          hovertemplate: 'Fit: %{y:.4f}<extra></extra>'
        })

        annotations.push(
          createAnnotation({
            x: maxX,
            y: yLine[1],
            xanchor: 'right',
            yanchor: 'top',
            text: `Cathodic: m = ${result.correlations.epCVsLnV.slope.toFixed(6)}<br>R² = ${result.correlations.epCVsLnV.r2.toFixed(4)}`,
            type: 'cathodic',
            theme,
            chartType: 'laviron'
          })
        )
      }
    }

    // Línea de potencial formal
    if (result.laviron?.formalPotential !== undefined) {
      const allXValues = [...anodicPoints, ...cathodicPoints].map((p) => p.x)
      if (allXValues.length > 0) {
        const minX = Math.min(...allXValues)
        const maxX = Math.max(...allXValues)

        data.push({
          x: [minX, maxX],
          y: [result.laviron.formalPotential, result.laviron.formalPotential],
          mode: 'lines',
          type: 'scatter',
          name: `E° = ${result.laviron.formalPotential.toFixed(4)} V`,
          line: { color: '#3b82f6', width: 2, dash: 'solid' },
          hovertemplate: 'E° (Formal Potential)<extra></extra>'
        })
      }
    }

    const fontColor = baseLayout.font?.color || '#262626'
    return {
      data,
      layout: {
        ...baseLayout,
        annotations,
        xaxis: {
          ...baseLayout.xaxis,
          title: { text: 'ln(Scan Rate)', font: { size: 14, color: fontColor } }
        },
        yaxis: {
          ...baseLayout.yaxis,
          title: { text: 'Peak Potential (V)', font: { size: 14, color: fontColor } }
        },
        title: {
          text: 'Laviron Analysis: Peak Potentials vs ln(Scan Rate)',
          font: { size: 16, color: fontColor }
        }
      }
    }
  }, [result, baseLayout, theme])

  if (!chart) return null

  const infoContent = (
    <div className="space-y-3">
      {result?.correlations.epAVsLnV && (
        <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded border-l-4 border-green-500">
          <div className="font-semibold text-green-700 dark:text-green-400 text-xs">
            Ep,a vs ln(v)
          </div>
          <div className="text-xs space-y-0.5 mt-1">
            <div>m = {result.correlations.epAVsLnV.slope.toFixed(6)}</div>
            <div>b = {result.correlations.epAVsLnV.intercept.toFixed(6)}</div>
            <div className="font-semibold">R² = {result.correlations.epAVsLnV.r2.toFixed(4)}</div>
            <div className="text-xs text-muted-foreground">
              n = {result.correlations.epAVsLnV.points}
            </div>
          </div>
        </div>
      )}
      {result?.correlations.epCVsLnV && (
        <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded border-l-4 border-red-500">
          <div className="font-semibold text-red-700 dark:text-red-400 text-xs">Ep,c vs ln(v)</div>
          <div className="text-xs space-y-0.5 mt-1">
            <div>m = {result.correlations.epCVsLnV.slope.toFixed(6)}</div>
            <div>b = {result.correlations.epCVsLnV.intercept.toFixed(6)}</div>
            <div className="font-semibold">R² = {result.correlations.epCVsLnV.r2.toFixed(4)}</div>
            <div className="text-xs text-muted-foreground">
              n = {result.correlations.epCVsLnV.points}
            </div>
          </div>
        </div>
      )}
      {result?.laviron?.formalPotential !== undefined && (
        <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded border-l-4 border-blue-500">
          <div className="font-semibold text-blue-700 dark:text-blue-400 text-xs">
            E° (Formal Potential)
          </div>
          <div className="text-xs space-y-0.5 mt-1">
            <div>{result.laviron.formalPotential.toFixed(4)} V</div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <ChartCard
      title="Laviron Analysis: Peak Potentials vs ln(Scan Rate)"
      data={chart.data}
      layout={chart.layout}
      exportFileName="Laviron Analysis - Peak Potentials vs Ln Scan Rate"
      infoContent={infoContent}
    />
  )
}
