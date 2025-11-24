/**
 * Sección de análisis Randles-Sevcik con cálculo de D
 * Muestra tabla de resultados y permite exportar
 */

import * as React from 'react'
import { Download, Info } from 'lucide-react'
import { Button } from '../../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import {
  calculateDFromMultipleScans,
  calculateDConfidenceInterval,
  type RandlesSevcikParams,
  type DiffusionCoefficientResult
} from '@renderer/hooks/cv-analysis/helpers/randles'
import type { MultiCVAnalysisResult } from '@renderer/hooks/cv-analysis'

interface RandlesSevcikSectionProps {
  result: MultiCVAnalysisResult
  includeOrigin: boolean
}

export const RandlesSevcikSection: React.FC<RandlesSevcikSectionProps> = ({
  result,
  includeOrigin
}) => {
  // Parámetros experimentales con valores por defecto
  const [params, setParams] = React.useState<RandlesSevcikParams>({
    n: 1,
    area: 0.071, // cm² (típico para electrodo de 3mm diámetro)
    concentration: 1e-3, // 1 mM
    temperature: 298.15 // 25°C
  })

  // Calcular D para picos anódicos y catódicos
  const anodicResult = React.useMemo((): DiffusionCoefficientResult | null => {
    const anodicCurrents = result.files
      .map((f) => f.analysis.peaks.anodic?.Ip)
      .filter((ip): ip is number => ip !== undefined)
    const scanRates = result.files.map((f) => f.scanRate)

    if (anodicCurrents.length < 2) return null

    return calculateDFromMultipleScans(anodicCurrents, scanRates, params, includeOrigin)
  }, [result, params, includeOrigin])

  const cathodicResult = React.useMemo((): DiffusionCoefficientResult | null => {
    const cathodicCurrents = result.files
      .map((f) => f.analysis.peaks.cathodic?.Ip)
      .filter((ip): ip is number => ip !== undefined)
      .map((ip) => Math.abs(ip)) // Usar valor absoluto
    const scanRates = result.files.map((f) => f.scanRate)

    if (cathodicCurrents.length < 2) return null

    return calculateDFromMultipleScans(cathodicCurrents, scanRates, params, includeOrigin)
  }, [result, params, includeOrigin])

  // Calcular intervalos de confianza
  const anodicCI = React.useMemo(() => {
    if (!anodicResult) return null
    return calculateDConfidenceInterval(
      anodicResult.D,
      anodicResult.confidence,
      anodicResult.dataPoints
    )
  }, [anodicResult])

  const cathodicCI = React.useMemo(() => {
    if (!cathodicResult) return null
    return calculateDConfidenceInterval(
      cathodicResult.D,
      cathodicResult.confidence,
      cathodicResult.dataPoints
    )
  }, [cathodicResult])

  // Exportar resultados a CSV
  const handleExport = React.useCallback(() => {
    const headers = [
      'File',
      'Scan Rate (V/s)',
      'Ip,a (A)',
      'Ip,c (A)',
      'sqrt(v)',
      'D_anodic (cm²/s)',
      'D_cathodic (cm²/s)'
    ]

    const rows = result.files.map((file) => {
      const sqrtV = Math.sqrt(file.scanRate)
      return [
        file.fileName,
        file.scanRate.toExponential(3),
        file.analysis.peaks.anodic?.Ip.toExponential(3) || 'N/A',
        file.analysis.peaks.cathodic?.Ip.toExponential(3) || 'N/A',
        sqrtV.toFixed(4),
        anodicResult?.D.toExponential(3) || 'N/A',
        cathodicResult?.D.toExponential(3) || 'N/A'
      ]
    })

    // Agregar resumen al final
    rows.push([])
    rows.push(['Summary', '', '', '', '', '', ''])
    rows.push(['D (anodic)', '', '', '', '', anodicResult?.D.toExponential(3) || 'N/A', ''])
    rows.push(['D (cathodic)', '', '', '', '', '', cathodicResult?.D.toExponential(3) || 'N/A'])
    rows.push(['R² (anodic)', '', '', '', '', anodicResult?.confidence.toFixed(4) || 'N/A', ''])
    rows.push(['R² (cathodic)', '', '', '', '', '', cathodicResult?.confidence.toFixed(4) || 'N/A'])

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'randles_sevcik_analysis.csv'
    a.click()
    URL.revokeObjectURL(url)
  }, [result, anodicResult, cathodicResult])

  return (
    <div className="space-y-4">
      {/* Parámetros experimentales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Experimental Parameters
          </CardTitle>
          <CardDescription>
            Enter experimental parameters to calculate diffusion coefficient (D)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="n">n (electrons)</Label>
              <Input
                id="n"
                type="number"
                min="1"
                step="1"
                value={params.n}
                onChange={(e) => setParams({ ...params, n: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area">Area (cm²)</Label>
              <Input
                id="area"
                type="number"
                min="0"
                step="0.001"
                value={params.area}
                onChange={(e) => setParams({ ...params, area: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="concentration">Conc. (M)</Label>
              <Input
                id="concentration"
                type="number"
                min="0"
                step="0.0001"
                value={params.concentration}
                onChange={(e) =>
                  setParams({ ...params, concentration: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="temperature">Temp. (K)</Label>
              <Input
                id="temperature"
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

      {/* Resultados de D */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Diffusion Coefficient (D)</CardTitle>
              <CardDescription>Calculated from Ip vs √v regression</CardDescription>
            </div>
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Anodic */}
            <Card className="bg-accent/20">
              <CardHeader>
                <CardTitle className="text-lg">Anodic Peak</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {anodicResult ? (
                  <>
                    <div className="flex justify-between">
                      <span className="font-semibold">D:</span>
                      <span className="font-mono">{anodicResult.D.toExponential(3)} cm²/s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">R²:</span>
                      <span className="font-mono">{anodicResult.confidence.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Slope:</span>
                      <span className="font-mono">{anodicResult.slope.toExponential(3)}</span>
                    </div>
                    {anodicCI && (
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>95% CI:</span>
                        <span className="font-mono">
                          [{anodicCI.lower.toExponential(2)}, {anodicCI.upper.toExponential(2)}]
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Insufficient data for anodic peak</p>
                )}
              </CardContent>
            </Card>

            {/* Cathodic */}
            <Card className="bg-accent/20">
              <CardHeader>
                <CardTitle className="text-lg">Cathodic Peak</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {cathodicResult ? (
                  <>
                    <div className="flex justify-between">
                      <span className="font-semibold">D:</span>
                      <span className="font-mono">{cathodicResult.D.toExponential(3)} cm²/s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">R²:</span>
                      <span className="font-mono">{cathodicResult.confidence.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Slope:</span>
                      <span className="font-mono">{cathodicResult.slope.toExponential(3)}</span>
                    </div>
                    {cathodicCI && (
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>95% CI:</span>
                        <span className="font-mono">
                          [{cathodicCI.lower.toExponential(2)}, {cathodicCI.upper.toExponential(2)}]
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Insufficient data for cathodic peak
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tabla detallada por archivo */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead className="text-right">v (V/s)</TableHead>
                <TableHead className="text-right">√v</TableHead>
                <TableHead className="text-right">Ip,a (A)</TableHead>
                <TableHead className="text-right">Ip,c (A)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.files.map((file, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{file.fileName}</TableCell>
                  <TableCell className="text-right font-mono">
                    {file.scanRate.toExponential(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {Math.sqrt(file.scanRate).toFixed(4)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {file.analysis.peaks.anodic?.Ip.toExponential(3) || 'N/A'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {file.analysis.peaks.cathodic?.Ip.toExponential(3) || 'N/A'}
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
