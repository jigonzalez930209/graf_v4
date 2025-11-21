/**
 * Enhanced CV Curve Plot con capas visuales inteligentes
 * - Raw data (datos originales)
 * - Smoothed data (datos suavizados)
 * - Peak markers (marcadores de picos anódico/catódico)
 * - Hysteresis shading (sombreado de histéresis)
 */

import React from 'react'
import Plot from '@/components/plot/plot'
import { IProcessFile } from '@shared/models/files'
import { transparentize, darken } from '@/utils/colors'
import type { Peak } from '@renderer/hooks/cv-analysis'
import { applyMovingAverage } from '@renderer/hooks/cv-analysis/helpers/smoothing'
import { Switch } from '../../ui/switch'
import { Label } from '../../ui/label'
import { Slider } from '../../ui/slider'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'

interface EnhancedCurvePlotProps {
  data: IProcessFile[]
  layoutTitle?: string
  showControls?: boolean
  peaksData?: Record<string, { anodic?: Peak; cathodic?: Peak }> // Opcional: picos pre-calculados
}

interface LayerVisibility {
  raw: boolean
  smoothed: boolean
  peaks: boolean
  hysteresis: boolean
}

const hovertemplate = (name: string) => {
  return `
  <b>${name}</b>
  <br><br>
  Point Number: %{pointNumber}<br>
  <br>
  %{yaxis.title.text}: %{y}<br>
  %{xaxis.title.text}: %{x}<br>
  <extra></extra>
`
}

export const EnhancedCurvePlot: React.FC<EnhancedCurvePlotProps> = ({
  data,
  layoutTitle,
  showControls = true,
  peaksData
}) => {
  // Estado para controlar visibilidad de capas
  const [layers, setLayers] = React.useState<LayerVisibility>({
    raw: true,
    smoothed: false,
    peaks: peaksData !== undefined, // Habilitado si hay datos de picos
    hysteresis: false
  })

  // Parámetros de suavizado
  const [smoothingWindow, setSmoothingWindow] = React.useState(5)

  // Construir trazas de Plotly
  const plotData = React.useMemo(() => {
    const traces: Plotly.Data[] = []

    data.forEach((file) => {
      const potential = file.content.map(([e]) => parseFloat(String(e)))
      const current = file.content.map(([, i]) => parseFloat(String(i)))
      const color = file.color || '#1f77b4'
      const peaks = peaksData?.[file.id]

      // 1. Traza raw (datos originales)
      if (layers.raw) {
        traces.push({
          x: potential,
          y: current,
          type: 'scatter',
          mode: 'lines',
          name: file.name,
          line: { color, width: 2 },
          legendgroup: file.id,
          showlegend: true,
          hovertemplate: hovertemplate(file.name)
        })
      }

      // 2. Traza smoothed (datos suavizados)
      if (layers.smoothed) {
        const smoothedCurrent = applyMovingAverage(current, smoothingWindow)
        traces.push({
          x: potential,
          y: smoothedCurrent,
          type: 'scatter',
          mode: 'lines',
          name: `${file.name} (smoothed)`,
          line: { color: darken(color, 20), width: 2, dash: 'dot' },
          legendgroup: file.id,
          showlegend: layers.raw, // Solo mostrar en leyenda si raw también está visible
          hovertemplate: hovertemplate(`${file.name} (smoothed)`)
        })
      }

      // 3. Marcadores de picos
      if (layers.peaks && peaks) {
        // Pico anódico
        if (peaks.anodic) {
          traces.push({
            x: [peaks.anodic.Ep],
            y: [peaks.anodic.Ip],
            type: 'scatter',
            mode: 'markers',
            name: `Anodic Peak`,
            marker: {
              color: '#ff4444',
              size: 12,
              symbol: 'triangle-up',
              line: { width: 2, color: '#ffffff' }
            },
            legendgroup: file.id,
            showlegend: true,
            hovertemplate: `<b>Anodic Peak</b><br>Ep: %{x:.4f} V<br>Ip: %{y:.6e} A<extra></extra>`
          })
        }

        // Pico catódico
        if (peaks.cathodic) {
          traces.push({
            x: [peaks.cathodic.Ep],
            y: [peaks.cathodic.Ip],
            type: 'scatter',
            mode: 'markers',
            name: `Cathodic Peak`,
            marker: {
              color: '#4444ff',
              size: 12,
              symbol: 'triangle-down',
              line: { width: 2, color: '#ffffff' }
            },
            legendgroup: file.id,
            showlegend: true,
            hovertemplate: `<b>Cathodic Peak</b><br>Ep: %{x:.4f} V<br>Ip: %{y:.6e} A<extra></extra>`
          })
        }
      }

      // 4. Sombreado de histéresis (área entre curva y línea base)
      if (layers.hysteresis) {
        // Crear polígono para el área de histéresis
        const forwardSweep = potential.slice(0, Math.floor(potential.length / 2))
        const forwardCurrent = current.slice(0, Math.floor(current.length / 2))
        const reverseSweep = potential.slice(Math.floor(potential.length / 2)).reverse()
        const reverseCurrent = current.slice(Math.floor(current.length / 2)).reverse()

        traces.push({
          x: [...forwardSweep, ...reverseSweep],
          y: [...forwardCurrent, ...reverseCurrent],
          fill: 'toself',
          fillcolor: transparentize(color, 0.7),
          line: { color: 'transparent' },
          type: 'scatter',
          name: `Hysteresis`,
          legendgroup: file.id,
          showlegend: true,
          hoverinfo: 'skip'
        })
      }
    })

    return traces
  }, [data, layers, smoothingWindow, peaksData])

  return (
    <div className="space-y-4">
      {/* Controles de visualización */}
      {showControls && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Visualization Layers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Raw data */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="layer-raw"
                  checked={layers.raw}
                  onCheckedChange={(checked) => setLayers({ ...layers, raw: checked })}
                />
                <Label htmlFor="layer-raw" className="text-sm">
                  Raw Data
                </Label>
              </div>

              {/* Smoothed data */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="layer-smoothed"
                  checked={layers.smoothed}
                  onCheckedChange={(checked) => setLayers({ ...layers, smoothed: checked })}
                />
                <Label htmlFor="layer-smoothed" className="text-sm">
                  Smoothed
                </Label>
              </div>

              {/* Peak markers */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="layer-peaks"
                  checked={layers.peaks}
                  onCheckedChange={(checked) => setLayers({ ...layers, peaks: checked })}
                />
                <Label htmlFor="layer-peaks" className="text-sm">
                  Peak Markers
                </Label>
              </div>

              {/* Hysteresis */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="layer-hysteresis"
                  checked={layers.hysteresis}
                  onCheckedChange={(checked) => setLayers({ ...layers, hysteresis: checked })}
                />
                <Label htmlFor="layer-hysteresis" className="text-sm">
                  Hysteresis
                </Label>
              </div>
            </div>

            {/* Smoothing window slider */}
            {layers.smoothed && (
              <div className="mt-4 space-y-2">
                <Label htmlFor="smoothing-window" className="text-sm">
                  Smoothing Window: {smoothingWindow}
                </Label>
                <Slider
                  id="smoothing-window"
                  min={3}
                  max={21}
                  step={2}
                  value={[smoothingWindow]}
                  onValueChange={([value]) => setSmoothingWindow(value)}
                  className="w-full"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Plot */}
      <Plot
        data={plotData}
        layout={{
          title: layoutTitle || 'Enhanced CV Plot',
          autosize: true,
          showlegend: true,
          legend: { orientation: 'h', y: -0.2 },
          xaxis: { title: 'Potential (V)' },
          yaxis: { title: 'Current (A)' },
          hovermode: 'closest'
        }}
        config={{ responsive: true }}
        exportFileName="enhanced-cv-plot"
        fileType={data[0]?.type || null}
      />
    </div>
  )
}
