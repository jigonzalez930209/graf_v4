/**
 * Sección de análisis de control (difusión vs adsorción)
 */

import * as React from 'react'
import { TrendingUp, Download } from 'lucide-react'
import { Button } from '../../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { analyzeControl, type ControlType } from '@renderer/hooks/cv-analysis/helpers/diagnostics'
import type { MultiCVAnalysisResult } from '@renderer/hooks/cv-analysis'

interface ControlAnalysisSectionProps {
  result: MultiCVAnalysisResult
}

export const ControlAnalysisSection: React.FC<ControlAnalysisSectionProps> = ({ result }) => {
  // Análisis para picos anódicos
  const anodicControl = React.useMemo(() => {
    const anodicCurrents = result.files
      .map((f) => f.analysis.peaks.anodic?.Ip)
      .filter((ip): ip is number => ip !== undefined)
      .map((ip) => Math.abs(ip))
    const scanRates = result.files.map((f) => f.scanRate)

    return analyzeControl(anodicCurrents, scanRates)
  }, [result])

  // Análisis para picos catódicos
  const cathodicControl = React.useMemo(() => {
    const cathodicCurrents = result.files
      .map((f) => f.analysis.peaks.cathodic?.Ip)
      .filter((ip): ip is number => ip !== undefined)
      .map((ip) => Math.abs(ip))
    const scanRates = result.files.map((f) => f.scanRate)

    return analyzeControl(cathodicCurrents, scanRates)
  }, [result])

  // Determinar control global
  const globalControl = React.useMemo((): {
    type: ControlType
    confidence: number
  } => {
    if (anodicControl.confidence > cathodicControl.confidence) {
      return { type: anodicControl.controlType, confidence: anodicControl.confidence }
    }
    return { type: cathodicControl.controlType, confidence: cathodicControl.confidence }
  }, [anodicControl, cathodicControl])

  // Exportar resultados
  const handleExport = React.useCallback(() => {
    const data = {
      global: globalControl,
      anodic: anodicControl,
      cathodic: cathodicControl
    }

    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'control_analysis.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [globalControl, anodicControl, cathodicControl])

  // Helper para badge de control
  const getControlBadge = (type: ControlType, confidence: number) => {
    const variant =
      type === 'diffusion'
        ? 'default'
        : type === 'adsorption'
          ? 'secondary'
          : type === 'mixed'
            ? 'outline'
            : 'destructive'

    return (
      <Badge variant={variant} className="text-sm">
        {type.toUpperCase()} ({(confidence * 100).toFixed(0)}%)
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Control Analysis
            </CardTitle>
            <CardDescription>Diffusion vs Adsorption</CardDescription>
          </div>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Control Global */}
        <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-lg">Global Control</h4>
            {getControlBadge(globalControl.type, globalControl.confidence)}
          </div>
          <p className="text-sm text-muted-foreground">Based on highest confidence analysis</p>
        </div>

        {/* Análisis Anódico y Catódico */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Anódico */}
          <Card className="bg-accent/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Anodic Peak
                {getControlBadge(anodicControl.controlType, anodicControl.confidence)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Ip vs √v */}
              {anodicControl.r2IpVsSqrtV !== null && (
                <div className="p-2 rounded bg-white/50 dark:bg-slate-800/50">
                  <div className="text-xs font-semibold text-muted-foreground">Ip vs √v</div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">R²:</span>
                    <span className="font-mono font-semibold">
                      {anodicControl.r2IpVsSqrtV.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Slope:</span>
                    <span className="font-mono text-xs">
                      {anodicControl.slopeIpVsSqrtV?.toExponential(3)}
                    </span>
                  </div>
                </div>
              )}

              {/* Ip vs v */}
              {anodicControl.r2IpVsV !== null && (
                <div className="p-2 rounded bg-white/50 dark:bg-slate-800/50">
                  <div className="text-xs font-semibold text-muted-foreground">Ip vs v</div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">R²:</span>
                    <span className="font-mono font-semibold">
                      {anodicControl.r2IpVsV.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Slope:</span>
                    <span className="font-mono text-xs">
                      {anodicControl.slopeIpVsV?.toExponential(3)}
                    </span>
                  </div>
                </div>
              )}

              {/* log(Ip) vs log(v) */}
              {anodicControl.r2LogIpVsLogV !== null && (
                <div className="p-2 rounded bg-white/50 dark:bg-slate-800/50">
                  <div className="text-xs font-semibold text-muted-foreground">
                    log(Ip) vs log(v)
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">R²:</span>
                    <span className="font-mono font-semibold">
                      {anodicControl.r2LogIpVsLogV.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Slope:</span>
                    <span className="font-mono text-xs">
                      {anodicControl.slopeLogIpVsLogV?.toFixed(3)}
                    </span>
                  </div>
                </div>
              )}

              {/* Notas */}
              <div className="text-xs text-muted-foreground space-y-1">
                {anodicControl.notes.map((note, idx) => (
                  <div key={idx}>• {note}</div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Catódico */}
          <Card className="bg-accent/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Cathodic Peak
                {getControlBadge(cathodicControl.controlType, cathodicControl.confidence)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Ip vs √v */}
              {cathodicControl.r2IpVsSqrtV !== null && (
                <div className="p-2 rounded bg-white/50 dark:bg-slate-800/50">
                  <div className="text-xs font-semibold text-muted-foreground">Ip vs √v</div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">R²:</span>
                    <span className="font-mono font-semibold">
                      {cathodicControl.r2IpVsSqrtV.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Slope:</span>
                    <span className="font-mono text-xs">
                      {cathodicControl.slopeIpVsSqrtV?.toExponential(3)}
                    </span>
                  </div>
                </div>
              )}

              {/* Ip vs v */}
              {cathodicControl.r2IpVsV !== null && (
                <div className="p-2 rounded bg-white/50 dark:bg-slate-800/50">
                  <div className="text-xs font-semibold text-muted-foreground">Ip vs v</div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">R²:</span>
                    <span className="font-mono font-semibold">
                      {cathodicControl.r2IpVsV.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Slope:</span>
                    <span className="font-mono text-xs">
                      {cathodicControl.slopeIpVsV?.toExponential(3)}
                    </span>
                  </div>
                </div>
              )}

              {/* log(Ip) vs log(v) */}
              {cathodicControl.r2LogIpVsLogV !== null && (
                <div className="p-2 rounded bg-white/50 dark:bg-slate-800/50">
                  <div className="text-xs font-semibold text-muted-foreground">
                    log(Ip) vs log(v)
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">R²:</span>
                    <span className="font-mono font-semibold">
                      {cathodicControl.r2LogIpVsLogV.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Slope:</span>
                    <span className="font-mono text-xs">
                      {cathodicControl.slopeLogIpVsLogV?.toFixed(3)}
                    </span>
                  </div>
                </div>
              )}

              {/* Notas */}
              <div className="text-xs text-muted-foreground space-y-1">
                {cathodicControl.notes.map((note, idx) => (
                  <div key={idx}>• {note}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interpretación */}
        <div className="mt-4 p-3 rounded-md bg-muted/50 text-sm">
          <h5 className="font-semibold mb-2">Interpretation:</h5>
          <ul className="space-y-1 text-muted-foreground">
            <li>
              • <strong>Diffusion control:</strong> Ip ∝ √v (slope log-log ≈ 0.5) - Randles-Sevcik
            </li>
            <li>
              • <strong>Adsorption control:</strong> Ip ∝ v (slope log-log ≈ 1.0) - Surface-confined
            </li>
            <li>
              • <strong>Mixed control:</strong> Intermediate behavior (0.5 &lt; slope &lt; 1.0)
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
