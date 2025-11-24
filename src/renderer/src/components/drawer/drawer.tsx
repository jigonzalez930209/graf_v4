import React from 'react'
import { enqueueSnackbar } from 'notistack'

import { readFilesUnsortedFileType } from '@renderer/utils/connectors'
import { useGraftStore } from '@renderer/stores/useGraftStore'
import { cn, COLORS } from '@/utils'

import FileSort from '../file-sort'

import { useDropzone } from 'react-dropzone'
import { arrayBufferToString, fileType } from '@renderer/utils/common'

interface DrawerProps {
  isPinned: boolean
  onTogglePin: () => void
  isOpen: boolean
  onClose: () => void
}

const Drawer = ({ isPinned, isOpen }: DrawerProps) => {
  // Migrado a Zustand
  const { setFiles, setFileType, setSelectedColumns } = useGraftStore()

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
        if (Array.isArray(filesProcessed)) {
          setFiles(filesProcessed)
        } else if (filesProcessed === undefined) {
          enqueueSnackbar('error', { variant: 'error' })
        } else {
          // setGraftState reemplazado con setters individuales
          if (filesProcessed.files) setFiles(filesProcessed.files)
          if (filesProcessed.fileType) setFileType(filesProcessed.fileType)
          if (filesProcessed.csvFileColum) setSelectedColumns(filesProcessed.csvFileColum)
        }
        setShouldHighlight(false)
      } catch (error) {
        console.error('Error processing files:', error)
        enqueueSnackbar('error', { variant: 'error' })
        setShouldHighlight(false)
      }
    },
    [setFiles, setFileType, setSelectedColumns]
  )

  const { getRootProps, getInputProps } = useDropzone({ onDrop })

  const [shouldHighlight, setShouldHighlight] = React.useState(false)

  const preventDefaultHandler = React.useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  if (!isOpen && !isPinned) return null

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-background border-r transition-all duration-300',
        !isPinned && 'shadow-2xl'
      )}
    >
      {/* Dropzone Content */}
      <div
        {...getRootProps()}
        className={cn(
          'flex-1 overflow-hidden relative flex flex-col',
          shouldHighlight && 'bg-primary/10'
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
        <div className="flex-1 overflow-y-auto p-2">
          <FileSort />
        </div>

        {/* Drop Overlay Hint */}
        {shouldHighlight && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/20 backdrop-blur-sm z-50 pointer-events-none">
            <p className="text-lg font-bold text-primary">Drop files here</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Drawer
