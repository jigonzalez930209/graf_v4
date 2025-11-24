import * as React from 'react'
import type { MultiCVAnalysisResult } from '@renderer/hooks/cv-analysis'
import { COLORS, type ChartConfig } from '../constants'
import { createAnnotation } from '../annotation-utils'
import { ChartCard } from '../chart-card'
import type { Data, Layout } from 'plotly.js'

interface LinearChartProps {
  result: MultiCVAnalysisResult | null
  baseLayout: Partial<Layout>
  theme: 'dark' | 'light'
}

export const LinearChart: React.FC<LinearChartProps> = ({ result, baseLayout, theme }) => {
  const chart = React.useMemo<ChartConfig | null>(() => {
    if (!result?.correlations.ipVsV || !result.files.length) return null

    const positivePoints: Array<{ x: number; y: number; label: string }> = result.files
      .filter((f) => f.analysis.peaks.anodic?.Ip)
      .map((f) => ({
        x: f.scanRate,
        y: f.analysis.peaks.anodic!.Ip,
        label: f.fileName
      }))

    const negativePoints: Array<{ x: number; y: number; label: string }> = result.files
      .filter((f) => f.analysis.peaks.cathodic?.Ip)
      .map((f) => ({
        x: f.scanRate,
        y: f.analysis.peaks.cathodic!.Ip,
        label: f.fileName
      }))

    const data: Data[] = []
    const annotations: Array<NonNullable<Partial<Layout>['annotations']>[number]> = []

    if (positivePoints.length > 0) {
      data.push({
        x: positivePoints.map((p) => p.x),
        y: positivePoints.map((p) => p.y),
        mode: 'markers',
        type: 'scatter',
        name: 'Ip,a (Anodic)',
        marker: { size: 8, color: COLORS.positive },
        text: positivePoints.map((p) => p.label),
        hovertemplate: '<b>%{text}</b><br>v: %{x:.4f}<br>Ip,a: %{y:.2e}<extra></extra>'
      })

      const xValues = positivePoints.map((p) => p.x)
      const minX = Math.min(...xValues)
      const maxX = Math.max(...xValues)
      const anodicFit = result.correlations.ipVsV?.anodic
      if (anodicFit) {
        const yLine = [
          anodicFit.slope * minX + anodicFit.intercept,
          anodicFit.slope * maxX + anodicFit.intercept
        ]

        data.push({
          x: [minX, maxX],
          y: yLine,
          mode: 'lines',
          type: 'scatter',
          name: 'Ip,a Fit',
          line: { color: COLORS.positive, width: 2, dash: 'dash' },
          hovertemplate: 'Fit: %{y:.2e}<extra></extra>'
        })

        annotations.push(
          createAnnotation({
            x: maxX,
            y: yLine[1],
            text: `Anodic: y = ${anodicFit.slope.toExponential(3)}x + ${anodicFit.intercept.toExponential(3)}<br>R² = ${anodicFit.r2.toFixed(4)}`,
            type: 'anodic',
            theme,
            chartType: 'linear'
          })
        )
      }
    }

    if (negativePoints.length > 0) {
      data.push({
        x: negativePoints.map((p) => p.x),
        y: negativePoints.map((p) => p.y),
        mode: 'markers',
        type: 'scatter',
        name: 'Ip,c (Cathodic)',
        marker: { size: 8, color: COLORS.negative },
        text: negativePoints.map((p) => p.label),
        hovertemplate: '<b>%{text}</b><br>v: %{x:.4f}<br>Ip,c: %{y:.2e}<extra></extra>'
      })

      const xValues = negativePoints.map((p) => p.x)
      const minX = Math.min(...xValues)
      const maxX = Math.max(...xValues)
      const cathodicFit = result.correlations.ipVsV?.cathodic
      if (cathodicFit) {
        const yLine = [
          cathodicFit.slope * minX + cathodicFit.intercept,
          cathodicFit.slope * maxX + cathodicFit.intercept
        ]

        data.push({
          x: [minX, maxX],
          y: yLine,
          mode: 'lines',
          type: 'scatter',
          name: 'Ip,c Fit',
          line: { color: COLORS.negative, width: 2, dash: 'dash' },
          hovertemplate: 'Fit: %{y:.2e}<extra></extra>'
        })

        annotations.push(
          createAnnotation({
            x: maxX,
            y: yLine[1],
            xanchor: 'right',
            yanchor: 'top',
            text: `Cathodic: y = ${cathodicFit.slope.toExponential(3)}x + ${cathodicFit.intercept.toExponential(3)}<br>R² = ${cathodicFit.r2.toFixed(4)}`,
            type: 'cathodic',
            theme,
            chartType: 'linear'
          })
        )
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
          title: { text: 'Scan Rate (mV/s)', font: { size: 14, color: fontColor } }
        },
        yaxis: {
          ...baseLayout.yaxis,
          title: { text: 'Peak Current (mA)', font: { size: 14, color: fontColor } }
        },
        title: {
          text: 'Peak Current vs Scan Rate (Linear)',
          font: { size: 16, color: fontColor }
        }
      }
    }
  }, [result, baseLayout, theme])

  if (!chart) return null

  const infoContent = (
    <div className="space-y-3">
      {result?.correlations.ipVsV?.anodic && (
        <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded border-l-4 border-green-500">
          <div className="font-semibold text-green-700 dark:text-green-400 text-xs">Ip,a vs v</div>
          <div className="text-xs space-y-0.5 mt-1">
            <div>m = {result.correlations.ipVsV.anodic.slope.toExponential(2)}</div>
            <div>b = {result.correlations.ipVsV.anodic.intercept.toExponential(2)}</div>
            <div className="font-semibold">
              R² = {result.correlations.ipVsV.anodic.r2.toFixed(4)}
            </div>
            <div className="text-xs text-muted-foreground">
              n = {result.correlations.ipVsV.anodic.points}
            </div>
          </div>
        </div>
      )}
      {result?.correlations.ipVsV?.cathodic && (
        <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded border-l-4 border-red-500">
          <div className="font-semibold text-red-700 dark:text-red-400 text-xs">Ip,c vs v</div>
          <div className="text-xs space-y-0.5 mt-1">
            <div>m = {result.correlations.ipVsV.cathodic.slope.toExponential(2)}</div>
            <div>b = {result.correlations.ipVsV.cathodic.intercept.toExponential(2)}</div>
            <div className="font-semibold">
              R² = {result.correlations.ipVsV.cathodic.r2.toFixed(4)}
            </div>
            <div className="text-xs text-muted-foreground">
              n = {result.correlations.ipVsV.cathodic.points}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <ChartCard
      title="Peak Current vs Scan Rate (Linear)"
      data={chart.data}
      layout={chart.layout}
      exportFileName="Peak Current vs Scan Rate Linear"
      infoContent={infoContent}
    />
  )
}
