/**
 * Peak Inspector UI
 * Componente para inspeccionar y ajustar manualmente los picos detectados
 */

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Settings, RefreshCw, Download } from 'lucide-react'
import type { Peak } from '@renderer/hooks/cv-analysis'

interface PeakInspectorProps {
  fileName: string
  anodicPeak?: Peak
  cathodicPeak?: Peak
  onPeakUpdate?: (type: 'anodic' | 'cathodic', peak: Peak) => void
  onReanalyze?: (config: SmoothingConfig) => void
}

interface SmoothingConfig {
  windowSize: number
  polyOrder: number
  prominence: number
  minDistance: number
}

export const PeakInspector: React.FC<PeakInspectorProps> = ({
  fileName,
  anodicPeak,
  cathodicPeak,
  onPeakUpdate,
  onReanalyze
}) => {
  // Estado para configuración de suavizado
  const [config, setConfig] = React.useState<SmoothingConfig>({
    windowSize: 5,
    polyOrder: 2,
    prominence: 0.1,
    minDistance: 10
  })

  // Estado para edición manual de picos
  const [editMode, setEditMode] = React.useState(false)
  const [editedAnodic, setEditedAnodic] = React.useState<Peak | undefined>(anodicPeak)
  const [editedCathodic, setEditedCathodic] = React.useState<Peak | undefined>(cathodicPeak)

  // Actualizar cuando cambien los picos
  React.useEffect(() => {
    setEditedAnodic(anodicPeak)
    setEditedCathodic(cathodicPeak)
  }, [anodicPeak, cathodicPeak])

  // Calcular parámetros derivados
  const deltaEp = React.useMemo(() => {
    if (editedAnodic && editedCathodic) {
      return Math.abs(editedAnodic.Ep - editedCathodic.Ep)
    }
    return null
  }, [editedAnodic, editedCathodic])

  const ipRatio = React.useMemo(() => {
    if (editedAnodic && editedCathodic && editedCathodic.Ip !== 0) {
      return Math.abs(editedAnodic.Ip / editedCathodic.Ip)
    }
    return null
  }, [editedAnodic, editedCathodic])

  // Handlers
  const handleReanalyze = () => {
    if (onReanalyze) {
      onReanalyze(config)
    }
  }

  const handleSaveChanges = () => {
    if (onPeakUpdate) {
      if (editedAnodic) onPeakUpdate('anodic', editedAnodic)
      if (editedCathodic) onPeakUpdate('cathodic', editedCathodic)
    }
    setEditMode(false)
  }

  const handleExport = () => {
    const data = {
      file: fileName,
      anodicPeak: editedAnodic,
      cathodicPeak: editedCathodic,
      deltaEp,
      ipRatio,
      config
    }

    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `peak_inspector_${fileName}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Peak Inspector</CardTitle>
            <CardDescription>{fileName}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={() => setEditMode(!editMode)}
              variant={editMode ? 'default' : 'outline'}
              size="sm"
            >
              <Settings className="h-4 w-4 mr-2" />
              {editMode ? 'Editing' : 'Edit'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tabla de picos */}
        <div>
          <h4 className="font-semibold mb-2 text-sm">Detected Peaks</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Ep (V)</TableHead>
                <TableHead className="text-right">Ip (A)</TableHead>
                <TableHead className="text-right">Prominence</TableHead>
                <TableHead className="text-right">Index</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Pico anódico */}
              {editedAnodic && (
                <TableRow>
                  <TableCell>
                    <Badge variant="default" className="bg-red-500">
                      Anodic
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {editMode ? (
                      <Input
                        type="number"
                        step="0.0001"
                        value={editedAnodic.Ep}
                        onChange={(e) =>
                          setEditedAnodic({ ...editedAnodic, Ep: parseFloat(e.target.value) })
                        }
                        className="w-24 h-8 text-xs"
                      />
                    ) : (
                      <span className="font-mono">{editedAnodic.Ep.toFixed(4)}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editMode ? (
                      <Input
                        type="number"
                        step="0.000001"
                        value={editedAnodic.Ip}
                        onChange={(e) =>
                          setEditedAnodic({ ...editedAnodic, Ip: parseFloat(e.target.value) })
                        }
                        className="w-28 h-8 text-xs"
                      />
                    ) : (
                      <span className="font-mono">{editedAnodic.Ip.toExponential(3)}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(editedAnodic as any).prominence?.toFixed(6) || '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {editedAnodic.index}
                  </TableCell>
                </TableRow>
              )}

              {/* Pico catódico */}
              {editedCathodic && (
                <TableRow>
                  <TableCell>
                    <Badge variant="default" className="bg-blue-500">
                      Cathodic
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {editMode ? (
                      <Input
                        type="number"
                        step="0.0001"
                        value={editedCathodic.Ep}
                        onChange={(e) =>
                          setEditedCathodic({ ...editedCathodic, Ep: parseFloat(e.target.value) })
                        }
                        className="w-24 h-8 text-xs"
                      />
                    ) : (
                      <span className="font-mono">{editedCathodic.Ep.toFixed(4)}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editMode ? (
                      <Input
                        type="number"
                        step="0.000001"
                        value={editedCathodic.Ip}
                        onChange={(e) =>
                          setEditedCathodic({ ...editedCathodic, Ip: parseFloat(e.target.value) })
                        }
                        className="w-28 h-8 text-xs"
                      />
                    ) : (
                      <span className="font-mono">{editedCathodic.Ip.toExponential(3)}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(editedCathodic as any).prominence?.toFixed(6) || '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {editedCathodic.index}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {editMode && (
            <div className="mt-2 flex justify-end">
              <Button onClick={handleSaveChanges} size="sm">
                Save Changes
              </Button>
            </div>
          )}
        </div>

        {/* Parámetros derivados */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-accent/20">
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">ΔEp</div>
              <div className="text-lg font-mono font-semibold">
                {deltaEp !== null ? `${(deltaEp * 1000).toFixed(1)} mV` : '-'}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-accent/20">
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Ip,a / Ip,c</div>
              <div className="text-lg font-mono font-semibold">
                {ipRatio !== null ? ipRatio.toFixed(3) : '-'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configuración de detección */}
        <div>
          <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Detection Configuration
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="windowSize" className="text-xs">
                Window Size
              </Label>
              <Input
                id="windowSize"
                type="number"
                min="3"
                max="21"
                step="2"
                value={config.windowSize}
                onChange={(e) => setConfig({ ...config, windowSize: parseInt(e.target.value) })}
                className="h-8"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="polyOrder" className="text-xs">
                Poly Order
              </Label>
              <Input
                id="polyOrder"
                type="number"
                min="1"
                max="5"
                value={config.polyOrder}
                onChange={(e) => setConfig({ ...config, polyOrder: parseInt(e.target.value) })}
                className="h-8"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prominence" className="text-xs">
                Prominence
              </Label>
              <Input
                id="prominence"
                type="number"
                min="0.01"
                max="1"
                step="0.01"
                value={config.prominence}
                onChange={(e) => setConfig({ ...config, prominence: parseFloat(e.target.value) })}
                className="h-8"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minDistance" className="text-xs">
                Min Distance
              </Label>
              <Input
                id="minDistance"
                type="number"
                min="1"
                max="100"
                value={config.minDistance}
                onChange={(e) => setConfig({ ...config, minDistance: parseInt(e.target.value) })}
                className="h-8"
              />
            </div>
          </div>
          <div className="mt-3">
            <Button onClick={handleReanalyze} variant="outline" size="sm" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Re-analyze with New Config
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
