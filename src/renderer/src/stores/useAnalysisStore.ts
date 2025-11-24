import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { FrequencyValues, ConcInputValue } from '@shared/models/graf'

interface AnalysisState {
  // State
  uniqueFrequencyCalc: FrequencyValues[]
  concInputValues: ConcInputValue[]

  // Actions
  setCalcToUniqueFrequency: (calcToUniqueFrequency: FrequencyValues[]) => void
  setSelectFilesToCalcUniqueFrequency: (inputFiles: ConcInputValue[]) => void
  clearAnalysisData: () => void
  updateConcInputValue: (id: string, value: number) => void
}

export const useAnalysisStore = create<AnalysisState>()(
  devtools(
    (set) => ({
      // Initial state
      uniqueFrequencyCalc: [],
      concInputValues: [],

      // Actions
      setCalcToUniqueFrequency: (calcToUniqueFrequency) =>
        set(
          { uniqueFrequencyCalc: calcToUniqueFrequency },
          false,
          'analysis/setCalcToUniqueFrequency'
        ),

      setSelectFilesToCalcUniqueFrequency: (inputFiles) =>
        set(
          { concInputValues: inputFiles },
          false,
          'analysis/setSelectFilesToCalcUniqueFrequency'
        ),

      clearAnalysisData: () =>
        set(
          { uniqueFrequencyCalc: [], concInputValues: [] },
          false,
          'analysis/clearAnalysisData'
        ),

      updateConcInputValue: (id, value) =>
        set(
          (state) => ({
            concInputValues: state.concInputValues.map((input) =>
              input.id === id ? { ...input, value } : input
            )
          }),
          false,
          'analysis/updateConcInputValue'
        )
    }),
    { name: 'AnalysisStore' }
  )
)
