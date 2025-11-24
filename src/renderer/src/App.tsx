import React from 'react'
import { SnackbarProvider, enqueueSnackbar } from 'notistack'

import { cn } from '@/utils'
import { Menu } from '@/components/menu/menu'
import { ThemeProvider } from '@/components/theme-provider'

import { LoaderProvider } from './context/Loading'
import Graf from '@/components/graf'
import { useGraftStore } from '@renderer/stores/useGraftStore'
import { readFilesUnsortedFileType } from './utils/connectors'
import { IGraftState } from '@shared/models/graf'

const App = () => {
  // Migrado a Zustand - obtenemos todos los setters necesarios
  const {
    setFiles,
    setSelectedColumns,
    setFileType,
    setGraftType,
    setImpedanceType,
    setStepBetweenPoints,
    setLineOrPointWidth,
    setColorScheme,
    setIsFilesGrouped,
    setSelectedFilesCount,
    setCalcToUniqueFrequency,
    setSelectFilesToCalcUniqueFrequency,
    setPlatform
  } = useGraftStore()

  // Helper para actualizar todo el estado (reemplaza setGraftState)
  const setGraftState = React.useCallback(
    (newState: IGraftState) => {
      if (newState.files) setFiles(newState.files)
      if (newState.csvFileColum) setSelectedColumns(newState.csvFileColum)
      if (newState.fileType !== undefined) setFileType(newState.fileType)
      if (newState.graftType) setGraftType(newState.graftType)
      if (newState.impedanceType) setImpedanceType(newState.impedanceType)
      if (newState.stepBetweenPoints !== undefined) setStepBetweenPoints(newState.stepBetweenPoints)
      if (newState.lineOrPointWidth !== undefined) setLineOrPointWidth(newState.lineOrPointWidth)
      if (newState.colorScheme) setColorScheme(newState.colorScheme)
      if (newState.isFilesGrouped !== undefined) setIsFilesGrouped(newState.isFilesGrouped)
      if (newState.selectedFilesCount !== undefined)
        setSelectedFilesCount(newState.selectedFilesCount)
      if (newState.uniqueFrequencyCalc) setCalcToUniqueFrequency(newState.uniqueFrequencyCalc)
      if (newState.concInputValues) setSelectFilesToCalcUniqueFrequency(newState.concInputValues)
      if (newState.platform) setPlatform(newState.platform)
    },
    [
      setFiles,
      setSelectedColumns,
      setFileType,
      setGraftType,
      setImpedanceType,
      setStepBetweenPoints,
      setLineOrPointWidth,
      setColorScheme,
      setIsFilesGrouped,
      setSelectedFilesCount,
      setCalcToUniqueFrequency,
      setSelectFilesToCalcUniqueFrequency,
      setPlatform
    ]
  )

  React.useEffect(() => {
    window.context
      .onLoadFileInfo()
      .then((x) => {
        if (x !== undefined && x !== '.' && x !== '..' && x !== '') {
          return window.context
            .importFilesFromLoader()
            .then((files) => {
              if (files === undefined)
                return enqueueSnackbar('Something went wrong read the on load the app', {
                  variant: 'error'
                })
              const processedFiles = readFilesUnsortedFileType(
                files?.filter((f) => f !== undefined)
              )
              if (Array.isArray(processedFiles)) {
                return setFiles(processedFiles)
              } else if (typeof processedFiles === 'object') {
                return setGraftState(processedFiles)
              } else {
                return enqueueSnackbar('Something went wrong read the files on load the app', {
                  variant: 'error'
                })
              }
            })
            .catch((e) =>
              enqueueSnackbar(`Something went wrong read the file ${e}`, {
                variant: 'error'
              })
            )
        }
        return window.context
          .getGrafState(true)
          .then((state) => {
            if (state.content === '') return
            setGraftState(JSON.parse(state.content))
          })
          .catch(console.error)
      })
      .catch(console.error)

    // window.context
    //   .checkUpdates()
    //   .then((updateInfo) => {
    //     if (updateInfo?.version) {
    //       setUpdateContent(updateInfo)
    //       enqueueSnackbar(`New version available version ${updateInfo.version}`, {
    //         variant: 'info'
    //       })
    //     }
    //   })
    //   .catch(console.error)
    // window.context.on('update-available', (_, arg) => {
    //   setUpdateContent(arg)
    // })

    // window.context.on('update-downloaded', (_, arg) => {
    //   setProgressEvent({
    //     type: 'success',
    //     name: `Update downloaded version ${arg.version}`,
    //     message:
    //       'Update downloaded and ready to install please restart the app to apply the update',
    //     timeOut: 10000
    //   })
    // })

    // window.context.on('download-progress', (_, arg) => {
    //   setProgressEvent({
    //     type: 'progress',
    //     name: 'Downloading update',
    //     message: `Downloading update ${Math.round(arg.percent)}%`,
    //     timeOut: undefined
    //   })
    // })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <LoaderProvider>
        <SnackbarProvider
          maxSnack={4}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          autoHideDuration={8000}
          preventDuplicate
        >
          <main className="h-screen overflow-clip relative">
            <Menu />
            <div
              className={cn(
                'z-0 overflow-auto border-t bg-background pb-8',
                'scrollbar-none',
                ' h-screen max-h-[calc(100vh-0.1rem)] min-h-[calc(100vh-0.1rem)] min-w-[calc(100vw-0.1rem)] max-w-[calc(100vw-0.1rem)]',
                'scrollbar scrollbar-track-transparent',
                'scrollbar-thumb-accent scrollbar-thumb-rounded-md'
              )}
            >
              <Graf />
            </div>
          </main>
        </SnackbarProvider>
      </LoaderProvider>
    </ThemeProvider>
  )
}
export default App
