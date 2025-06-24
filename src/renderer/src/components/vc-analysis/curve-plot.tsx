import React from 'react'
import Plot from '@/components/plot/plot'

import { IProcessFile } from '@shared/models/files'
import { useVCAnalysis } from './context/use-vc-analysis'
import Decimal from 'decimal.js'
import _ from 'lodash'
import { darken, transparentize } from '@/utils/colors'
import init from 'math-lib'

interface CurvePlotProps {
  data: IProcessFile[]
  layoutTitle?: string
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

/**
 * Renders one or more curves in a Plotly.js interactive chart.
 */
export const CurvePlot: React.FC<CurvePlotProps> = ({ data, layoutTitle }) => {
  const { setSelectedPoint, selectedPoint } = useVCAnalysis()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [wasm, setWasm] = React.useState<any | null>(null)

  // Load the wasm module
  React.useEffect(() => {
    init().then(setWasm)
  }, [])

  const selectedPointData = React.useMemo(() => {
    return Object.entries(selectedPoint).flatMap(([uid, points]) => {
      if (points.length === 0) {
        return []
      }

      const originalCurve = _.find(data, ['id', uid])
      if (!originalCurve) return []
      const originalColor = originalCurve.color || '#ff0000'

      if (points.length === 1) {
        const point = points[0]
        return [
          {
            uid: `selection-marker-${uid}`,
            x: [point.x.toString()],
            y: [point.y.toString()],
            type: 'scatter' as const,
            mode: 'markers' as const,
            name: `Selected ${uid}`,
            legendgroup: originalCurve.id,
            showlegend: false,
            hoverinfo: 'x+y+name' as const,
            marker: {
              color: darken(originalColor, 20),
              size: 12,
              symbol: 'diamond' as const
            }
          }
        ]
      }

      if (points.length === 2) {
        if (originalCurve.content) {
          const [p1, p2] =
            points[0].pointIndex < points[1].pointIndex
              ? [points[0], points[1]]
              : [points[1], points[0]]

          const m = p2.y.minus(p1.y).div(p2.x.minus(p1.x))
          const c = p1.y.minus(m.times(p1.x))

          const startIndex = p1.pointIndex
          const endIndex = p2.pointIndex

          if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
            const directSegmentLength = endIndex - startIndex
            const totalPoints = originalCurve.content.length
            const otherSegmentLength = totalPoints - directSegmentLength

            const useDirectSegment = directSegmentLength <= otherSegmentLength

            const slicedContent = useDirectSegment
              ? originalCurve.content.slice(startIndex, endIndex + 1)
              : [
                  ...originalCurve.content.slice(endIndex),
                  ...originalCurve.content.slice(0, startIndex + 1)
                ]

            const xSlice = slicedContent.map((p) => p[0])
            const ySlice = slicedContent.map((p) => p[1])
            const yLineSlice = xSlice.map((x) => m.times(new Decimal(x)).plus(c))

            const polygonX = [...xSlice, ...xSlice.reverse()]
            const polygonY = [...ySlice, ...yLineSlice.reverse().map((d) => d.toString())]

            // Calculate area using wasm if available
            let area = new Decimal(0)
            if (wasm) {
              const polygonX_f64 = Float64Array.from(polygonX.map((v) => new Decimal(v).toNumber()))
              const polygonY_f64 = Float64Array.from(polygonY.map((v) => new Decimal(v).toNumber()))
              const wasmArea = wasm.calculate_polygon_area(polygonX_f64, polygonY_f64)
              area = new Decimal(wasmArea)
            }

            const fillTrace = {
              uid: 'area-fill-' + originalCurve.id,
              x: polygonX,
              y: polygonY,
              fill: 'toself' as const,
              fillcolor: transparentize(originalColor, 0.4),
              line: { color: 'transparent' },
              type: 'scatter' as const,
              name: `Area (${area.toSignificantDigits(3)}): ${originalCurve.name}`,
              legendgroup: originalCurve.id,
              showlegend: true
            }

            const secantTrace = {
              uid: 'secant-line-' + originalCurve.id,
              x: [p1.x.toString(), p2.x.toString()],
              y: [p1.y.toString(), p2.y.toString()],
              type: 'scatter' as const,
              mode: 'lines' as const,
              name: `Secant ${originalCurve.name}`,
              legendgroup: originalCurve.id,
              showlegend: false,
              line: { color: darken(originalColor, 20), width: 2.5, dash: 'dash' as const }
            }

            const pointsTrace = {
              uid: 'selection-points-markers-' + originalCurve.id,
              x: [p1.x.toString(), p2.x.toString()],
              y: [p1.y.toString(), p2.y.toString()],
              type: 'scatter' as const,
              mode: 'markers' as const,
              name: `Selected Points ${originalCurve.name}`,
              legendgroup: originalCurve.id,
              showlegend: false,
              marker: { color: darken(originalColor, 20), size: 12, symbol: 'diamond' as const }
            }
            return [fillTrace, secantTrace, pointsTrace]
          }
        }
      }
      return []
    })
  }, [data, selectedPoint, wasm])

  const onPointClick = (x: Decimal, y: Decimal, uid: string, pointIndex: number) => {
    const curve = _.find(data, ['id', uid])
    if (!curve) return

    const newPoint = {
      x,
      y,
      uid,
      pointIndex
    }

    setSelectedPoint((prev) => {
      const currentPoints = prev[uid] || []
      const updatedPoints = currentPoints.length >= 2 ? [newPoint] : [...currentPoints, newPoint]

      return {
        ...prev,
        [uid]: updatedPoints
      }
    })
  }
  const onLegendClick = (e: Readonly<Plotly.LegendClickEvent>) => {
    const eventData = e.data[e.curveNumber] as Partial<Plotly.Data> & { uid?: string }
    if (eventData.uid?.toString().includes('area-fill')) {
      const curveId = eventData.uid?.toString().replace('area-fill-', '')
      setSelectedPoint((prev) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [curveId || '']: _, ...rest } = prev
        return rest
      })
      return false
    }
    return true
  }

  const plotData = React.useMemo(() => {
    return data.map((file) => ({
      x: file.content.map((p) => p[0]),
      y: file.content.map((p) => p[1]),
      type: 'scatter',
      mode: 'lines+markers',
      uid: file.id,
      name: file.name,
      legendgroup: file.id,
      line: { color: file.color },
      hovertemplate: hovertemplate(file.name)
    }))
  }, [data])

  return (
    <Plot
      data={[...plotData, ...selectedPointData] as Plotly.Data[]}
      layout={{
        title: layoutTitle || 'Curves',
        autosize: true,
        showlegend: true,
        legend: { orientation: 'h', y: -0.2 },
        xaxis: { title: 'Potential (V)' },
        yaxis: { title: 'Current (A)' },
        hovermode: 'closest'
      }}
      onPointClick={onPointClick}
      onLegendClick={onLegendClick}
      config={{ responsive: true }}
      exportFileName="curve-plot"
      fileType={data[0]?.type || null}
    />
  )
}
