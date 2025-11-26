import { FolderIcon, FolderOpenIcon } from 'lucide-react'
import Item from './item'
import { IProcessFile } from '@shared/models/files'
import React from 'react'
import { Checkbox } from '../ui/checkbox'
import { useLocalStorage } from 'usehooks-ts'
import { useData } from '@renderer/hooks/useData'
import { cn } from '@/utils'

// groups files by folder using relativePath
interface FolderNode {
  __files: IProcessFile[]
  __folders: Record<string, FolderNode>
}

function groupFilesByFolder(files: IProcessFile[]): Record<string, FolderNode> {
  const tree: Record<string, FolderNode> = {}
  if (!Array.isArray(files) || files.length === 0) return tree

  files.forEach((file) => {
    if (!file || typeof file !== 'object' || !('id' in file)) return

    // Use file.relativePath for folder path
    const folderPath = typeof file.relativePath === 'string' ? file.relativePath : ''
    const parts = folderPath.split('/').filter(Boolean)

    let current = tree

    // Traverse through folder hierarchy, creating folders as needed
    for (let idx = 0; idx < parts.length; idx++) {
      const part = parts[idx]
      if (!current[part]) {
        current[part] = { __files: [], __folders: {} }
      }
      current = current[part].__folders
    }

    // If we have a folderPath, we're inside a folder, so we need to go back one level
    // to add the file to the correct folder's __files array
    if (parts.length > 0) {
      const lastFolder = parts[parts.length - 1]
      let parentCurrent = tree
      for (let idx = 0; idx < parts.length - 1; idx++) {
        parentCurrent = parentCurrent[parts[idx]].__folders
      }
      parentCurrent[lastFolder].__files.push(file)
    } else {
      // File is at root level
      if (!tree['__root']) {
        tree['__root'] = { __files: [], __folders: {} }
      }
      tree['__root'].__files.push(file)
    }
  })

  return tree
}

function FolderView({ files, setFile }: { files: IProcessFile[]; setFile: (id: string) => void }) {
  const tree = React.useMemo(() => groupFilesByFolder(files), [files])
  const [openFolders, setOpenFolders] = useLocalStorage<Record<string, boolean>>(
    'folder-view-expanded-nodes',
    {}
  )
  const { toggleMultipleFiles } = useData()

  if (!Array.isArray(files) || typeof setFile !== 'function') {
    return <div className="text-red-500">Error: invalid folder view props</div>
  }

  const toggleFolder = (folderPath: string) => {
    setOpenFolders((prev) => ({ ...prev, [folderPath]: !prev[folderPath] }))
  }

  // Check if folder has any selected files (recursively)
  const hasSelectedFiles = (node: FolderNode): boolean => {
    const hasSelectedInFiles = node.__files.some((f) => f.selected)
    if (hasSelectedInFiles) return true

    return Object.values(node.__folders).some((childNode) => hasSelectedFiles(childNode))
  }

  // Get all files in a folder (recursively for non-leaf, direct for leaf)
  const getAllFilesInFolder = (node: FolderNode): IProcessFile[] => {
    return node.__files
  }

  // Check if all files in folder are selected
  const areAllFilesSelected = (node: FolderNode): boolean => {
    const allFiles = getAllFilesInFolder(node)
    return allFiles.length > 0 && allFiles.every((f) => f.selected)
  }

  // Toggle all files in a folder and open it if closed
  const toggleAllFilesInFolder = (node: FolderNode, checked: boolean, folderPath: string) => {
    const allFiles = getAllFilesInFolder(node)
    const fileIds = allFiles.map((f) => f.id)
    toggleMultipleFiles(fileIds, checked)

    // If selecting files and folder is closed, open it
    if (checked && !openFolders[folderPath]) {
      setOpenFolders((prev) => ({ ...prev, [folderPath]: true }))
    }
  }

  function renderTree(node: Record<string, FolderNode>, path: string[] = [], depth: number = 0) {
    if (!node || typeof node !== 'object') return null
    return Object.entries(node).map(([key, value]) => {
      if (
        !value ||
        typeof value !== 'object' ||
        !Array.isArray(value.__files) ||
        typeof value.__folders !== 'object'
      ) {
        return null
      }
      if (key === '__root') {
        return (
          <div key="root">
            {value.__files.map((file: IProcessFile) =>
              file && file.id ? <Item key={file.id} file={file} setFile={setFile} /> : null
            )}
            {renderTree(value.__folders, path, depth)}
          </div>
        )
      }

      const hasFolders = Object.keys(value.__folders).length > 0
      const folderPath = path.concat(key).join('/')
      const isOpen = !!openFolders[folderPath]
      const hasSelected = hasSelectedFiles(value)
      const allSelected = areAllFilesSelected(value)
      const isLeafFolder = !hasFolders && value.__files.length > 0

      return (
        <div key={folderPath + '-folder'} className="w-full flex flex-col select-none">
          <div
            className={cn(
              'w-full flex select-none items-center space-x-2 px-2 my-1.5 rounded-md hover:bg-secondary',
              hasSelected && 'bg-primary/10 ring-1 '
            )}
            style={{ minHeight: 36 }}
          >
            {/* Checkbox only for leaf folders (folders without subfolders) */}
            {isLeafFolder && (
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) =>
                  toggleAllFilesInFolder(value, checked as boolean, folderPath)
                }
                onClick={(e) => e.stopPropagation()}
                className="h-4 w-4 rounded border-2 cursor-pointer border-primary hover:bg-secondary"
              />
            )}

            {/* Folder icon and name - click to toggle open/close */}
            <div
              className="flex items-center space-x-2 flex-1 cursor-pointer"
              onClick={() => toggleFolder(folderPath)}
            >
              <span className="w-6 h-6 flex items-center justify-center">
                {isOpen ? (
                  <FolderOpenIcon size={18} className="text-primary" />
                ) : (
                  <FolderIcon size={18} className="text-primary" />
                )}
              </span>
              <div className="w-full overflow-hidden truncate font-semibold text-sm">{key}</div>
            </div>
          </div>

          {/* Show files and subfolders when open */}
          {isOpen && (
            <>
              {/* Files in this folder */}
              {value.__files.length > 0 && (
                <div className="w-full pl-6 border-l border-border/40 ml-3">
                  {value.__files.map((file: IProcessFile) =>
                    file && file.id ? <Item key={file.id} file={file} setFile={setFile} /> : null
                  )}
                </div>
              )}

              {/* Subfolders */}
              {hasFolders && (
                <div className="w-full pl-6 border-l border-border/40 ml-3">
                  {renderTree(value.__folders, path.concat(key), depth + 1)}
                </div>
              )}
            </>
          )}
        </div>
      )
    })
  }
  return <div className="py-2">{renderTree(tree)}</div>
}

FolderView.displayName = 'FolderView'

export default FolderView
