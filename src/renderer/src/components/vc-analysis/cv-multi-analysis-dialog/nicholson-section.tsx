/**
 * Sección de análisis de Nicholson k⁰
 * Para sistemas quasi-reversibles
 */

import * as React from 'react'
import { Download, Info, AlertTriangle } from 'lucide-react'
import { Button } from '../../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Alert, AlertDescription } from '../../ui/alert'
import {
  performNicholsonAnalysis,
  calculateK0Statistics,
  analyzeDeltaEpVsScanRate,
  classifyKineticRegime
} from '@renderer/hooks/cv-analysis/helpers/nicholson'
import type { MultiCVAnalysisResult } from '@renderer/hooks/cv-analysis'

interface NicholsonSectionProps {
  result: MultiCVAnalysisResult
  diffusionCoefficient?: number // D calculado de Randles-Sevcik
}

export const NicholsonSection: React.FC<NicholsonSectionProps> = ({
  result,
  diffusionCoefficient
}) => {
  // Parámetros con valores por defecto
  const [params, setParams] = React.useState({
    n: 1,
    D: diffusionCoefficient || 1e-5, // cm²/s (valor típico)
    temperature: 298.15 // K
  })

  // Actualizar D cuando cambie el prop
  React.useEffect(() => {
    if (diffusionCoefficient) {
      setParams((prev) => ({ ...prev, D: diffusionCoefficient }))
    }
  }, [diffusionCoefficient])

  // Extraer datos
  const deltaEps = React.useMemo(
    () =>
      result.files
        .map((f) => {
          const anodic = f.analysis.peaks.anodic?.Ep
          const cathodic = f.analysis.peaks.cathodic?.Ep
          if (anodic && cathodic) {
            return Math.abs(anodic - cathodic)
          }
          return null
        })
        .filter((d): d is number => d !== null),
    [result]
  )

  const scanRates = React.useMemo(() => result.files.map((f) => f.scanRate), [result])

  // Análisis de ΔEp vs v
  const deltaEpAnalysis = React.useMemo(
    () => analyzeDeltaEpVsScanRate(deltaEps, scanRates),
    [deltaEps, scanRates]
  )

  // Realizar análisis de Nicholson
  const nicholsonResults = React.useMemo(
    () => performNicholsonAnalysis(deltaEps, scanRates, params.D, params.n, params.temperature),
    [deltaEps, scanRates, params]
  )

  // Estadísticas de k⁰
  const k0Stats = React.useMemo(() => calculateK0Statistics(nicholsonResults), [nicholsonResults])

  // Verificar aplicabilidad
  const isApplicable = React.useMemo(() => {
    if (deltaEps.length === 0) return false
    const avgDeltaEp = deltaEps.reduce((a, b) => a + b, 0) / deltaEps.length
    const regime = classifyKineticRegime(avgDeltaEp, params.n)
    return regime === 'quasi-reversible'
  }, [deltaEps, params.n])

  // Exportar resultados
  const handleExport = React.useCallback(() => {
    const data = {
      parameters: params,
      results: nicholsonResults,
      statistics: k0Stats,
      deltaEpAnalysis
    }

    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'nicholson_analysis.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [nicholsonResults, k0Stats, deltaEpAnalysis, params])

  if (deltaEps.length < 2) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Insufficient data for Nicholson analysis. Need at least 2 files with both anodic and
          cathodic peaks.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {/* Mensaje de aplicabilidad */}
      {!isApplicable && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> Nicholson method is most accurate for quasi-reversible systems
            (ΔEp ≈ 70-200 mV). Your system appears to be{' '}
            {classifyKineticRegime(deltaEps.reduce((a, b) => a + b, 0) / deltaEps.length, params.n)}
            .
          </AlertDescription>
        </Alert>
      )}

      {/* Análisis de ΔEp vs v */}
      {deltaEpAnalysis.regression && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>ΔEp vs Scan Rate:</strong> {deltaEpAnalysis.message}
            <br />
            <span className="text-xs font-mono">
              Slope: {deltaEpAnalysis.regression.slope.toExponential(3)} V/(V/s), R²:{' '}
              {deltaEpAnalysis.regression.r2.toFixed(4)}
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Parámetros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Parameters
          </CardTitle>
          <CardDescription>Enter parameters for Nicholson k⁰ calculation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="n-nicholson">n (electrons)</Label>
              <Input
                id="n-nicholson"
                type="number"
                min="1"
                step="1"
                value={params.n}
                onChange={(e) => setParams({ ...params, n: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="D-nicholson">D (cm²/s)</Label>
              <Input
                id="D-nicholson"
                type="number"
                min="0"
                step="0.00001"
                value={params.D}
                onChange={(e) => setParams({ ...params, D: parseFloat(e.target.value) || 1e-5 })}
              />
              {diffusionCoefficient && (
                <p className="text-xs text-muted-foreground">
                  From Randles-Sevcik: {diffusionCoefficient.toExponential(3)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="temp-nicholson">Temp. (K)</Label>
              <Input
                id="temp-nicholson"
                type="number"
                min="0"
                step="1"
                value={params.temperature}
                onChange={(e) =>
                  setParams({ ...params, temperature: parseFloat(e.target.value) || 298.15 })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Nicholson k⁰ Analysis</CardTitle>
              <CardDescription>Standard rate constant from ΔEp</CardDescription>
            </div>
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Estadísticas */}
          {k0Stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <Card className="bg-accent/20">
                <CardContent className="pt-4">
                  <div className="text-sm text-muted-foreground">Mean k⁰</div>
                  <div className="text-lg font-mono font-semibold">
                    {k0Stats.mean.toExponential(3)}
                  </div>
                  <div className="text-xs text-muted-foreground">cm/s</div>
                </CardContent>
              </Card>
              <Card className="bg-accent/20">
                <CardContent className="pt-4">
                  <div className="text-sm text-muted-foreground">Std Dev</div>
                  <div className="text-lg font-mono font-semibold">
                    {k0Stats.stdDev.toExponential(3)}
                  </div>
                  <div className="text-xs text-muted-foreground">cm/s</div>
                </CardContent>
              </Card>
              <Card className="bg-accent/20">
                <CardContent className="pt-4">
                  <div className="text-sm text-muted-foreground">Range</div>
                  <div className="text-sm font-mono">
                    {k0Stats.min.toExponential(2)} - {k0Stats.max.toExponential(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">cm/s</div>
                </CardContent>
              </Card>
              <Card className="bg-accent/20">
                <CardContent className="pt-4">
                  <div className="text-sm text-muted-foreground">Data Points</div>
                  <div className="text-lg font-semibold">{k0Stats.count}</div>
                  <div className="text-xs text-muted-foreground">measurements</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tabla detallada */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead className="text-right">v (V/s)</TableHead>
                <TableHead className="text-right">ΔEp (mV)</TableHead>
                <TableHead className="text-right">ψ</TableHead>
                <TableHead className="text-right">k⁰ (cm/s)</TableHead>
                <TableHead>Regime</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nicholsonResults.map((res, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">
                    {result.files[idx]?.fileName || `File ${idx + 1}`}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {res.scanRate.toExponential(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {(res.deltaEp * 1000).toFixed(1)}
                  </TableCell>
                  <TableCell className="text-right font-mono">{res.psi.toFixed(3)}</TableCell>
                  <TableCell className="text-right font-mono">{res.k0.toExponential(3)}</TableCell>
                  <TableCell>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        res.regime === 'reversible'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : res.regime === 'quasi-reversible'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}
                    >
                      {res.regime}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
