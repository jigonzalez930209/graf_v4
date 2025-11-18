import * as React from 'react'
import type { MultiCVAnalysisResult } from '@renderer/hooks/cv-analysis'

interface ExecutiveSummarySectionProps {
  result: MultiCVAnalysisResult | null
}

export const ExecutiveSummarySection: React.FC<ExecutiveSummarySectionProps> = ({ result }) => {
  if (!result) return null

  return (
    <div className="p-4 rounded-md bg-gradient-to-r from-accent/20 to-accent/5 border border-accent/30">
      <h3 className="font-semibold mb-4 text-base">Executive Summary</h3>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
        <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded">
          <div className="text-muted-foreground text-xs">Files Analyzed</div>
          <div className="font-bold text-lg">{result.files.length}</div>
        </div>
        <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded">
          <div className="text-muted-foreground text-xs">Avg ΔEp</div>
          <div className="font-bold text-lg">{result.averageDeltaEp?.toFixed(3) || '-'} V</div>
        </div>
        <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded">
          <div className="text-muted-foreground text-xs">Avg Hysteresis</div>
          <div className="font-bold text-lg">
            {result.averageHysteresisArea?.toExponential(2) || '-'}
          </div>
          <div className="text-xs text-muted-foreground">A·V</div>
        </div>
        <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded">
          <div className="text-muted-foreground text-xs">Consensus</div>
          <div className="font-bold text-lg capitalize">{result.mechanismConsensus || '-'}</div>
        </div>
        <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded">
          <div className="text-muted-foreground text-xs">Best R²</div>
          <div className="font-bold text-lg">
            {Math.max(
              result.correlations.ipVsSqrtV?.anodic?.r2 || 0,
              result.correlations.ipVsSqrtV?.cathodic?.r2 || 0,
              result.correlations.ipVsV?.anodic?.r2 || 0,
              result.correlations.ipVsV?.cathodic?.r2 || 0,
              result.correlations.logIpVsLogV?.anodic?.r2 || 0,
              result.correlations.logIpVsLogV?.cathodic?.r2 || 0,
              result.correlations.epVsLnV?.r2 || 0
            ).toFixed(4)}
          </div>
        </div>
      </div>
    </div>
  )
}
