import React from 'react'
import Plot from '@/components/plot/plot'

import { IProcessFile } from '@shared/models/files'

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
  return (
    <Plot
      data={data.map((curve) => ({
        x: curve.content.map((c) => c[0]),
        y: curve.content.map((c) => c[1]),
        type: 'scatter',
        mode: 'lines+markers',
        name: curve.name,
        hovertemplate: hovertemplate(curve.name),
        marker: { color: curve.color || undefined },
        line: { color: curve.color || undefined }
      }))}
      layout={{
        title: layoutTitle || 'Curves',
        autosize: true,
        margin: { l: 40, r: 10, b: 40, t: 40 },
        legend: {
          x: 1,
          y: 0,
          traceorder: 'normal',
          bgcolor: '#cccccc',
          bordercolor: '#404040',
          borderwidth: 1,
          font: {
            family: 'sans-serif',
            size: 12,
            color: '#404040'
          }
        },
        xaxis: { title: 'X' },
        yaxis: { title: 'Y' },
        hovermode: 'closest'
      }}
      config={{ responsive: true }}
      exportFileName="curve-plot"
      fileType="teq4"
    />
  )
}
