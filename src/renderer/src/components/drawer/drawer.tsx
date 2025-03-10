import React from 'react'
import { enqueueSnackbar } from 'notistack'

import { readFilesUnsortedFileType } from '@renderer/utils/connectors'
import { GrafContext } from '@/context/GraftContext'
import { cn, COLORS } from '@/utils'

import FileSort from '../file-sort'

import { useDropzone } from 'react-dropzone'
import { arrayBufferToString, fileType } from '@renderer/utils/common'

const Drawer = () => {
  const { setFiles, setGraftState } = React.useContext(GrafContext)

  const onDrop = React.useCallback(
    async (acceptedFiles) => {
      try {
        const filePromises = acceptedFiles.map((file, index) => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader()

            reader.onabort = () => {
              console.log('File reading was aborted')
              reject(new Error('File reading was aborted'))
            }

            reader.onerror = () => {
              console.log('File reading has failed')
              reject(new Error('File reading has failed'))
            }

            reader.onload = async () => {
              const result = reader.result
              if (!result) {
                return reject(new Error('not found result to read file'))
              }
              try {
                const content = await arrayBufferToString(result as ArrayBuffer)
                const type = fileType(file.name)
                if (type === undefined) return resolve(null)
                resolve({
                  content,
                  name: file.name,
                  type,
                  color: COLORS[index]
                })
              } catch (error) {
                reject(error)
              }
            }

            reader.readAsArrayBuffer(file)
          })
        })

        const files = await Promise.all(filePromises)
        const validFiles = files.filter((file) => file !== null)

        const filesProcessed = readFilesUnsortedFileType(validFiles)
        if (Array.isArray(filesProcessed)) setFiles(filesProcessed)
        else if (filesProcessed === undefined) {
          enqueueSnackbar('error', { variant: 'error' })
        } else {
          setGraftState(filesProcessed)
        }
        setShouldHighlight(false)
      } catch (error) {
        console.error('Error processing files:', error)
        enqueueSnackbar('error', { variant: 'error' })
        setShouldHighlight(false)
      }
    },
    [setFiles, setGraftState]
  )

  const { getRootProps, getInputProps } = useDropzone({ onDrop })

  const [shouldHighlight, setShouldHighlight] = React.useState(false)

  const preventDefaultHandler = React.useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  return (
    <div
      {...getRootProps()}
      className={cn(
        'z-0 mr-2 flex w-full drop-shadow-lg animate-fade-in transition-all duration-300 ease-in-out',
        shouldHighlight && ' bg-gray-400 ring-2'
      )}
      onDragOver={(e) => {
        preventDefaultHandler(e)
        setShouldHighlight(true)
      }}
      onDragEnter={(e) => {
        preventDefaultHandler(e)
        setShouldHighlight(true)
      }}
      onDragLeave={(e) => {
        preventDefaultHandler(e)
        setShouldHighlight(false)
      }}
      onClick={(e) => e.preventDefault()}
    >
      <input {...getInputProps()} className="hidden" />
      <FileSort />
    </div>
  )
}

export default Drawer
