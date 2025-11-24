import * as React from 'react'
import type { MultiCVAnalysisResult } from '@renderer/hooks/cv-analysis'

interface TablesSectionProps {
  result: MultiCVAnalysisResult | null
}

export const TablesSection: React.FC<TablesSectionProps> = ({ result }) => {
  if (!result) return null

  return (
    <div className="space-y-4">
      {/* Tabla de datos de archivos */}
      <div className="p-4 rounded-md bg-accent/10">
        <h3 className="font-semibold mb-3">Detailed Files Analysis</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-accent/20">
              <tr>
                <th className="text-left p-2">File</th>
                <th className="text-right p-2">v (V/s)</th>
                <th className="text-right p-2">Ep,a (V)</th>
                <th className="text-right p-2">Ip,a (A)</th>
                <th className="text-right p-2">Ep,c (V)</th>
                <th className="text-right p-2">Ip,c (A)</th>
                <th className="text-right p-2">ΔEp (V)</th>
                <th className="text-right p-2">Hysteresis (A·V)</th>
                <th className="text-left p-2">Mechanism</th>
                <th className="text-right p-2">Conf. (%)</th>
              </tr>
            </thead>
            <tbody>
              {result.files.map((file) => (
                <tr key={file.fileId} className="border-t hover:bg-accent/5">
                  <td className="p-2 font-medium">{file.fileName}</td>
                  <td className="text-right p-2">{file.scanRate.toFixed(4)}</td>
                  <td className="text-right p-2">
                    {file.analysis.peaks.anodic?.Ep.toFixed(4) || '-'}
                  </td>
                  <td className="text-right p-2">
                    {file.analysis.peaks.anodic?.Ip.toExponential(2) || '-'}
                  </td>
                  <td className="text-right p-2">
                    {file.analysis.peaks.cathodic?.Ep.toFixed(4) || '-'}
                  </td>
                  <td className="text-right p-2">
                    {file.analysis.peaks.cathodic?.Ip.toExponential(2) || '-'}
                  </td>
                  <td className="text-right p-2 font-semibold">
                    {file.analysis.parameters.deltaEp?.toFixed(4) || '-'}
                  </td>
                  <td className="text-right p-2">
                    {file.analysis.hysteresis.area?.toExponential(2) || '-'}
                  </td>
                  <td className="text-left p-2">
                    <span className="px-2 py-1 rounded bg-accent/50">
                      {file.analysis.diagnostics.mechanism}
                    </span>
                  </td>
                  <td className="text-right p-2">
                    {(file.analysis.diagnostics.confidence * 100).toFixed(0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
