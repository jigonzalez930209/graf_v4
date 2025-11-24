import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface UIState {
  // State
  drawerOpen: boolean
  activeTab: 'visualization' | 'vc-analysis' | 'frequency'
  loading: boolean

  // Actions
  setDrawerOpen: (open: boolean) => void
  toggleDrawer: () => void
  setActiveTab: (tab: 'visualization' | 'vc-analysis' | 'frequency') => void
  setLoading: (loading: boolean) => void
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        drawerOpen: true,
        activeTab: 'visualization',
        loading: false,

        // Actions
        setDrawerOpen: (open) => set({ drawerOpen: open }, false, 'ui/setDrawerOpen'),

        toggleDrawer: () =>
          set((state) => ({ drawerOpen: !state.drawerOpen }), false, 'ui/toggleDrawer'),

        setActiveTab: (tab) => set({ activeTab: tab }, false, 'ui/setActiveTab'),

        setLoading: (loading) => set({ loading }, false, 'ui/setLoading')
      }),
      {
        name: 'ui-storage',
        // Solo persistimos el tab activo (lightweight config)
        partialize: (state) => ({
          activeTab: state.activeTab
        })
      }
    ),
    { name: 'UIStore' }
  )
)
