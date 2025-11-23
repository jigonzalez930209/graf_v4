import * as React from 'react'
import { useTheme } from 'next-themes'

import { Button } from '../../ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs'
import { useMultiCVAnalysis, type MultiCVAnalysisResult } from '@renderer/hooks/cv-analysis'
import { useData } from '@renderer/hooks/useData'
import type { IProcessFile } from '@shared/models/files'
import { defaultTheme } from '@/utils'
import CVTheoryTabs from '../components/cv-theory-tabs'
import { buildBaseLayout } from './constants'
import { ChartsSection } from './charts-section'
import { TablesSection } from './tables-section'
import { LavironKineticsSection } from './laviron-kinetics-section'
import { ExecutiveSummarySection } from './executive-summary-section'
import { RandlesSevcikSection } from './randles-sevcik-section'
import { NicholsonSection } from './nicholson-section'
import { ControlAnalysisSection } from './control-analysis-section'

const CVMultiAnalysisPanel: React.FC = () => {
  const { data } = useData()
  const files = React.useMemo(() => data || [], [data])
  const theme = useTheme()
  const t = defaultTheme(theme)
  const baseLayout = React.useMemo(() => buildBaseLayout(t), [t])

  const [result, setResult] = React.useState<MultiCVAnalysisResult | null>(null)
  const [includeOrigin, setIncludeOrigin] = React.useState(false)

  const selectedCVFiles = React.useMemo((): IProcessFile[] => {
    return files.filter((f) => f.type === 'teq4' && f.selected)
  }, [files])

  // Usar el hook aquí en el componente
  const analysisResult = useMultiCVAnalysis(
    selectedCVFiles.length >= 2
      ? {
          files: selectedCVFiles,
          config: { scanRate: 0.1 },
          includeOrigin
        }
      : null
  )

  const handleAnalyze = React.useCallback(() => {
    if (selectedCVFiles.length < 2) {
      alert('Please select at least two CV files (teq4)')
      return
    }

    if (analysisResult) {
      setResult(analysisResult)
    }
  }, [selectedCVFiles.length, analysisResult])

  const hasSelectedFiles = React.useMemo(() => selectedCVFiles.length >= 2, [selectedCVFiles])

  return (
    <div className="h-full flex flex-col gap-4 overflow-y-auto p-4">
      <div className="mb-1 flex h-6 w-full items-center gap-6 p-0 font-semibold text-lg">
        Multi-CV Analysis (Multiple Scan Rates)
      </div>

      <div className="flex gap-4 items-center bg-accent/20 p-2 rounded-md">
        <Button
          disabled={!hasSelectedFiles}
          size="sm"
          onClick={handleAnalyze}
          className="bg-blue-500 hover:bg-blue-600"
          title="Analyze selected CV files"
        >
          Analyze
        </Button>
        <span className="text-sm text-muted-foreground">
          {selectedCVFiles.length} file(s) selected
        </span>
        <div className="flex items-center gap-2 ml-auto">
          <input
            type="checkbox"
            id="includeOrigin"
            checked={includeOrigin}
            onChange={(e) => setIncludeOrigin(e.target.checked)}
            className="w-4 h-4 cursor-pointer"
          />
          <label htmlFor="includeOrigin" className="text-sm cursor-pointer">
            Include origin (0,0) in fit
          </label>
        </div>
      </div>

      <Tabs defaultValue="analysis" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="analysis">Analysis Results</TabsTrigger>
          <TabsTrigger value="theory">Theoretical Foundation</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-4">
          {result && (
            <div className="space-y-4">
              {/* Gráficos de correlaciones y Laviron Analysis */}
              <ChartsSection result={result} baseLayout={baseLayout} />

              {/* Randles-Sevcik Analysis (Diffusion Coefficient) */}
              <RandlesSevcikSection result={result} includeOrigin={includeOrigin} />

              {/* Nicholson k⁰ Analysis */}
              <NicholsonSection result={result} />

              {/* Control Analysis (Diffusion vs Adsorption) */}
              <ControlAnalysisSection result={result} />

              {/* Tablas de resultados */}
              <TablesSection result={result} />

              {/* Laviron Kinetics Analysis */}
              <LavironKineticsSection result={result} />

              {/* Executive Summary */}
              <ExecutiveSummarySection result={result} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="theory" className="space-y-4">
          <CVTheoryTabs />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default CVMultiAnalysisPanel
