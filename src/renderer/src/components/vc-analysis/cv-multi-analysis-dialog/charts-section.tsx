import * as React from 'react'
import type { MultiCVAnalysisResult } from '@renderer/hooks/cv-analysis'
import type { Layout } from 'plotly.js'
import { useTheme } from 'next-themes'
import { defaultTheme } from '@/utils'
import { RandlesSevcikChart } from './charts/randles-sevcik-chart'
import { DeltaEpChart } from './charts/delta-ep-chart'
import { LinearChart } from './charts/linear-chart'
import { LogLogChart } from './charts/log-log-chart'
import { LavironAnalysisChart } from './charts/laviron-analysis-chart'

interface ChartsSectionProps {
  result: MultiCVAnalysisResult | null
  baseLayout: Partial<Layout>
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({ result, baseLayout }) => {
  const theme = useTheme()
  const t = defaultTheme(theme)

  if (!result) return null

  return (
    <div className="space-y-4">
      <RandlesSevcikChart result={result} baseLayout={baseLayout} theme={t} />
      <DeltaEpChart result={result} baseLayout={baseLayout} theme={t} />
      <LinearChart result={result} baseLayout={baseLayout} theme={t} />
      <LogLogChart result={result} baseLayout={baseLayout} theme={t} />
      <LavironAnalysisChart result={result} baseLayout={baseLayout} theme={t} />
    </div>
  )
}
