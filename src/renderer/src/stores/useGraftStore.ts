import { useFilesStore } from './useFilesStore'
import { useVisualizationStore } from './useVisualizationStore'
import { useUIStore } from './useUIStore'
import { useNotificationsStore } from './useNotificationsStore'
import { useAnalysisStore } from './useAnalysisStore'
import { useAppStore } from './useAppStore'

/**
 * Hook combinado que proporciona acceso a todos los stores de Zustand
 * Este hook facilita la migración desde el Context API al proporcionar
 * una interfaz similar a la que se usaba con el GrafContext
 *
 * @example
 * ```tsx
 * const { files, setFiles, drawerOpen, setDrawerOpen } = useGraftStore()
 * ```
 */
export const useGraftStore = () => {
  // Files Store
  const files = useFilesStore((state) => state.files)
  const csvFileColum = useFilesStore((state) => state.csvFileColum)
  const selectedFilesCount = useFilesStore((state) => state.selectedFilesCount)
  const isFilesGrouped = useFilesStore((state) => state.isFilesGrouped)
  const setFiles = useFilesStore((state) => state.setFiles)
  const setFile = useFilesStore((state) => state.setFile)
  const addFiles = useFilesStore((state) => state.addFiles)
  const updateFile = useFilesStore((state) => state.updateFile)
  const removeFile = useFilesStore((state) => state.removeFile)
  const clearFiles = useFilesStore((state) => state.clearFiles)
  const setSelectedColumns = useFilesStore((state) => state.setSelectedColumns)
  const updateCSVfileColumn = useFilesStore((state) => state.updateCSVfileColumn)
  const setSelectedFilesCount = useFilesStore((state) => state.setSelectedFilesCount)
  const setIsFilesGrouped = useFilesStore((state) => state.setIsFilesGrouped)

  // Visualization Store
  const fileType = useVisualizationStore((state) => state.fileType)
  const graftType = useVisualizationStore((state) => state.graftType)
  const impedanceType = useVisualizationStore((state) => state.impedanceType)
  const stepBetweenPoints = useVisualizationStore((state) => state.stepBetweenPoints)
  const lineOrPointWidth = useVisualizationStore((state) => state.lineOrPointWidth)
  const colorScheme = useVisualizationStore((state) => state.colorScheme)
  const setFileType = useVisualizationStore((state) => state.setFileType)
  const setGraftType = useVisualizationStore((state) => state.setGraftType)
  const setImpedanceType = useVisualizationStore((state) => state.setImpedanceType)
  const setStepBetweenPoints = useVisualizationStore((state) => state.setStepBetweenPoints)
  const setLineOrPointWidth = useVisualizationStore((state) => state.setLineOrPointWidth)
  const setColorScheme = useVisualizationStore((state) => state.setColorScheme)
  const resetVisualization = useVisualizationStore((state) => state.resetVisualization)

  // UI Store
  const drawerOpen = useUIStore((state) => state.drawerOpen)
  const activeTab = useUIStore((state) => state.activeTab)
  const loading = useUIStore((state) => state.loading)
  const setDrawerOpen = useUIStore((state) => state.setDrawerOpen)
  const toggleDrawer = useUIStore((state) => state.toggleDrawer)
  const setActiveTab = useUIStore((state) => state.setActiveTab)
  const setLoading = useUIStore((state) => state.setLoading)

  // Notifications Store
  const notifications = useNotificationsStore((state) => state.notifications)
  const setNotification = useNotificationsStore((state) => state.setNotification)
  const clearNotification = useNotificationsStore((state) => state.clearNotification)
  const showSuccess = useNotificationsStore((state) => state.showSuccess)
  const showError = useNotificationsStore((state) => state.showError)
  const showWarning = useNotificationsStore((state) => state.showWarning)
  const showInfo = useNotificationsStore((state) => state.showInfo)

  // Analysis Store
  const uniqueFrequencyCalc = useAnalysisStore((state) => state.uniqueFrequencyCalc)
  const concInputValues = useAnalysisStore((state) => state.concInputValues)
  const setCalcToUniqueFrequency = useAnalysisStore((state) => state.setCalcToUniqueFrequency)
  const setSelectFilesToCalcUniqueFrequency = useAnalysisStore(
    (state) => state.setSelectFilesToCalcUniqueFrequency
  )
  const clearAnalysisData = useAnalysisStore((state) => state.clearAnalysisData)
  const updateConcInputValue = useAnalysisStore((state) => state.updateConcInputValue)

  // App Store
  const platform = useAppStore((state) => state.platform)
  const updateContent = useAppStore((state) => state.updateContent)
  const progressEvent = useAppStore((state) => state.progressEvent)
  const setPlatform = useAppStore((state) => state.setPlatform)
  const setUpdateContent = useAppStore((state) => state.setUpdateContent)
  const setProgressEvent = useAppStore((state) => state.setProgressEvent)
  const clearProgressEvent = useAppStore((state) => state.clearProgressEvent)

  return {
    // Files
    files,
    csvFileColum,
    selectedFilesCount,
    isFilesGrouped,
    setFiles,
    setFile,
    addFiles,
    updateFile,
    removeFile,
    clearFiles,
    setSelectedColumns,
    updateCSVfileColumn,
    setSelectedFilesCount,
    setIsFilesGrouped,

    // Visualization
    fileType,
    graftType,
    impedanceType,
    stepBetweenPoints,
    lineOrPointWidth,
    colorScheme,
    setFileType,
    setGraftType,
    setImpedanceType,
    setStepBetweenPoints,
    setLineOrPointWidth,
    setColorScheme,
    resetVisualization,

    // UI
    drawerOpen,
    activeTab,
    loading,
    setDrawerOpen,
    toggleDrawer,
    setActiveTab,
    setLoading,

    // Notifications
    notifications,
    setNotification,
    clearNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,

    // Analysis
    uniqueFrequencyCalc,
    concInputValues,
    setCalcToUniqueFrequency,
    setSelectFilesToCalcUniqueFrequency,
    clearAnalysisData,
    updateConcInputValue,

    // App
    platform,
    updateContent,
    progressEvent,
    setPlatform,
    setUpdateContent,
    setProgressEvent,
    clearProgressEvent
  }
}

/**
 * Hook para acceder solo al estado de archivos
 */
export const useFiles = () => useFilesStore()

/**
 * Hook para acceder solo al estado de visualización
 */
export const useVisualization = () => useVisualizationStore()

/**
 * Hook para acceder solo al estado de UI
 */
export const useUI = () => useUIStore()

/**
 * Hook para acceder solo a las notificaciones
 */
export const useNotifications = () => useNotificationsStore()

/**
 * Hook para acceder solo al estado de análisis
 */
export const useAnalysis = () => useAnalysisStore()

/**
 * Hook para acceder solo al estado de la aplicación
 */
export const useApp = () => useAppStore()
