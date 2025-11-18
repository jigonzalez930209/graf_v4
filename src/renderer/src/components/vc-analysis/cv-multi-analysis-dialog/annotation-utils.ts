import type { Layout } from 'plotly.js'
import { COLORS } from './constants'

export type AnnotationType = 'anodic' | 'cathodic' | 'neutral'
export type ChartType = 'randles-sevcik' | 'linear' | 'log-log' | 'delta-ep' | 'laviron'

interface AnnotationConfig {
  x: number
  y: number
  text: string
  xanchor?: 'left' | 'center' | 'right'
  yanchor?: 'top' | 'middle' | 'bottom'
  type: AnnotationType
  theme: 'dark' | 'light'
  chartType: ChartType
}

/**
 * Obtiene el color de borde según el tipo de gráfico
 */
const getChartBorderColor = (chartType: ChartType): string => {
  const chartColors: Record<ChartType, string> = {
    'randles-sevcik': '#3b82f6', // blue-500
    linear: '#8b5cf6', // violet-500
    'log-log': '#06b6d4', // cyan-500
    'delta-ep': '#ec4899', // pink-500
    laviron: '#f59e0b' // amber-500
  }
  return chartColors[chartType]
}

/**
 * Obtiene los colores de anotación según el tipo y tema
 */
const getAnnotationColors = (
  type: AnnotationType,
  theme: 'dark' | 'light'
): { bgColor: string; textColor: string; borderColor: string } => {
  const textColor = theme === 'dark' ? '#f5f5f5' : '#0f172a'

  if (type === 'anodic') {
    return {
      bgColor: theme === 'dark' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)',
      textColor,
      borderColor: COLORS.positive
    }
  } else if (type === 'cathodic') {
    return {
      bgColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
      textColor,
      borderColor: COLORS.negative
    }
  } else {
    return {
      bgColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
      textColor,
      borderColor: COLORS.neutral
    }
  }
}

/**
 * Crea una anotación estilizada para gráficos
 */
export const createAnnotation = (
  config: AnnotationConfig
): NonNullable<Partial<Layout>['annotations']>[number] => {
  const { x, y, text, xanchor = 'right', yanchor = 'bottom', type, theme, chartType } = config
  const { bgColor, textColor } = getAnnotationColors(type, theme)
  const chartBorderColor = getChartBorderColor(chartType)

  return {
    x,
    y,
    xanchor,
    yanchor,
    text,
    showarrow: false,
    bgcolor: bgColor,
    bordercolor: chartBorderColor,
    borderwidth: 2,
    borderpad: 4,
    font: { size: 10, color: textColor, family: 'monospace' },
    align: 'left'
  }
}

/**
 * Crea una anotación de pendiente para gráficos bilineales
 */
export const createSlopeAnnotation = (
  x: number,
  y: number,
  slope: number,
  type: AnnotationType,
  theme: 'dark' | 'light',
  chartType: ChartType
): NonNullable<Partial<Layout>['annotations']>[number] => {
  const { bgColor, textColor } = getAnnotationColors(type, theme)
  const chartBorderColor = getChartBorderColor(chartType)

  return {
    x,
    y,
    xanchor: 'center',
    yanchor: type === 'anodic' ? 'bottom' : 'top',
    text: `m = ${slope.toFixed(4)}`,
    showarrow: false,
    bgcolor: bgColor,
    bordercolor: chartBorderColor,
    borderwidth: 2,
    borderpad: 3,
    font: { size: 9, color: textColor, family: 'monospace' },
    align: 'center'
  }
}
