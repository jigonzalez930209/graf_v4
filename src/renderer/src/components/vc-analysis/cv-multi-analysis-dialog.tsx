import * as React from 'react'
import { BarChart3Icon } from 'lucide-react'
import Plot from '../plot/new-plot'
import type { Data, Layout, Config } from 'plotly.js'
import { useTheme } from 'next-themes'

import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Button } from '../ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { useMultiCVAnalysis, type MultiCVAnalysisResult } from '@renderer/hooks/cv-analysis'
import { useData } from '@renderer/hooks/useData'
import type { IProcessFile } from '@shared/models/files'
import { defaultTheme } from '@/utils'
import CVTheoryTabs from './cv-theory-tabs'

type ChartConfig = {
  data: Data[]
  layout: Partial<Layout>
}

const COLORS = {
  positive: '#22c55e',
  negative: '#ef4444',
  neutral: '#3b82f6',
  linear: '#ef4444'
}

const PLOTLY_CONFIG: Partial<Config> = {
  scrollZoom: true,
  editable: true,
  displaylogo: false,
  modeBarButtonsToRemove: ['select2d', 'lasso2d'],
  toImageButtonOptions: {
    format: 'svg' as const,
    filename: 'cv-multi-analysis',
    scale: 1
  }
}

const buildBaseLayout = (theme: 'dark' | 'light'): Partial<Layout> => {
  const fontColor = theme === 'dark' ? '#e6e6e6' : '#262626'
  const bgColor = theme === 'dark' ? '#000' : '#fff'
  const gridColor = theme === 'dark' ? '#404040' : '#e6e6e6'
  const legendBgColor = theme === 'dark' ? '#1a1a1a' : '#f5f5f5'
  const legendBorderColor = theme === 'dark' ? '#404040' : '#d0d0d0'

  return {
    autosize: true,
    margin: { t: 20, r: 20, b: 50, l: 60 },
    paper_bgcolor: bgColor,
    plot_bgcolor: bgColor,
    font: { family: 'sans-serif', size: 12, color: fontColor },
    hovermode: 'closest',
    legend: {
      x: 0.02,
      y: 0.98,
      xanchor: 'left',
      yanchor: 'top',
      bgcolor: legendBgColor,
      bordercolor: legendBorderColor,
      borderwidth: 1,
      font: { size: 11, color: fontColor }
    },
    xaxis: {
      showgrid: true,
      gridwidth: 1,
      gridcolor: gridColor,
      zeroline: false
    },
    yaxis: {
      showgrid: true,
      gridwidth: 1,
      gridcolor: gridColor,
      zeroline: false
    }
  }
}

const CVMultiAnalysisDialog: React.FC = () => {
  const { data } = useData()
  const files = React.useMemo(() => data || [], [data])
  const theme = useTheme()
  const t = defaultTheme(theme)
  const baseLayout = React.useMemo(() => buildBaseLayout(t), [t])

  const [result, setResult] = React.useState<MultiCVAnalysisResult | null>(null)
  const [includeOrigin, setIncludeOrigin] = React.useState(false)

  const selectedCVFiles = React.useMemo((): IProcessFile[] => {
    return files.filter((f) => f.type === 'teq4' && f.selected)
  }, [files])

  // Usar el hook aquí en el componente
  const analysisResult = useMultiCVAnalysis(
    selectedCVFiles.length >= 2
      ? {
          files: selectedCVFiles,
          config: { scanRate: 0.1 },
          includeOrigin
        }
      : null
  )

  const handleAnalyze = React.useCallback(() => {
    if (selectedCVFiles.length < 2) {
      alert('Please select at least two CV files (teq4)')
      return
    }

    if (analysisResult) {
      setResult(analysisResult)
    }
  }, [selectedCVFiles.length, analysisResult])

  const hasSelectedFiles = React.useMemo(() => selectedCVFiles.length >= 2, [selectedCVFiles])

  // Gráfico de ip vs sqrt(v)
  const ipVsSqrtVChart = React.useMemo<ChartConfig | null>(() => {
    if (!result?.correlations.ipVsSqrtV || !result.files.length) return null

    const positivePoints: Array<{ x: number; y: number; label: string }> = result.files
      .filter((f) => f.analysis.peaks.anodic?.Ip)
      .map((f) => ({
        x: Math.sqrt(f.scanRate),
        y: f.analysis.peaks.anodic!.Ip,
        label: f.fileName
      }))

    const negativePoints: Array<{ x: number; y: number; label: string }> = result.files
      .filter((f) => f.analysis.peaks.cathodic?.Ip)
      .map((f) => ({
        x: Math.sqrt(f.scanRate),
        y: f.analysis.peaks.cathodic!.Ip,
        label: f.fileName
      }))

    const data: Data[] = []
    const annotations: Array<NonNullable<Partial<Layout>['annotations']>[number]> = []

    // Picos positivos
    if (positivePoints.length > 0) {
      data.push({
        x: positivePoints.map((p) => p.x),
        y: positivePoints.map((p) => p.y),
        mode: 'markers',
        type: 'scatter',
        name: 'Ip,a (Anodic)',
        marker: { size: 8, color: COLORS.positive },
        text: positivePoints.map((p) => p.label),
        hovertemplate: '<b>%{text}</b><br>√v: %{x:.4f}<br>Ip,a: %{y:.2e}<extra></extra>'
      })

      const xValues = positivePoints.map((p) => p.x)
      const minX = Math.min(...xValues)
      const maxX = Math.max(...xValues)
      const anodicFit = result.correlations.ipVsSqrtV?.anodic
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

        annotations.push({
          x: maxX,
          y: yLine[1],
          xanchor: 'right',
          yanchor: 'bottom',
          text: `Anodic: y = ${anodicFit.slope.toExponential(3)}x + ${anodicFit.intercept.toExponential(3)}<br>R² = ${anodicFit.r2.toFixed(4)}`,
          showarrow: false,
          bgcolor: 'rgba(255,255,255,0.85)',
          bordercolor: COLORS.positive,
          borderwidth: 1,
          font: { size: 10, color: '#0f172a' },
          align: 'left'
        })
      }
    }

    // Picos negativos
    if (negativePoints.length > 0) {
      data.push({
        x: negativePoints.map((p) => p.x),
        y: negativePoints.map((p) => p.y),
        mode: 'markers',
        type: 'scatter',
        name: 'Ip,c (Cathodic)',
        marker: { size: 8, color: COLORS.negative },
        text: negativePoints.map((p) => p.label),
        hovertemplate: '<b>%{text}</b><br>√v: %{x:.4f}<br>Ip,c: %{y:.2e}<extra></extra>'
      })

      const xValues = negativePoints.map((p) => p.x)
      const minX = Math.min(...xValues)
      const maxX = Math.max(...xValues)
      const cathodicFit = result.correlations.ipVsSqrtV?.cathodic
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

        annotations.push({
          x: maxX,
          y: yLine[1],
          xanchor: 'right',
          yanchor: 'top',
          text: `Cathodic: y = ${cathodicFit.slope.toExponential(3)}x + ${cathodicFit.intercept.toExponential(3)}<br>R² = ${cathodicFit.r2.toFixed(4)}`,
          showarrow: false,
          bgcolor: 'rgba(255,255,255,0.85)',
          bordercolor: COLORS.negative,
          borderwidth: 1,
          font: { size: 10, color: '#0f172a' },
          align: 'left'
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
          title: { text: '√(Scan Rate)', font: { size: 14, color: fontColor } }
        },
        yaxis: {
          ...baseLayout.yaxis,
          title: { text: 'Peak Current (mA)', font: { size: 14, color: fontColor } }
        },
        title: {
          text: 'Peak Current vs √(Scan Rate) - Randles-Sevcik',
          font: { size: 16, color: fontColor }
        }
      }
    }
  }, [result, baseLayout])

  // Gráfico de ΔEp vs ln(v)
  const deltaEpVsLnVChart = React.useMemo<ChartConfig | null>(() => {
    if (!result?.correlations.epVsLnV || !result.files.length) return null

    const points: Array<{ x: number; y: number; label: string }> = result.files
      .filter((f) => f.analysis.parameters.deltaEp !== undefined)
      .map((f) => ({
        x: Math.log(f.scanRate),
        y: f.analysis.parameters.deltaEp! / 1000, // Convert mV to V
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

    // Agregar línea de regresión
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

      annotations.push({
        x: maxX,
        y: yLine[1],
        xanchor: 'right',
        yanchor: 'bottom',
        text: `y = ${result.correlations.epVsLnV.slope.toFixed(6)}x + ${result.correlations.epVsLnV.intercept.toFixed(6)}<br>R² = ${result.correlations.epVsLnV.r2.toFixed(4)}`,
        showarrow: false,
        bgcolor: 'rgba(255,255,255,0.85)',
        bordercolor: COLORS.neutral,
        borderwidth: 1,
        font: { size: 11, color: '#0f172a' },
        align: 'left'
      })
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
  }, [result, baseLayout])

  // Gráfico de Ip vs v (lineal)
  const ipVsVChart = React.useMemo<ChartConfig | null>(() => {
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

    // Picos positivos
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

        annotations.push({
          x: maxX,
          y: yLine[1],
          xanchor: 'right',
          yanchor: 'bottom',
          text: `Anodic: y = ${anodicFit.slope.toExponential(3)}x + ${anodicFit.intercept.toExponential(3)}<br>R² = ${anodicFit.r2.toFixed(4)}`,
          showarrow: false,
          bgcolor: 'rgba(255,255,255,0.85)',
          bordercolor: COLORS.positive,
          borderwidth: 1,
          font: { size: 10, color: '#0f172a' },
          align: 'left'
        })
      }
    }

    // Picos negativos
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

        annotations.push({
          x: maxX,
          y: yLine[1],
          xanchor: 'right',
          yanchor: 'top',
          text: `Cathodic: y = ${cathodicFit.slope.toExponential(3)}x + ${cathodicFit.intercept.toExponential(3)}<br>R² = ${cathodicFit.r2.toFixed(4)}`,
          showarrow: false,
          bgcolor: 'rgba(255,255,255,0.85)',
          bordercolor: COLORS.negative,
          borderwidth: 1,
          font: { size: 10, color: '#0f172a' },
          align: 'left'
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
  }, [result, baseLayout])

  // Gráfico de log(Ip) vs log(v)
  const logIpVsLogVChart = React.useMemo<ChartConfig | null>(() => {
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

    // Picos positivos
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

        annotations.push({
          x: maxX,
          y: yLine[1],
          xanchor: 'right',
          yanchor: 'bottom',
          text: `Anodic: y = ${anodicFit.slope.toFixed(4)}x + ${anodicFit.intercept.toFixed(4)}<br>R² = ${anodicFit.r2.toFixed(4)}`,
          showarrow: false,
          bgcolor: 'rgba(255,255,255,0.85)',
          bordercolor: COLORS.positive,
          borderwidth: 1,
          font: { size: 10, color: '#0f172a' },
          align: 'left'
        })
      }
    }

    // Picos negativos
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

        annotations.push({
          x: maxX,
          y: yLine[1],
          xanchor: 'right',
          yanchor: 'top',
          text: `Cathodic: y = ${cathodicFit.slope.toFixed(4)}x + ${cathodicFit.intercept.toFixed(4)}<br>R² = ${cathodicFit.r2.toFixed(4)}`,
          showarrow: false,
          bgcolor: 'rgba(255,255,255,0.85)',
          bordercolor: COLORS.negative,
          borderwidth: 1,
          font: { size: 10, color: '#0f172a' },
          align: 'left'
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
          title: { text: 'ln(Peak Current in mA)', font: { size: 14, color: fontColor } }
        },
        title: {
          text: 'Power Law Analysis: ln(Ip) vs ln(v)',
          font: { size: 16, color: fontColor }
        }
      }
    }
  }, [result, baseLayout])

  const ipVsSqrtVChart_data = ipVsSqrtVChart
  const deltaEpVsLnVChart_data = deltaEpVsLnVChart
  const ipVsVChart_data = ipVsVChart
  const logIpVsLogVChart_data = logIpVsLogVChart

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="rounded-full border-0"
          size="icon"
          title="Multi-CV Analysis"
        >
          <BarChart3Icon className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="h-[90vh] max-w-[90%] w-[90%] gap-4 overflow-y-auto">
        <DialogTitle className="mb-1 flex h-6 w-full items-center gap-6 p-0">
          Multi-CV Analysis (Multiple Scan Rates)
        </DialogTitle>

        <div className="flex gap-4 items-center bg-accent/20 p-2 rounded-md">
          <Button
            disabled={!hasSelectedFiles}
            size="sm"
            onClick={handleAnalyze}
            className="bg-blue-500 hover:bg-blue-600"
            title="Analyze selected CV files"
          >
            Analyze
          </Button>
          <span className="text-sm text-muted-foreground">
            {selectedCVFiles.length} file(s) selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <input
              type="checkbox"
              id="includeOrigin"
              checked={includeOrigin}
              onChange={(e) => setIncludeOrigin(e.target.checked)}
              className="w-4 h-4 cursor-pointer"
            />
            <label htmlFor="includeOrigin" className="text-sm cursor-pointer">
              Include origin (0,0) in fit
            </label>
          </div>
        </div>

        <Tabs defaultValue="analysis" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="analysis">Analysis Results</TabsTrigger>
            <TabsTrigger value="theory">Theoretical Foundation</TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-4">
            {result && (
              <div className="mt-4 flex flex-col gap-6">
                {/* Gráficos - Fila 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {ipVsSqrtVChart_data && (
                    <div className="p-1 rounded-md border">
                      <Plot
                        data={ipVsSqrtVChart_data.data}
                        layout={ipVsSqrtVChart_data.layout}
                        config={PLOTLY_CONFIG}
                        exportFileName="Peak Current vs Sqrt Scan Rate"
                        isNecessaryRefreshZoom
                      />
                    </div>
                  )}

                  {deltaEpVsLnVChart_data && (
                    <div className="p-1 rounded-md border">
                      <Plot
                        data={deltaEpVsLnVChart_data.data}
                        layout={deltaEpVsLnVChart_data.layout}
                        config={PLOTLY_CONFIG}
                        exportFileName="Peak Separation vs Ln Scan Rate"
                        isNecessaryRefreshZoom
                      />
                    </div>
                  )}
                </div>

                {/* Gráficos - Fila 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {ipVsVChart_data && (
                    <div className="p-1 rounded-md border">
                      <Plot
                        data={ipVsVChart_data.data}
                        layout={ipVsVChart_data.layout}
                        config={PLOTLY_CONFIG}
                        exportFileName="Peak Current vs Scan Rate Linear"
                        isNecessaryRefreshZoom
                      />
                    </div>
                  )}

                  {logIpVsLogVChart_data && (
                    <div className="p-1 rounded-md border">
                      <Plot
                        data={logIpVsLogVChart_data.data}
                        layout={logIpVsLogVChart_data.layout}
                        config={PLOTLY_CONFIG}
                        exportFileName="Log Peak Current vs Log Scan Rate"
                        isNecessaryRefreshZoom
                      />
                    </div>
                  )}
                </div>

                {/* Tabla de resultados de regresión */}
                <div className="p-4 rounded-md bg-accent/10">
                  <h3 className="font-semibold mb-3">Regression Results (All Correlations)</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 text-xs">
                    {result.correlations.ipVsSqrtV?.anodic && (
                      <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded border-l-4 border-green-500">
                        <div className="font-semibold text-green-700 dark:text-green-400">
                          Ip,a vs √v
                        </div>
                        <div className="text-xs text-muted-foreground">(Randles-Sevcik)</div>
                        <div className="mt-1">
                          m = {result.correlations.ipVsSqrtV.anodic.slope.toExponential(3)}
                        </div>
                        <div>
                          b = {result.correlations.ipVsSqrtV.anodic.intercept.toExponential(3)}
                        </div>
                        <div className="font-semibold">
                          R² = {result.correlations.ipVsSqrtV.anodic.r2.toFixed(4)}
                        </div>
                        <div className="text-xs">
                          n = {result.correlations.ipVsSqrtV.anodic.points}
                        </div>
                      </div>
                    )}
                    {result.correlations.ipVsSqrtV?.cathodic && (
                      <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded border-l-4 border-red-500">
                        <div className="font-semibold text-red-700 dark:text-red-400">
                          Ip,c vs √v
                        </div>
                        <div className="text-xs text-muted-foreground">(Randles-Sevcik)</div>
                        <div className="mt-1">
                          m = {result.correlations.ipVsSqrtV.cathodic.slope.toExponential(3)}
                        </div>
                        <div>
                          b = {result.correlations.ipVsSqrtV.cathodic.intercept.toExponential(3)}
                        </div>
                        <div className="font-semibold">
                          R² = {result.correlations.ipVsSqrtV.cathodic.r2.toFixed(4)}
                        </div>
                        <div className="text-xs">
                          n = {result.correlations.ipVsSqrtV.cathodic.points}
                        </div>
                      </div>
                    )}
                    {result.correlations.ipVsV?.anodic && (
                      <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded border-l-4 border-green-500">
                        <div className="font-semibold text-green-700 dark:text-green-400">
                          Ip,a vs v
                        </div>
                        <div className="text-xs text-muted-foreground">(Linear)</div>
                        <div className="mt-1">
                          m = {result.correlations.ipVsV.anodic.slope.toExponential(3)}
                        </div>
                        <div>b = {result.correlations.ipVsV.anodic.intercept.toExponential(3)}</div>
                        <div className="font-semibold">
                          R² = {result.correlations.ipVsV.anodic.r2.toFixed(4)}
                        </div>
                        <div className="text-xs">n = {result.correlations.ipVsV.anodic.points}</div>
                      </div>
                    )}
                    {result.correlations.ipVsV?.cathodic && (
                      <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded border-l-4 border-red-500">
                        <div className="font-semibold text-red-700 dark:text-red-400">
                          Ip,c vs v
                        </div>
                        <div className="text-xs text-muted-foreground">(Linear)</div>
                        <div className="mt-1">
                          m = {result.correlations.ipVsV.cathodic.slope.toExponential(3)}
                        </div>
                        <div>
                          b = {result.correlations.ipVsV.cathodic.intercept.toExponential(3)}
                        </div>
                        <div className="font-semibold">
                          R² = {result.correlations.ipVsV.cathodic.r2.toFixed(4)}
                        </div>
                        <div className="text-xs">
                          n = {result.correlations.ipVsV.cathodic.points}
                        </div>
                      </div>
                    )}
                    {result.correlations.logIpVsLogV?.anodic && (
                      <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded border-l-4 border-blue-500">
                        <div className="font-semibold text-blue-700 dark:text-blue-400">
                          log(Ip,a) vs log(v)
                        </div>
                        <div className="text-xs text-muted-foreground">(Power Law)</div>
                        <div className="mt-1">
                          m = {result.correlations.logIpVsLogV.anodic.slope.toFixed(4)}
                        </div>
                        <div>b = {result.correlations.logIpVsLogV.anodic.intercept.toFixed(4)}</div>
                        <div className="font-semibold">
                          R² = {result.correlations.logIpVsLogV.anodic.r2.toFixed(4)}
                        </div>
                        <div className="text-xs">
                          n = {result.correlations.logIpVsLogV.anodic.points}
                        </div>
                      </div>
                    )}
                    {result.correlations.logIpVsLogV?.cathodic && (
                      <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded border-l-4 border-red-500">
                        <div className="font-semibold text-red-700 dark:text-red-400">
                          log(Ip,c) vs log(v)
                        </div>
                        <div className="text-xs text-muted-foreground">(Power Law)</div>
                        <div className="mt-1">
                          m = {result.correlations.logIpVsLogV.cathodic.slope.toFixed(4)}
                        </div>
                        <div>
                          b = {result.correlations.logIpVsLogV.cathodic.intercept.toFixed(4)}
                        </div>
                        <div className="font-semibold">
                          R² = {result.correlations.logIpVsLogV.cathodic.r2.toFixed(4)}
                        </div>
                        <div className="text-xs">
                          n = {result.correlations.logIpVsLogV.cathodic.points}
                        </div>
                      </div>
                    )}
                    {result.correlations.epVsLnV && (
                      <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded border-l-4 border-purple-500">
                        <div className="font-semibold text-purple-700 dark:text-purple-400">
                          ΔEp vs ln(v)
                        </div>
                        <div className="text-xs text-muted-foreground">(Kinetics)</div>
                        <div className="mt-1">
                          m = {result.correlations.epVsLnV.slope.toFixed(6)}
                        </div>
                        <div>b = {result.correlations.epVsLnV.intercept.toFixed(6)}</div>
                        <div className="font-semibold">
                          R² = {result.correlations.epVsLnV.r2.toFixed(4)}
                        </div>
                        <div className="text-xs">n = {result.correlations.epVsLnV.points}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tabla de datos de archivos */}
                <div className="p-4 rounded-md bg-accent/10">
                  <h3 className="font-semibold mb-3">Detailed Files Analysis</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-accent/20">
                        <tr>
                          <th className="text-left p-2">File</th>
                          <th className="text-right p-2">v (V/s)</th>
                          <th className="text-right p-2">Ep,a (V)</th>
                          <th className="text-right p-2">Ip,a (A)</th>
                          <th className="text-right p-2">Ep,c (V)</th>
                          <th className="text-right p-2">Ip,c (A)</th>
                          <th className="text-right p-2">ΔEp (V)</th>
                          <th className="text-right p-2">Hysteresis (A·V)</th>
                          <th className="text-left p-2">Mechanism</th>
                          <th className="text-right p-2">Conf. (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.files.map((file) => (
                          <tr key={file.fileId} className="border-t hover:bg-accent/5">
                            <td className="p-2 font-medium">{file.fileName}</td>
                            <td className="text-right p-2">{file.scanRate.toFixed(4)}</td>
                            <td className="text-right p-2">
                              {file.analysis.peaks.anodic?.Ep.toFixed(4) || '-'}
                            </td>
                            <td className="text-right p-2">
                              {file.analysis.peaks.anodic?.Ip.toExponential(2) || '-'}
                            </td>
                            <td className="text-right p-2">
                              {file.analysis.peaks.cathodic?.Ep.toFixed(4) || '-'}
                            </td>
                            <td className="text-right p-2">
                              {file.analysis.peaks.cathodic?.Ip.toExponential(2) || '-'}
                            </td>
                            <td className="text-right p-2 font-semibold">
                              {file.analysis.parameters.deltaEp?.toFixed(4) || '-'}
                            </td>
                            <td className="text-right p-2">
                              {file.analysis.hysteresis.area?.toExponential(2) || '-'}
                            </td>
                            <td className="text-left p-2">
                              <span className="px-2 py-1 rounded bg-accent/50">
                                {file.analysis.diagnostics.mechanism}
                              </span>
                            </td>
                            <td className="text-right p-2">
                              {(file.analysis.diagnostics.confidence * 100).toFixed(0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Resumen Ejecutivo */}
                <div className="p-4 rounded-md bg-gradient-to-r from-accent/20 to-accent/5 border border-accent/30">
                  <h3 className="font-semibold mb-4 text-base">Executive Summary</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
                    <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded">
                      <div className="text-muted-foreground text-xs">Files Analyzed</div>
                      <div className="font-bold text-lg">{result.files.length}</div>
                    </div>
                    <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded">
                      <div className="text-muted-foreground text-xs">Avg ΔEp</div>
                      <div className="font-bold text-lg">
                        {result.averageDeltaEp?.toFixed(3) || '-'} V
                      </div>
                    </div>
                    <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded">
                      <div className="text-muted-foreground text-xs">Avg Hysteresis</div>
                      <div className="font-bold text-lg">
                        {result.averageHysteresisArea?.toExponential(2) || '-'}
                      </div>
                      <div className="text-xs text-muted-foreground">A·V</div>
                    </div>
                    <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded">
                      <div className="text-muted-foreground text-xs">Consensus</div>
                      <div className="font-bold text-lg capitalize">
                        {result.mechanismConsensus || '-'}
                      </div>
                    </div>
                    <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded">
                      <div className="text-muted-foreground text-xs">Best R²</div>
                      <div className="font-bold text-lg">
                        {Math.max(
                          result.correlations.ipVsSqrtV?.anodic?.r2 || 0,
                          result.correlations.ipVsSqrtV?.cathodic?.r2 || 0,
                          result.correlations.ipVsV?.anodic?.r2 || 0,
                          result.correlations.ipVsV?.cathodic?.r2 || 0,
                          result.correlations.logIpVsLogV?.anodic?.r2 || 0,
                          result.correlations.logIpVsLogV?.cathodic?.r2 || 0,
                          result.correlations.epVsLnV?.r2 || 0
                        ).toFixed(4)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="theory" className="space-y-4">
            <CVTheoryTabs />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export default CVMultiAnalysisDialog
