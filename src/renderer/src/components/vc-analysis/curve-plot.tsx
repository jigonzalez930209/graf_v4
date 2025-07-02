import React from 'react'
import Plot from '@/components/plot/plot'

import { IProcessFile } from '@shared/models/files'
import { useVCAnalysis } from './context/use-vc-analysis'
import Decimal from 'decimal.js'
import _ from 'lodash'
import { darken, transparentize } from '@/utils/colors'
import init from 'math-lib'
import { calculatePeakInfo } from '@/utils/peak-height'
import { calculatePolygonArea } from '@renderer/utils/math'

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
const toSafeDecimal = (value: unknown): Decimal => {
  if (value === null || value === undefined) return new Decimal(0)
  const sValue = String(value).trim()
  if (sValue === '') return new Decimal(0)
  if (!isFinite(Number(sValue))) return new Decimal(0)

  try {
    return new Decimal(sValue)
  } catch (error) {
    console.error('Error converting to Decimal:', value, error)
    return new Decimal(0)
  }
}

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
      try {
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
          try {
            if (originalCurve.content) {
              const [p1, p2] =
                points[0].pointIndex < points[1].pointIndex
                  ? [points[0], points[1]]
                  : [points[1], points[0]]

              // If the same point is selected twice, do not proceed with calculation.
              if (p1.pointIndex === p2.pointIndex) {
                return []
              }

              const m = p2.y.minus(p1.y).div(p2.x.minus(p1.x))
              const c = p1.y.minus(m.times(p1.x))

              const startIndex = p1.pointIndex
              const endIndex = p2.pointIndex

              if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
                const directSegmentLength = endIndex - startIndex
                const totalPoints = originalCurve.content.length
                const otherSegmentLength = totalPoints - directSegmentLength

                const useDirectSegment = directSegmentLength <= otherSegmentLength

                const slicedContent = (
                  useDirectSegment
                    ? originalCurve.content.slice(startIndex, endIndex + 1)
                    : [
                        ...originalCurve.content.slice(endIndex),
                        ...originalCurve.content.slice(0, startIndex + 1)
                      ]
                ).filter((p) => {
                  if (!p || p.length !== 2) return false
                  const x = p[0]
                  const y = p[1]
                  // Ensure that x and y are not null/undefined, are non-empty strings, and are valid, finite numbers.
                  return (
                    x != null &&
                    y != null &&
                    x.toString().trim() !== '' &&
                    y.toString().trim() !== '' &&
                    isFinite(Number(x)) &&
                    isFinite(Number(y))
                  )
                })

                const xSlice = slicedContent.map((p) => p[0])
                const ySlice = slicedContent.map((p) => p[1])
                const yLineSlice = xSlice.map((x) => m.times(toSafeDecimal(x)).plus(c))

                const polygonX = [...xSlice, ...xSlice.reverse()]
                const polygonY = [...ySlice, ...yLineSlice.reverse()]

                // Calculate area and peak height using wasm if available
                let area = new Decimal(0)
                let peakHeight = new Decimal(0)
                let peakX = new Decimal(0)
                let peakY = new Decimal(0)
                let peakIndex = -1

                if (wasm) {
                  const flatCoords = new Float64Array(polygonX.length * 2)
                  for (let i = 0; i < polygonX.length; i++) {
                    flatCoords[i * 2] = toSafeDecimal(polygonX[i]).toNumber()
                    flatCoords[i * 2 + 1] = toSafeDecimal(polygonY[i]).toNumber()
                  }

                  console.log('Points being processed:', { p1, p2 })
                  console.log('Polygon coordinates:', { polygonX, polygonY })
                  console.log('Flattened coordinates:', flatCoords)
                  console.log('Polygon size:', polygonX.length)
                  console.log('First few polygon points:', {
                    point0: { x: flatCoords[0], y: flatCoords[1] },
                    point1: { x: flatCoords[2], y: flatCoords[3] },
                    point2: { x: flatCoords[4], y: flatCoords[5] }
                  })

                  // Calculate area using TypeScript method
                  const tsArea = calculatePolygonArea(
                    polygonX.map((x) => toSafeDecimal(x)),
                    polygonY.map((y) => toSafeDecimal(y))
                  )
                  console.log('Area calculated by TypeScript:', tsArea.toString())

                  // Use the TypeScript calculated area instead of WebAssembly
                  area = tsArea

                  // Still use WebAssembly for other metrics
                  const metrics = wasm.process_curve_data(flatCoords)
                  console.log('Raw metrics from wasm:', metrics)

                  // Calculate peak height using our TypeScript function
                  // Convert slicedContent to the expected format
                  const typedContent: [string | number, string | number][] = slicedContent.map(
                    (point) => [point[0], point[1]]
                  )
                  const peakInfo = calculatePeakInfo(typedContent, p1, p2)
                  peakHeight = peakInfo.peakHeight
                  peakX = peakInfo.peakX
                  peakY = peakInfo.peakY
                  peakIndex = peakInfo.peakIndex

                  console.log('Final values:', {
                    area: area.toString(),
                    peakHeight: peakHeight.toString(),
                    peakX: peakX.toString(),
                    peakY: peakY.toString(),
                    peakIndex
                  })
                }

                const fillTrace = {
                  uid: 'area-fill-' + originalCurve.id,
                  x: polygonX,
                  y: polygonY,
                  fill: 'toself' as const,
                  fillcolor: transparentize(originalColor, 0.4),
                  line: { color: 'transparent' },
                  type: 'scatter' as const,
                  name: `Area: ${area.toNumber().toFixed(6)}, Peak Height: ${peakHeight.toNumber().toFixed(6)} | ${originalCurve.name}`,
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

                const peakMarker = {
                  uid: 'peak-marker-' + originalCurve.id,
                  x: [peakX.toString()],
                  y: [peakY.toString()],
                  type: 'scatter' as const,
                  mode: 'markers' as const,
                  name: `Peak (Height: ${peakHeight.toNumber().toFixed(6)})`,
                  legendgroup: originalCurve.id,
                  showlegend: true,
                  marker: {
                    color: darken(originalColor, 30),
                    size: 14,
                    symbol: 'circle' as const,
                    line: { width: 1, color: '#ffffff' }
                  }
                }
                // Add peak marker if we found a valid peak
                const traces = [fillTrace, secantTrace, pointsTrace, peakMarker]

                return traces
              }
            }
          } catch (error) {
            console.error(`Error processing points for curve ${uid}:`, error)
            return [] // Return empty array to prevent crash
          }
        }
        return []
      } catch (error) {
        console.error(`Failed to process selection for curve ${uid}:`, error)
        return [] // Return an empty array on error to prevent crashing the render.
      }
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
