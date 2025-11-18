import * as React from 'react'
import Plot from '../../plot/new-plot'
import { PLOTLY_CONFIG } from './constants'
import type { Data, Layout } from 'plotly.js'

interface ChartCardProps {
  title: string
  data: Data[]
  layout: Partial<Layout>
  exportFileName: string
  infoContent: React.ReactNode
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  data,
  layout,
  exportFileName,
  infoContent
}) => {
  return (
    <div className="p-2 rounded-md border bg-accent/5 mb-6">
      <h3 className="font-semibold mb-4 text-base">{title}</h3>
      <div className="flex gap-4">
        {/* Gráfico - 3/4 */}
        <div className="flex-1 lg:w-3/4 flex justify-center items-center">
          <Plot
            data={data}
            layout={layout}
            config={PLOTLY_CONFIG}
            exportFileName={exportFileName}
            isNecessaryRefreshZoom
          />
        </div>

        {/* Info - 1/4 */}
        <div className="lg:w-1/4 flex flex-col gap-2 overflow-y-auto max-h-96">{infoContent}</div>
      </div>
    </div>
  )
}
