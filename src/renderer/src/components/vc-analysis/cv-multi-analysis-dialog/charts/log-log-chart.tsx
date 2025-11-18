import * as React from 'react'
import type { MultiCVAnalysisResult } from '@renderer/hooks/cv-analysis'
import { COLORS, type ChartConfig } from '../constants'
import { createAnnotation } from '../annotation-utils'
import { ChartCard } from '../chart-card'
import type { Data, Layout } from 'plotly.js'

interface LogLogChartProps {
  result: MultiCVAnalysisResult | null
  baseLayout: Partial<Layout>
  theme: 'dark' | 'light'
}

export const LogLogChart: React.FC<LogLogChartProps> = ({ result, baseLayout, theme }) => {
  const chart = React.useMemo<ChartConfig | null>(() => {
    if (!result?.correlations.logIpVsLogV || !result.files.length) return null

    const positivePoints: Array<{ x: number; y: number; label: string }> = result.files
      .filter(
        (f) => f.analysis.peaks.anodic?.Ip && f.scanRate > 0 && f.analysis.peaks.anodic.Ip > 0
      )
      .map((f) => ({
        x: Math.log(f.scanRate),
        y: Math.log(f.analysis.peaks.anodic!.Ip),
        label: f.fileName
      }))

    const negativePoints: Array<{ x: number; y: number; label: string }> = result.files
      .filter(
        (f) => f.analysis.peaks.cathodic?.Ip && f.scanRate > 0 && f.analysis.peaks.cathodic.Ip < 0
      )
      .map((f) => ({
        x: Math.log(f.scanRate),
        y: Math.log(Math.abs(f.analysis.peaks.cathodic!.Ip)),
        label: f.fileName
      }))

    if (positivePoints.length === 0 && negativePoints.length === 0) return null

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
        hovertemplate: '<b>%{text}</b><br>log(v): %{x:.4f}<br>log(Ip,a): %{y:.4f}<extra></extra>'
      })

      const xValues = positivePoints.map((p) => p.x)
      const minX = Math.min(...xValues)
      const maxX = Math.max(...xValues)
      const anodicFit = result.correlations.logIpVsLogV?.anodic
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
          hovertemplate: 'Fit: %{y:.4f}<extra></extra>'
        })

        annotations.push(
          createAnnotation({
            x: maxX,
            y: yLine[1],
            text: `Anodic: y = ${anodicFit.slope.toFixed(4)}x + ${anodicFit.intercept.toFixed(4)}<br>R² = ${anodicFit.r2.toFixed(4)}`,
            type: 'anodic',
            theme,
            chartType: 'log-log'
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
        hovertemplate: '<b>%{text}</b><br>log(v): %{x:.4f}<br>log(Ip,c): %{y:.4f}<extra></extra>'
      })

      const xValues = negativePoints.map((p) => p.x)
      const minX = Math.min(...xValues)
      const maxX = Math.max(...xValues)
      const cathodicFit = result.correlations.logIpVsLogV?.cathodic
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
          hovertemplate: 'Fit: %{y:.4f}<extra></extra>'
        })

        annotations.push(
          createAnnotation({
            x: maxX,
            y: yLine[1],
            xanchor: 'right',
            yanchor: 'top',
            text: `Cathodic: y = ${cathodicFit.slope.toFixed(4)}x + ${cathodicFit.intercept.toFixed(4)}<br>R² = ${cathodicFit.r2.toFixed(4)}`,
            type: 'cathodic',
            theme,
            chartType: 'log-log'
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
          title: { text: 'ln(Scan Rate)', font: { size: 14, color: fontColor } }
        },
        yaxis: {
          ...baseLayout.yaxis,
          title: { text: 'ln(Peak Current in mA)', font: { size: 14, color: fontColor } }
        },
        title: {
          text: 'Power Law Analysis: ln(Ip) vs ln(v)',
          font: { size: 16, color: fontColor }
        }
      }
    }
  }, [result, baseLayout, theme])

  if (!chart) return null

  const infoContent = (
    <div className="space-y-3">
      {result?.correlations.logIpVsLogV?.anodic && (
        <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded border-l-4 border-blue-500">
          <div className="font-semibold text-blue-700 dark:text-blue-400 text-xs">
            log(Ip,a) vs log(v)
          </div>
          <div className="text-xs space-y-0.5 mt-1">
            <div>m = {result.correlations.logIpVsLogV.anodic.slope.toFixed(4)}</div>
            <div>b = {result.correlations.logIpVsLogV.anodic.intercept.toFixed(4)}</div>
            <div className="font-semibold">
              R² = {result.correlations.logIpVsLogV.anodic.r2.toFixed(4)}
            </div>
            <div className="text-xs text-muted-foreground">
              n = {result.correlations.logIpVsLogV.anodic.points}
            </div>
          </div>
        </div>
      )}
      {result?.correlations.logIpVsLogV?.cathodic && (
        <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded border-l-4 border-red-500">
          <div className="font-semibold text-red-700 dark:text-red-400 text-xs">
            log(Ip,c) vs log(v)
          </div>
          <div className="text-xs space-y-0.5 mt-1">
            <div>m = {result.correlations.logIpVsLogV.cathodic.slope.toFixed(4)}</div>
            <div>b = {result.correlations.logIpVsLogV.cathodic.intercept.toFixed(4)}</div>
            <div className="font-semibold">
              R² = {result.correlations.logIpVsLogV.cathodic.r2.toFixed(4)}
            </div>
            <div className="text-xs text-muted-foreground">
              n = {result.correlations.logIpVsLogV.cathodic.points}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <ChartCard
      title="Power Law Analysis: ln(Ip) vs ln(v)"
      data={chart.data}
      layout={chart.layout}
      exportFileName="Log Peak Current vs Log Scan Rate"
      infoContent={infoContent}
    />
  )
}
