import { useContext } from 'react'
import { VCAnalysisContext, VCAnalysisContextType } from './vc-analysis-context'

const useVCAnalysis = (): VCAnalysisContextType => {
  const context = useContext(VCAnalysisContext)
  if (!context) {
    throw new Error('useVCAnalysis must be used within a VCAnalysisProvider')
  }
  return context
}

export { useVCAnalysis }
