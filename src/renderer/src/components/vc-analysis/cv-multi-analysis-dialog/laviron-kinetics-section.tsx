import * as React from 'react'
import { Download } from 'lucide-react'
import { Button } from '../../ui/button'
import type { MultiCVAnalysisResult } from '@renderer/hooks/cv-analysis'
import { performLavironAnalysis } from '@renderer/hooks/cv-analysis/helpers/laviron'

interface LavironKineticsSectionProps {
  result: MultiCVAnalysisResult | null
}

export const LavironKineticsSection: React.FC<LavironKineticsSectionProps> = ({ result }) => {
  // Calcular análisis completo de Laviron con ks
  const anodicAnalysis = React.useMemo(() => {
    if (!result?.files) return null
    const scanRates = result.files.map((f) => f.scanRate)
    const anodicPotentials = result.files
      .map((f) => f.analysis.peaks.anodic?.Ep)
      .filter((ep): ep is number => ep !== undefined)

    if (anodicPotentials.length < 3) return null
    return performLavironAnalysis(scanRates, anodicPotentials, 1, 298.15, true)
  }, [result])

  const cathodicAnalysis = React.useMemo(() => {
    if (!result?.files) return null
    const scanRates = result.files.map((f) => f.scanRate)
    const cathodicPotentials = result.files
      .map((f) => f.analysis.peaks.cathodic?.Ep)
      .filter((ep): ep is number => ep !== undefined)

    if (cathodicPotentials.length < 3) return null
    return performLavironAnalysis(scanRates, cathodicPotentials, 1, 298.15, false)
  }, [result])

  const handleExport = React.useCallback(() => {
    const data = {
      anodic: anodicAnalysis,
      cathodic: cathodicAnalysis,
      formalPotential: result?.laviron?.formalPotential
    }

    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'laviron_kinetics.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [anodicAnalysis, cathodicAnalysis, result])

  if (!result?.laviron) return null

  return (
    <div className="p-4 rounded-md bg-gradient-to-r from-orange-50 to-orange-50/50 dark:from-orange-900/20 dark:to-orange-900/10 border border-orange-200 dark:border-orange-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-base text-orange-900 dark:text-orange-100">
          Laviron Kinetics Analysis
        </h3>
        <Button onClick={handleExport} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
        {result.laviron.criticalScanRateAnodic && (
          <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded border-l-4 border-green-500">
            <div className="font-semibold text-green-700 dark:text-green-400 mb-2">
              Anodic Critical Scan Rate (νc,a)
            </div>
            <div className="text-xs space-y-1">
              <div>
                <span className="text-muted-foreground">νc,a:</span>{' '}
                <span className="font-mono">
                  {result.laviron.criticalScanRateAnodic.vCritical.toExponential(3)} V/s
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Index:</span>{' '}
                <span className="font-mono">
                  {result.laviron.criticalScanRateAnodic.indexCritical}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>{' '}
                <span
                  className={
                    result.laviron.criticalScanRateAnodic.isFound
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-orange-600 dark:text-orange-400'
                  }
                >
                  {result.laviron.criticalScanRateAnodic.isFound ? '✓ Found' : '⚠ Estimated'}
                </span>
              </div>
              <div className="text-xs text-muted-foreground italic">
                {result.laviron.criticalScanRateAnodic.debugInfo}
              </div>
            </div>
          </div>
        )}

        {result.laviron.criticalScanRateCathodic && (
          <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded border-l-4 border-red-500">
            <div className="font-semibold text-red-700 dark:text-red-400 mb-2">
              Cathodic Critical Scan Rate (νc,c)
            </div>
            <div className="text-xs space-y-1">
              <div>
                <span className="text-muted-foreground">νc,c:</span>{' '}
                <span className="font-mono">
                  {result.laviron.criticalScanRateCathodic.vCritical.toExponential(3)} V/s
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Index:</span>{' '}
                <span className="font-mono">
                  {result.laviron.criticalScanRateCathodic.indexCritical}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>{' '}
                <span
                  className={
                    result.laviron.criticalScanRateCathodic.isFound
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-orange-600 dark:text-orange-400'
                  }
                >
                  {result.laviron.criticalScanRateCathodic.isFound ? '✓ Found' : '⚠ Estimated'}
                </span>
              </div>
              <div className="text-xs text-muted-foreground italic">
                {result.laviron.criticalScanRateCathodic.debugInfo}
              </div>
            </div>
          </div>
        )}

        {result.laviron.formalPotential !== undefined && (
          <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded border-l-4 border-blue-500">
            <div className="font-semibold text-blue-700 dark:text-blue-400 mb-2">
              Formal Potential (E°)
            </div>
            <div className="text-xs space-y-1">
              <div>
                <span className="text-muted-foreground">E°:</span>{' '}
                <span className="font-mono">{result.laviron.formalPotential.toFixed(4)} V</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Average of anodic and cathodic peak potentials
              </div>
            </div>
          </div>
        )}

        {result.laviron.transferCoefficientAnodic !== undefined && (
          <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded border-l-4 border-purple-500">
            <div className="font-semibold text-purple-700 dark:text-purple-400 mb-2">
              Transfer Coefficient (α,a)
            </div>
            <div className="text-xs space-y-1">
              <div>
                <span className="text-muted-foreground">α,a:</span>{' '}
                <span className="font-mono">
                  {result.laviron.transferCoefficientAnodic.toFixed(3)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">From Ep,a vs ln(v) slope</div>
            </div>
          </div>
        )}

        {result.laviron.transferCoefficientCathodic !== undefined && (
          <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded border-l-4 border-indigo-500">
            <div className="font-semibold text-indigo-700 dark:text-indigo-400 mb-2">
              Transfer Coefficient (α,c)
            </div>
            <div className="text-xs space-y-1">
              <div>
                <span className="text-muted-foreground">α,c:</span>{' '}
                <span className="font-mono">
                  {result.laviron.transferCoefficientCathodic.toFixed(3)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">From Ep,c vs ln(v) slope</div>
            </div>
          </div>
        )}

        {/* Análisis completo anódico con ks */}
        {anodicAnalysis && (
          <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded border-l-4 border-emerald-500">
            <div className="font-semibold text-emerald-700 dark:text-emerald-400 mb-2">
              Anodic Kinetics (Complete)
            </div>
            <div className="text-xs space-y-1">
              <div>
                <span className="text-muted-foreground">α,a:</span>{' '}
                <span className="font-mono">{anodicAnalysis.alpha.toFixed(3)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">ks:</span>{' '}
                <span className="font-mono">{anodicAnalysis.ks.toExponential(3)} cm/s</span>
              </div>
              <div>
                <span className="text-muted-foreground">E0&apos;:</span>{' '}
                <span className="font-mono">{anodicAnalysis.E0.toFixed(4)} V</span>
              </div>
              <div>
                <span className="text-muted-foreground">R²:</span>{' '}
                <span className="font-mono">{anodicAnalysis.r2.toFixed(4)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Análisis completo catódico con ks */}
        {cathodicAnalysis && (
          <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded border-l-4 border-rose-500">
            <div className="font-semibold text-rose-700 dark:text-rose-400 mb-2">
              Cathodic Kinetics (Complete)
            </div>
            <div className="text-xs space-y-1">
              <div>
                <span className="text-muted-foreground">α,c:</span>{' '}
                <span className="font-mono">{cathodicAnalysis.alpha.toFixed(3)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">ks:</span>{' '}
                <span className="font-mono">{cathodicAnalysis.ks.toExponential(3)} cm/s</span>
              </div>
              <div>
                <span className="text-muted-foreground">E0&apos;:</span>{' '}
                <span className="font-mono">{cathodicAnalysis.E0.toFixed(4)} V</span>
              </div>
              <div>
                <span className="text-muted-foreground">R²:</span>{' '}
                <span className="font-mono">{cathodicAnalysis.r2.toFixed(4)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
