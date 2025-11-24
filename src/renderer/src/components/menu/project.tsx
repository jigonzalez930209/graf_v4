import * as React from 'react'
import { useGraftStore } from '@renderer/stores/useGraftStore'
import { useData } from '@/hooks/useData'

import { MenubarItem, MenubarSeparator, MenubarShortcut } from '../ui/menubar'
import { readGrafFile, readNativeFiles, stringifyToSave } from '@renderer/utils/connectors'
import { IGraftState } from '@shared/models/graf'
import { enqueueSnackbar } from 'notistack'
import useLoader from '@renderer/hooks/useLoader'
import { INITIAL_STATE } from '@renderer/context/GraftProvider'

export const ProjectMenu = () => {
  // Migrado a Zustand - obtenemos todos los estados y setters necesarios
  const {
    files,
    csvFileColum,
    fileType,
    graftType,
    impedanceType,
    stepBetweenPoints,
    lineOrPointWidth,
    colorScheme,
    isFilesGrouped,
    selectedFilesCount,
    uniqueFrequencyCalc,
    concInputValues,
    platform,
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
    setSelectFilesToCalcUniqueFrequency
  } = useGraftStore()

  const { startLoading, stopLoading } = useLoader()
  const { addFiles, updateData } = useData()

  // Helper para reconstruir graftState
  const graftState = React.useMemo(
    () => ({
      files,
      csvFileColum,
      fileType,
      graftType,
      impedanceType,
      stepBetweenPoints,
      lineOrPointWidth,
      colorScheme,
      isFilesGrouped,
      selectedFilesCount,
      uniqueFrequencyCalc,
      concInputValues,
      platform,
      drawerOpen: true,
      loading: false,
      notifications: { content: [''], title: '', type: undefined },
      state: null,
      updateContent: null,
      progressEvent: { message: '', name: '', type: undefined, timeOut: 0 }
    }),
    [
      files,
      csvFileColum,
      fileType,
      graftType,
      impedanceType,
      stepBetweenPoints,
      lineOrPointWidth,
      colorScheme,
      isFilesGrouped,
      selectedFilesCount,
      uniqueFrequencyCalc,
      concInputValues,
      platform
    ]
  )

  // Helper para actualizar todo el estado (reemplaza setGraftState)
  const setGraftState = React.useCallback(
    (newState: IGraftState) => {
      if (newState.files) setFiles(newState.files)
      if (newState.csvFileColum) setSelectedColumns(newState.csvFileColum)
      if (newState.fileType !== undefined) setFileType(newState.fileType)
      if (newState.graftType) setGraftType(newState.graftType)
      if (newState.impedanceType) setImpedanceType(newState.impedanceType)
      if (newState.stepBetweenPoints !== undefined)
        setStepBetweenPoints(newState.stepBetweenPoints)
      if (newState.lineOrPointWidth !== undefined) setLineOrPointWidth(newState.lineOrPointWidth)
      if (newState.colorScheme) setColorScheme(newState.colorScheme)
      if (newState.isFilesGrouped !== undefined) setIsFilesGrouped(newState.isFilesGrouped)
      if (newState.selectedFilesCount !== undefined)
        setSelectedFilesCount(newState.selectedFilesCount)
      if (newState.uniqueFrequencyCalc) setCalcToUniqueFrequency(newState.uniqueFrequencyCalc)
      if (newState.concInputValues) setSelectFilesToCalcUniqueFrequency(newState.concInputValues)
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
      setSelectFilesToCalcUniqueFrequency
    ]
  )

  const newProject = () => setGraftState(INITIAL_STATE)

  const readFiles = React.useCallback(async () => {
    startLoading()
    window.context
      .getFiles()
      .then((files) => {
        if (files === undefined || files.length === 0) {
          enqueueSnackbar('No files selected', { variant: 'warning' })
          return
        }
        const processFiles = readNativeFiles(files)
        if (processFiles) {
          addFiles(processFiles)
        } else {
          enqueueSnackbar('Something went wrong read the files', { variant: 'error' })
        }
      })
      .catch((err) => {
        enqueueSnackbar(err.toString(), { variant: 'error' })
        console.log(err)
      })
      .finally(() => {
        stopLoading()
      })
  }, [addFiles, startLoading, stopLoading])

  const openProject = React.useCallback(async () => {
    startLoading()
    window.context
      .getGrafState()
      .then((state) => {
        if (state.type === 'graft') {
          const currentState = readGrafFile(state)
          if (currentState) setGraftState(currentState)
        }
      })
      .catch((err) => {
        console.log(err)
      })
      .finally(() => {
        stopLoading()
      })
  }, [setGraftState, startLoading, stopLoading])

  const openFolder = React.useCallback(async () => {
    startLoading()
    window.context
      .getBinaryFilesFromDirectory()
      .then((files) => {
        if (files === undefined || files.length === 0) {
          enqueueSnackbar('No files found in folder', { variant: 'warning' })
          return
        }
        // adapt files to IFileRaw

        const processFiles = readNativeFiles(files)
        if (processFiles) {
          updateData(processFiles)
        } else {
          enqueueSnackbar('Something went wrong reading the files', { variant: 'error' })
        }
      })
      .catch((err) => {
        enqueueSnackbar(err.toString(), { variant: 'error' })
        console.log(err)
      })
      .finally(() => {
        stopLoading()
      })
  }, [updateData, startLoading, stopLoading])

  const saveProject = React.useCallback(async () => {
    startLoading()
    window.context
      .saveProject(stringifyToSave<IGraftState>(graftState, 'graft'))
      .then((n) => {
        enqueueSnackbar(n.content, { variant: n.type })
      })
      .catch((err) => {
        enqueueSnackbar(err.toString(), { variant: 'error' })
        console.log(err)
      })
      .finally(() => {
        stopLoading()
      })
  }, [graftState, startLoading, stopLoading])

  return (
    <>
      <MenubarItem onClick={newProject}>
        New Project
        {/* <MenubarShortcut>⌘N</MenubarShortcut> */}
      </MenubarItem>
      <MenubarItem onClick={readFiles}>
        Open files
        {/* <MenubarShortcut>⌘O</MenubarShortcut> */}
      </MenubarItem>
      <MenubarItem onClick={openFolder}>Open folder (recursive)</MenubarItem>
      <MenubarItem onClick={readFiles}>
        Add files
        {/* <MenubarShortcut>⌘O</MenubarShortcut> */}
      </MenubarItem>

      <MenubarItem disabled>
        Save
        {/* <MenubarShortcut>⌘S</MenubarShortcut> */}
      </MenubarItem>
      <MenubarSeparator />
      <MenubarItem onClick={openProject}>
        Import project
        <MenubarShortcut>⌘I</MenubarShortcut>
      </MenubarItem>
      <MenubarItem onClick={saveProject}>
        Save project
        <MenubarShortcut>⌘E</MenubarShortcut>
      </MenubarItem>
    </>
  )
}
