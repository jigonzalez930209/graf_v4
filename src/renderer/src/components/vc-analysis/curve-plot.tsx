import React from 'react'
import Plot from '@/components/plot/plot'

import { IProcessFile } from '@shared/models/files'

interface CurvePlotProps {
  data: IProcessFile[]
  layoutTitle?: string
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
        marker: { color: curve.color || undefined },
        line: { color: curve.color || undefined }
      }))}
      layout={{
        title: layoutTitle || 'Curves',
        autosize: true,
        margin: { l: 40, r: 10, b: 40, t: 40 },
        legend: {},
        xaxis: { title: 'X' },
        yaxis: { title: 'Y' }
      }}
      config={{ responsive: true }}
      exportFileName="curve-plot"
      fileType="teq4"
    />
  )
}
