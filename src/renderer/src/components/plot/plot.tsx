import * as React from 'react'
import { IProcessFile } from '@shared/models/files'
import { useTheme } from 'next-themes'
import Plotly, { PlotParams } from 'react-plotly.js'

import { defaultTheme } from '@/utils'
import { useLocalStorage } from 'usehooks-ts'
import './plot.css'
import PlotlyJS from 'plotly.js-dist'

function useDebouncedResizeObserver(
  ref: React.RefObject<Element | null>,
  callback: () => void,
  delay = 100
) {
  const timeout = React.useRef<NodeJS.Timeout | null>(null)

  React.useEffect(() => {
    if (!ref.current) return
    const handleResize = () => {
      if (timeout.current) clearTimeout(timeout.current)
      timeout.current = setTimeout(callback, delay)
    }
    const observer = new ResizeObserver(handleResize)
    observer.observe(ref.current)
    return () => {
      observer.disconnect()
      if (timeout.current) clearTimeout(timeout.current)
    }
  }, [ref, callback, delay])
}

type PlotlyChartProps = {
  exportFileName: string | undefined
  fileType: IProcessFile['type'] | null
  data: PlotParams['data']
  layout: PlotParams['layout']
  config: PlotParams['config']
}

const PlotlyChart = ({ exportFileName, data, layout, config, fileType }: PlotlyChartProps) => {
  const theme = useTheme()
  const t = defaultTheme(theme)
  const plotDivRef = React.useRef<HTMLElement | null>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const [plotState, setPlotState] = useLocalStorage<{
    xRange: number[]
    yRange: number[]
    y1Range?: number[]
    legendX: number
    legendY: number
  }>('plotState', {
    xRange: [],
    yRange: [],
    y1Range: [],
    legendX: 0,
    legendY: 0
  })

  React.useEffect(() => {
    setPlotState((prev) => ({
      ...prev,
      xRange: [],
      yRange: [],
      y1Range: []
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileType])

  useDebouncedResizeObserver(
    containerRef,
    () => {
      if (plotDivRef.current) {
        PlotlyJS.Plots.resize(plotDivRef.current)
      }
    },
    100
  )

  return (
    <div
      ref={containerRef}
      className="plot-container flex w-full h-full"
      style={{ width: '100%', height: '100%' }}
    >
      <Plotly
        data={data}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler={true}
        onInitialized={(_figure, graphDiv) => {
          plotDivRef.current = graphDiv
        }}
        onUpdate={(_figure, graphDiv) => {
          plotDivRef.current = graphDiv
        }}
        layout={{
          ...layout,
          autosize: true,
          width: undefined,
          height: undefined,
          plot_bgcolor: t === 'dark' ? '#000' : '#fff',
          paper_bgcolor: t === 'dark' ? '#000' : '#fff',

          font: {
            color: t === 'dark' ? '#e6e6e6' : '#404040'
          },
          modebar: {
            activecolor: t === 'dark' ? '#bfbfbf' : '#404040',
            // add: 'drawcircle',
            bgcolor: t === 'dark' ? '#000' : '#fff',
            color: t === 'dark' ? '#bfbfbf' : '#404040',
            orientation: 'v'
          },
          legend: {
            x: plotState.legendX,
            y: plotState.legendY,
            traceorder: 'normal',
            bgcolor: t === 'dark' ? '#cccccc' : '#4d4d4d',
            bordercolor: t === 'dark' ? '#404040' : '#e6e6e6',
            borderwidth: 1,
            font: {
              family: 'sans-serif',
              size: 12,
              color: t === 'dark' ? '#404040' : '#e6e6e6'
            }
          },
          xaxis: {
            ...layout?.xaxis,
            range: plotState?.xRange,
            color: t === 'dark' ? '#e6e6e6' : '#404040',
            dividercolor: t === 'dark' ? '#fff' : '#000',
            gridcolor: t === 'dark' ? '#404040' : ' #e6e6e6'
          },
          yaxis: {
            ...layout?.yaxis,
            range: plotState?.yRange,
            color: t === 'dark' ? '#e6e6e6' : '#404040',
            dividercolor: t === 'dark' ? '#fff' : '#000',
            gridcolor: t === 'dark' ? '#404040' : ' #e6e6e6'
          },
          ...(layout?.yaxis2 && {
            yaxis2: {
              ...layout?.yaxis2,
              range: plotState?.y1Range,
              color: t === 'dark' ? '#e6e6e6' : '#404040',
              dividercolor: t === 'dark' ? '#fff' : '#000',
              gridcolor: t === 'dark' ? '#404040' : ' #e6e6e6'
            }
          })
        }}
        config={{
          ...config,
          toImageButtonOptions: {
            format: 'svg', // one of png, svg, jpeg, webp
            filename: exportFileName || 'graft',
            scale: 1 // Multiply title/legend/axis/canvas sizes by this factor
          }
        }}
        onRelayout={(e) => {
          // console.log(e)
          if ('legend.x' in e && 'legend.y' in e) {
            setPlotState((prev) => ({
              ...prev,
              legendX: Number(e['legend.x']),
              legendY: Number(e['legend.y'])
            }))
          }
          if ('xaxis.range[0]' in e && 'xaxis.range[1]' in e) {
            setPlotState((prev) => ({
              ...prev,
              xRange: [Number(e['xaxis.range[0]']), Number(e['xaxis.range[1]'])],
              ...(e['yaxis2.range[0]'] && {
                y1Range: [Number(e['yaxis2.range[0]']), Number(e['yaxis2.range[1]'])]
              })
            }))
          }
          if ('yaxis.range[0]' in e && 'yaxis.range[1]' in e) {
            setPlotState((prev) => ({
              ...prev,
              yRange: [Number(e['yaxis.range[0]']), Number(e['yaxis.range[1]'])]
            }))
          }
        }}
        onClick={(event) => {
          if (event.points && event.points.length > 0) {
            const pt = event.points[0]
            console.log('coord of point selected:', pt.x, pt.y)
          } else {
            const { offsetX, offsetY } = event.event as MouseEvent
            console.log('coord of pixel in plot area:', offsetX, offsetY)
          }
        }}
      />
    </div>
  )
}

export default PlotlyChart
