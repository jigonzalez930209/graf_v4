import * as React from 'react'
import type { MultiCVAnalysisResult } from '@renderer/hooks/cv-analysis'
import { COLORS, type ChartConfig } from '../constants'
import { createAnnotation } from '../annotation-utils'
import { ChartCard } from '../chart-card'
import type { Data, Layout } from 'plotly.js'

interface DeltaEpChartProps {
  result: MultiCVAnalysisResult | null
  baseLayout: Partial<Layout>
  theme: 'dark' | 'light'
}

export const DeltaEpChart: React.FC<DeltaEpChartProps> = ({ result, baseLayout, theme }) => {
  const chart = React.useMemo<ChartConfig | null>(() => {
    if (!result?.correlations.epVsLnV || !result.files.length) return null

    const points: Array<{ x: number; y: number; label: string }> = result.files
      .filter((f) => f.analysis.parameters.deltaEp !== undefined)
      .map((f) => ({
        x: Math.log(f.scanRate),
        y: f.analysis.parameters.deltaEp! / 1000,
        label: f.fileName
      }))

    if (points.length === 0) return null

    const data: Data[] = [
      {
        x: points.map((p) => p.x),
        y: points.map((p) => p.y),
        mode: 'markers',
        type: 'scatter',
        name: 'ΔEp',
        marker: { size: 8, color: COLORS.neutral },
        text: points.map((p) => p.label),
        hovertemplate: '<b>%{text}</b><br>ln(v): %{x:.4f}<br>ΔEp: %{y:.4f} V<extra></extra>'
      }
    ]

    const annotations: Array<NonNullable<Partial<Layout>['annotations']>[number]> = []

    if (result.correlations.epVsLnV.r2 !== undefined) {
      const xValues = points.map((p) => p.x)
      const minX = Math.min(...xValues)
      const maxX = Math.max(...xValues)

      const yLine = [
        result.correlations.epVsLnV.slope * minX + result.correlations.epVsLnV.intercept,
        result.correlations.epVsLnV.slope * maxX + result.correlations.epVsLnV.intercept
      ]

      data.push({
        x: [minX, maxX],
        y: yLine,
        mode: 'lines',
        type: 'scatter',
        name: 'ΔEp Fit',
        line: { color: COLORS.neutral, width: 2, dash: 'dash' },
        hovertemplate: 'Fit: %{y:.4f}<extra></extra>'
      })

      annotations.push(
        createAnnotation({
          x: maxX,
          y: yLine[1],
          text: `y = ${result.correlations.epVsLnV.slope.toFixed(6)}x + ${result.correlations.epVsLnV.intercept.toFixed(6)}<br>R² = ${result.correlations.epVsLnV.r2.toFixed(4)}`,
          type: 'neutral',
          theme,
          chartType: 'delta-ep'
        })
      )
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
          title: { text: 'ΔEp (mV)', font: { size: 14, color: fontColor } }
        },
        title: {
          text: 'Peak Separation vs ln(Scan Rate)',
          font: { size: 16, color: fontColor }
        }
      }
    }
  }, [result, baseLayout, theme])

  if (!chart) return null

  const infoContent = (
    <div className="space-y-3">
      {result?.correlations.epVsLnV && (
        <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded border-l-4 border-blue-500">
          <div className="font-semibold text-blue-700 dark:text-blue-400 text-xs">ΔEp vs ln(v)</div>
          <div className="text-xs space-y-0.5 mt-1">
            <div>m = {result.correlations.epVsLnV.slope.toFixed(6)}</div>
            <div>b = {result.correlations.epVsLnV.intercept.toFixed(6)}</div>
            <div className="font-semibold">R² = {result.correlations.epVsLnV.r2.toFixed(4)}</div>
            <div className="text-xs text-muted-foreground">
              n = {result.correlations.epVsLnV.points}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <ChartCard
      title="Peak Separation vs ln(Scan Rate)"
      data={chart.data}
      layout={chart.layout}
      exportFileName="Peak Separation vs Ln Scan Rate"
      infoContent={infoContent}
    />
  )
}
