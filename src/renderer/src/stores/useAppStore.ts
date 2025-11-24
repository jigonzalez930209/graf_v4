import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { IPlatform, IProgressEvent } from '@shared/models/graf'
import { UpdateInfo } from 'electron-updater'

interface AppState {
  // State
  platform: IPlatform
  updateContent: UpdateInfo | null
  progressEvent: IProgressEvent

  // Actions
  setPlatform: (platform: IPlatform) => void
  setUpdateContent: (updateContent: UpdateInfo | null) => void
  setProgressEvent: (event: IProgressEvent) => void
  clearProgressEvent: () => void
}

const initialProgressEvent: IProgressEvent = {
  message: '',
  name: '',
  type: undefined,
  timeOut: 0
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        platform: null,
        updateContent: null,
        progressEvent: initialProgressEvent,

        // Actions
        setPlatform: (platform) => set({ platform }, false, 'app/setPlatform'),

        setUpdateContent: (updateContent) => set({ updateContent }, false, 'app/setUpdateContent'),

        setProgressEvent: (event) => set({ progressEvent: event }, false, 'app/setProgressEvent'),

        clearProgressEvent: () =>
          set({ progressEvent: initialProgressEvent }, false, 'app/clearProgressEvent')
      }),
      {
        name: 'app-storage',
        partialize: (state) => ({
          platform: state.platform
        })
      }
    ),
    { name: 'AppStore' }
  )
)
