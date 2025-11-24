import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import {
  IFileType,
  IGrafType,
  IGraftImpedanceType,
  IStepBetweenPoints,
  IColorScheme
} from '@shared/models/graf'

interface VisualizationState {
  // State
  fileType: IFileType
  graftType: IGrafType
  impedanceType: IGraftImpedanceType
  stepBetweenPoints: IStepBetweenPoints
  lineOrPointWidth: number
  colorScheme: IColorScheme

  // Actions
  setFileType: (fileType: IFileType) => void
  setGraftType: (type: IGrafType) => void
  setImpedanceType: (type: IGraftImpedanceType) => void
  setStepBetweenPoints: (step: IStepBetweenPoints) => void
  setLineOrPointWidth: (width: number) => void
  setColorScheme: (colorScheme: IColorScheme) => void
  resetVisualization: () => void
}

const initialState = {
  fileType: null as IFileType,
  graftType: 'scatter' as IGrafType,
  impedanceType: 'Nyquist' as IGraftImpedanceType,
  stepBetweenPoints: 30 as IStepBetweenPoints,
  lineOrPointWidth: 3,
  colorScheme: '1' as IColorScheme
}

export const useVisualizationStore = create<VisualizationState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        ...initialState,

        // Actions
        setFileType: (fileType) => set({ fileType }, false, 'visualization/setFileType'),
        setGraftType: (type) => set({ graftType: type }, false, 'visualization/setGraftType'),
        setImpedanceType: (type) =>
          set({ impedanceType: type }, false, 'visualization/setImpedanceType'),
        setStepBetweenPoints: (step) =>
          set({ stepBetweenPoints: step }, false, 'visualization/setStepBetweenPoints'),

        setLineOrPointWidth: (width) =>
          set({ lineOrPointWidth: width }, false, 'visualization/setLineOrPointWidth'),

        setColorScheme: (colorScheme) =>
          set({ colorScheme }, false, 'visualization/setColorScheme'),

        resetVisualization: () => set(initialState, false, 'visualization/resetVisualization')
      }),
      {
        name: 'visualization-storage',
        partialize: (state) => ({
          graftType: state.graftType,
          impedanceType: state.impedanceType,
          stepBetweenPoints: state.stepBetweenPoints,
          lineOrPointWidth: state.lineOrPointWidth,
          colorScheme: state.colorScheme
        })
      }
    ),
    { name: 'VisualizationStore' }
  )
)
