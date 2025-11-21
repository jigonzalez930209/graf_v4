import * as React from 'react'
import { LineChartIcon } from 'lucide-react'
import Plot from '../../plot/new-plot'
import type { Data, Layout, Config } from 'plotly.js'
import { useTheme } from 'next-themes'

import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '../../ui/dialog'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Button } from '../../ui/button'
import { ProcessIcon } from './icons'
import {
  useScanRateCorrelation,
  type ScanRateCorrelationResult,
  type LinearFit
} from '@renderer/hooks/useScanRateCorrelation'
import { useData } from '@renderer/hooks/useData'
import type { IProcessFile } from '@shared/models/files'
import { defaultTheme } from '@/utils'

type ChartConfig = {
  data: Data[]
  layout: Partial<Layout>
}

type Point = {
  x: number
  y: number
  label?: string
}

type PlotAnnotation = NonNullable<Layout['annotations']>[number]

type FitStats = {
  label: string
  slope: string
  intercept: string
  rSquared: string
  points: number
  minY: string
  maxY: string
}

const COLORS = {
  positive: '#22c55e',
  negative: '#ef4444'
}

const PLOTLY_CONFIG: Partial<Config> = {
  scrollZoom: true,
  editable: true,
  displaylogo: false,
  modeBarButtonsToRemove: ['select2d', 'lasso2d'],
  toImageButtonOptions: {
    format: 'svg' as const,
    filename: 'scan-rate-analysis',
    scale: 1
  }
}

const buildBaseLayout = (theme: 'dark' | 'light'): Partial<Layout> => {
  const fontColor = theme === 'dark' ? '#e6e6e6' : '#262626'
  const bgColor = theme === 'dark' ? '#000' : '#fff'
  const gridColor = theme === 'dark' ? '#404040' : '#e6e6e6'
  const dividerColor = theme === 'dark' ? '#fff' : '#000'
  const legendBgColor = theme === 'dark' ? '#cccccc' : '#4d4d4d'
  const legendBorderColor = theme === 'dark' ? '#404040' : '#e6e6e6'
  const legendFontColor = theme === 'dark' ? '#404040' : '#e6e6e6'

  return {
    autosize: true,
    margin: { t: 20, r: 20, b: 50, l: 60 },
    paper_bgcolor: bgColor,
    plot_bgcolor: bgColor,
    font: { family: 'sans-serif', size: 12, color: fontColor },
    hovermode: 'closest',
    title: {
      text: '',
      font: { size: 18, color: fontColor }
    },
    legend: {
      x: 0.8,
      y: 1,
      traceorder: 'normal',
      bgcolor: legendBgColor,
      bordercolor: legendBorderColor,
      borderwidth: 1,
      font: {
        family: 'sans-serif',
        size: 12,
        color: legendFontColor
      }
    },
    xaxis: {
      showticklabels: true,
      zeroline: false,
      mirror: 'ticks',
      color: fontColor,
      dividercolor: dividerColor,
      gridcolor: gridColor
    },
    yaxis: {
      zeroline: false,
      color: fontColor,
      dividercolor: dividerColor,
      gridcolor: gridColor
    },
    modebar: {
      activecolor: theme === 'dark' ? '#bfbfbf' : '#404040',
      bgcolor: bgColor,
      color: theme === 'dark' ? '#bfbfbf' : '#404040',
      orientation: 'v'
    }
  }
}

const buildScatterTrace = (points: Point[], name: string, color: string): Data => ({
  x: points.map((point) => point.x),
  y: points.map((point) => point.y),
  text: points.map((point) => point.label ?? ''),
  type: 'scatter',
  mode: 'markers',
  marker: { color, size: 9, line: { color: '#0f172a0d', width: 1 } },
  name,
  hovertemplate: '%{text}<br>Scan rate: %{x:.2f} mV/s<br>Value: %{y:.4f}<extra></extra>'
})

const formatScientific = (value?: number | null, digits = 3): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return '-'
  return Number(value).toExponential(digits)
}

const buildFitStats = (label: string, fit: LinearFit | null, points: Point[]): FitStats | null => {
  if (!fit && !points.length) return null
  const yValues = points.map((p) => p.y)
  const minY = yValues.length ? Math.min(...yValues) : null
  const maxY = yValues.length ? Math.max(...yValues) : null

  return {
    label,
    slope: formatScientific(fit?.m),
    intercept: formatScientific(fit?.b),
    rSquared: formatScientific(fit?.r),
    points: points.length,
    minY: formatScientific(minY),
    maxY: formatScientific(maxY)
  }
}

const buildFitArtifacts = (
  points: Point[],
  fit: LinearFit | null,
  color: string,
  label: string
): { lineTrace?: Data; annotation?: PlotAnnotation } => {
  if (!fit || !points.length) return {}
  const xValues = points.map((p) => p.x)
  const minX = Math.min(...xValues)
  const maxX = Math.max(...xValues)
  if (!Number.isFinite(minX) || !Number.isFinite(maxX) || minX === maxX) return {}

  const lineTrace: Data = {
    x: [minX, maxX],
    y: [fit.m * minX + fit.b, fit.m * maxX + fit.b],
    type: 'scatter',
    mode: 'lines',
    name: `${label} fit`,
    line: { color, width: 2, dash: 'dash' },
    hoverinfo: 'skip'
  }

  const annotation: PlotAnnotation = {
    x: maxX,
    y: fit.m * maxX + fit.b,
    xanchor: 'right',
    yanchor: 'bottom',
    text: `y = ${formatScientific(fit.m)}x + ${formatScientific(fit.b)}<br>R² = ${formatScientific(fit.r)}`,
    showarrow: false,
    bgcolor: 'rgba(255,255,255,0.85)',
    bordercolor: color,
    borderwidth: 1,
    font: { size: 12, color: '#0f172a' },
    align: 'left'
  }

  return { lineTrace, annotation }
}

const ScanRateAnalysisDialog: React.FC = () => {
  const { data } = useData()
  const files = React.useMemo(() => data || [], [data])
  const { calculateCorrelation } = useScanRateCorrelation()
  const theme = useTheme()
  const t = defaultTheme(theme)
  const baseLayout = React.useMemo(() => buildBaseLayout(t), [t])

  const [emin, setEmin] = React.useState<string>('')
  const [emax, setEmax] = React.useState<string>('')
  const [result, setResult] = React.useState<ScanRateCorrelationResult | null>(null)

  const getSelectedTeq4Files = React.useCallback((): IProcessFile[] => {
    return files.filter((f) => f.type === 'teq4' && f.selected)
  }, [files])

  const handleCalculate = React.useCallback(() => {
    const selectedFiles = getSelectedTeq4Files()

    if (selectedFiles.length < 2) {
      alert('Please select at least two VC files (teq4)')
      return
    }

    const min = parseFloat(emin)
    const max = parseFloat(emax)

    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      alert('Please enter a valid potential range (Emin and Emax)')
      return
    }

    const potentialRange = { min, max }

    const correlation = calculateCorrelation({
      files: selectedFiles,
      potentialRange,
      getScanRate: (file) => file.voltammeter?.scanRate ?? null
    })

    setResult(correlation)
  }, [calculateCorrelation, emin, emax, getSelectedTeq4Files])

  const hasSelectedFiles = React.useMemo(
    () => getSelectedTeq4Files().length > 0,
    [getSelectedTeq4Files]
  )

  const potentialInsights = React.useMemo<{ chart: ChartConfig | null; stats: FitStats[] }>(() => {
    if (!result) return { chart: null, stats: [] }

    const positivePoints: Point[] = []
    const negativePoints: Point[] = []

    result.files.forEach((file) => {
      if (file.positivePeak) {
        positivePoints.push({
          x: file.scanRate,
          y: file.positivePeak.potential,
          label: file.fileName
        })
      }
      if (file.negativePeak) {
        negativePoints.push({
          x: file.scanRate,
          y: file.negativePeak.potential,
          label: file.fileName
        })
      }
    })

    const data: Data[] = []
    const annotations: PlotAnnotation[] = []

    if (positivePoints.length) {
      data.push(buildScatterTrace(positivePoints, 'Positive E', COLORS.positive))
      const { lineTrace, annotation } = buildFitArtifacts(
        positivePoints,
        result.positive.potential,
        COLORS.positive,
        'Positive E'
      )
      if (lineTrace) data.push(lineTrace)
      if (annotation) annotations.push(annotation)
    }

    if (negativePoints.length) {
      data.push(buildScatterTrace(negativePoints, 'Negative E', COLORS.negative))
      const { lineTrace, annotation } = buildFitArtifacts(
        negativePoints,
        result.negative.potential,
        COLORS.negative,
        'Negative E'
      )
      if (lineTrace) data.push(lineTrace)
      if (annotation) annotations.push(annotation)
    }

    const stats: FitStats[] = []
    const positiveStat = buildFitStats(
      'Positive Potential (E vs scan rate)',
      result.positive.potential,
      positivePoints
    )
    const negativeStat = buildFitStats(
      'Negative Potential (E vs scan rate)',
      result.negative.potential,
      negativePoints
    )
    if (positiveStat) stats.push(positiveStat)
    if (negativeStat) stats.push(negativeStat)

    const fontColor = baseLayout.font?.color || '#262626'
    const chart = data.length
      ? {
          data,
          layout: {
            ...baseLayout,
            xaxis: {
              ...baseLayout.xaxis,
              title: {
                text: 'Scan Rate (mV/s)',
                font: { size: 14, color: fontColor }
              }
            },
            yaxis: {
              ...baseLayout.yaxis,
              title: {
                text: 'Potential (V)',
                font: { size: 14, color: fontColor }
              }
            },
            title: {
              text: 'Potential vs Scan Rate',
              font: { size: 16, color: fontColor }
            },
            annotations
          }
        }
      : null

    return { chart, stats }
  }, [result, baseLayout])

  const currentInsights = React.useMemo<{ chart: ChartConfig | null; stats: FitStats[] }>(() => {
    if (!result) return { chart: null, stats: [] }

    const positivePoints: Point[] = []
    const negativePoints: Point[] = []

    result.files.forEach((file) => {
      if (file.positivePeak) {
        positivePoints.push({
          x: file.scanRate,
          y: file.positivePeak.current,
          label: file.fileName
        })
      }
      if (file.negativePeak) {
        negativePoints.push({
          x: file.scanRate,
          y: file.negativePeak.current,
          label: file.fileName
        })
      }
    })

    const data: Data[] = []
    const annotations: PlotAnnotation[] = []

    if (positivePoints.length) {
      data.push(buildScatterTrace(positivePoints, 'Imax', COLORS.positive))
      const { lineTrace, annotation } = buildFitArtifacts(
        positivePoints,
        result.positive.current,
        COLORS.positive,
        'Imax'
      )
      if (lineTrace) data.push(lineTrace)
      if (annotation) annotations.push(annotation)
    }

    if (negativePoints.length) {
      data.push(buildScatterTrace(negativePoints, 'Imin', COLORS.negative))
      const { lineTrace, annotation } = buildFitArtifacts(
        negativePoints,
        result.negative.current,
        COLORS.negative,
        'Imin'
      )
      if (lineTrace) data.push(lineTrace)
      if (annotation) annotations.push(annotation)
    }

    const stats: FitStats[] = []
    const positiveStat = buildFitStats(
      'Positive Current (Imax vs scan rate)',
      result.positive.current,
      positivePoints
    )
    const negativeStat = buildFitStats(
      'Negative Current (Imin vs scan rate)',
      result.negative.current,
      negativePoints
    )
    if (positiveStat) stats.push(positiveStat)
    if (negativeStat) stats.push(negativeStat)

    const fontColor = baseLayout.font?.color || '#262626'
    const chart = data.length
      ? {
          data,
          layout: {
            ...baseLayout,
            xaxis: {
              ...baseLayout.xaxis,
              title: {
                text: 'Scan Rate (mV/s)',
                font: { size: 14, color: fontColor }
              }
            },
            yaxis: {
              ...baseLayout.yaxis,
              title: {
                text: 'Current (A)',
                font: { size: 14, color: fontColor }
              }
            },
            title: {
              text: 'Current (Imax / Imin) vs Scan Rate',
              font: { size: 16, color: fontColor }
            },
            annotations
          }
        }
      : null

    return { chart, stats }
  }, [result, baseLayout])

  const potentialChart = potentialInsights.chart
  const currentChart = currentInsights.chart

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="rounded-full border-0"
          size="icon"
          title="Process scan rate"
        >
          <LineChartIcon className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="h-[90vh] max-w-[90%] w-[90%] gap-4 overflow-y-auto">
        <DialogTitle className="mb-1 flex h-6 w-full items-center gap-6 p-0">
          Scan rate vs peaks analysis
        </DialogTitle>

        <div className="flex gap-4 items-center bg-accent/20 p-2 rounded-md">
          <div className="flex items-center gap-2">
            <Label htmlFor="emin">Emin (V)</Label>
            <Input
              id="emin"
              type="number"
              className="w-28"
              value={emin}
              onChange={(e) => setEmin(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="emax">Emax (V)</Label>
            <Input
              id="emax"
              type="number"
              className="w-28"
              value={emax}
              onChange={(e) => setEmax(e.target.value)}
            />
          </div>

          <Button
            disabled={!hasSelectedFiles}
            size="icon"
            onClick={handleCalculate}
            className="border-0 bg-blue-500"
            title="Calculate scan rate correlations"
          >
            {ProcessIcon}
          </Button>
        </div>

        {result && (
          <div className="mt-4 flex flex-col gap-6">
            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {potentialChart && (
                <div className="p-1 rounded-md border">
                  <Plot
                    data={potentialChart.data}
                    layout={potentialChart.layout}
                    config={PLOTLY_CONFIG}
                    exportFileName="Potential vs Scan Rate"
                    isNecessaryRefreshZoom
                  />
                </div>
              )}

              {currentChart && (
                <div className="p-1 rounded-md border">
                  <Plot
                    data={currentChart.data}
                    layout={currentChart.layout}
                    config={PLOTLY_CONFIG}
                    exportFileName="Current (Imax / Imin) vs Scan Rate"
                    isNecessaryRefreshZoom
                  />
                </div>
              )}
            </div>
            {/* Tabla de resultados de ajuste lineal */}
            <div className="p-4 rounded-md">
              <h3 className="font-semibold mb-3">Linear Fit Results</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                {result.positive.potential && (
                  <div className="bg-white/50 p-2 rounded">
                    <div className="font-semibold text-green-700">
                      Positive Potential (E vs scan rate)
                    </div>
                    <div>m = {result.positive.potential.m.toFixed(6)}</div>
                    <div>b = {result.positive.potential.b.toFixed(6)}</div>
                    <div>R² = {result.positive.potential.r.toFixed(6)}</div>
                  </div>
                )}
                {result.positive.current && (
                  <div className="bg-white/50 p-2 rounded">
                    <div className="font-semibold text-green-700">
                      Positive Current (Imax vs scan rate)
                    </div>
                    <div>m = {result.positive.current.m.toFixed(6)}</div>
                    <div>b = {result.positive.current.b.toFixed(6)}</div>
                    <div>R² = {result.positive.current.r.toFixed(6)}</div>
                  </div>
                )}
                {result.negative.potential && (
                  <div className="bg-white/50 p-2 rounded">
                    <div className="font-semibold text-red-700">
                      Negative Potential (E vs scan rate)
                    </div>
                    <div>m = {result.negative.potential.m.toFixed(6)}</div>
                    <div>b = {result.negative.potential.b.toFixed(6)}</div>
                    <div>R² = {result.negative.potential.r.toFixed(6)}</div>
                  </div>
                )}
                {result.negative.current && (
                  <div className="bg-white/50 p-2 rounded">
                    <div className="font-semibold text-red-700">
                      Negative Current (Imin vs scan rate)
                    </div>
                    <div>m = {result.negative.current.m.toFixed(6)}</div>
                    <div>b = {result.negative.current.b.toFixed(6)}</div>
                    <div>R² = {result.negative.current.r.toFixed(6)}</div>
                  </div>
                )}
              </div>
            </div>
            {/* Tabla de datos de archivos */}
            <div className="p-4 rounded-md">
              <h3 className="font-semibold mb-3">Files Data</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-accent/20">
                    <tr>
                      <th className="text-left p-2">File</th>
                      <th className="text-right p-2">Scan Rate (mV/s)</th>
                      <th className="text-right p-2">Positive E (V)</th>
                      <th className="text-right p-2">Positive I (A)</th>
                      <th className="text-right p-2">Negative E (V)</th>
                      <th className="text-right p-2">Negative I (A)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.files.map((file) => (
                      <tr key={file.fileId} className="border-t hover:bg-accent/5">
                        <td className="p-2">{file.fileName}</td>
                        <td className="text-right p-2">{file.scanRate.toFixed(2)}</td>
                        <td className="text-right p-2">
                          {file.positivePeak?.potential.toFixed(4) || '-'}
                        </td>
                        <td className="text-right p-2">
                          {file.positivePeak?.current.toExponential(2) || '-'}
                        </td>
                        <td className="text-right p-2">
                          {file.negativePeak?.potential.toFixed(4) || '-'}
                        </td>
                        <td className="text-right p-2">
                          {file.negativePeak?.current.toExponential(2) || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ScanRateAnalysisDialog
