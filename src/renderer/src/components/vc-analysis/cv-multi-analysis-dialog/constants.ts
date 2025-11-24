import type { Data, Layout, Config } from 'plotly.js'

export type ChartConfig = {
  data: Data[]
  layout: Partial<Layout>
}

export const COLORS = {
  positive: '#22c55e',
  negative: '#ef4444',
  neutral: '#3b82f6',
  linear: '#ef4444'
}

export const PLOTLY_CONFIG: Partial<Config> = {
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

export const buildBaseLayout = (theme: 'dark' | 'light'): Partial<Layout> => {
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
