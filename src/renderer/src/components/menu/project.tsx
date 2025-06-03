import * as React from 'react'
import { GrafContext } from '@/context/GraftContext'
import { useData } from '@/hooks/useData'

import {
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger
} from '../ui/menubar'
import { readGrafFile, readNativeFiles, stringifyToSave } from '@renderer/utils/connectors'
import { IGraftState } from '@shared/models/graf'
import { enqueueSnackbar } from 'notistack'
import useLoader from '@renderer/hooks/useLoader'
import { INITIAL_STATE } from '@renderer/context/GraftProvider'

export const ProjectMenu = () => {
  const { graftState, setGraftState } = React.useContext(GrafContext)
  const { startLoading, stopLoading } = useLoader()
  const { addFiles, updateData } = useData()

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
    <MenubarMenu>
      <MenubarTrigger className="relative hover:bg-secondary">Project</MenubarTrigger>
      <MenubarContent>
        {/* TODO: Implement handle project in next versions */}
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
      </MenubarContent>
    </MenubarMenu>
  )
}
