import { FolderIcon, FolderOpenIcon } from 'lucide-react'
import Item from './item'
import { IProcessFile } from '@shared/models/files'
import React from 'react'

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
    const path = typeof file.relativePath === 'string' ? file.relativePath : ''
    const parts = path.split('/').filter(Boolean)
    let current = tree

    for (let idx = 0; idx < parts.length - 1; idx++) {
      const part = parts[idx]
      if (!current[part]) current[part] = { __files: [], __folders: {} }
      current = current[part].__folders
    }

    const fileName = parts.length > 0 ? parts[parts.length - 1] : null
    if (parts.length === 0) {
      if (!current.__root) current.__root = { __files: [], __folders: {} }
      current.__root.__files.push(file)
    } else {
      if (!current[fileName!]) current[fileName!] = { __files: [], __folders: {} }
      current[fileName!].__files.push(file)
    }
  })
  return tree
}

function FolderView({ files, setFile }: { files: IProcessFile[]; setFile: (id: string) => void }) {
  const tree = React.useMemo(() => groupFilesByFolder(files), [files])
  const [openFolders, setOpenFolders] = React.useState<Record<string, boolean>>({})

  if (!Array.isArray(files) || typeof setFile !== 'function') {
    return <div className="text-red-500">Error: invalid folder view props</div>
  }

  const toggleFolder = (folderPath: string) => {
    setOpenFolders((prev) => ({ ...prev, [folderPath]: !prev[folderPath] }))
  }

  function renderTree(node: Record<string, FolderNode>, path: string[] = []) {
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
            {renderTree(value.__folders, path)}
          </div>
        )
      }

      const hasFolders = Object.keys(value.__folders).length > 0
      const folderPath = path.concat(key).join('/')
      const isOpen = !!openFolders[folderPath]
      return (
        <div key={folderPath + '-folder'} className="w-full flex flex-col select-none">
          {hasFolders && (
            <div
              className="w-full flex select-none items-center space-x-2 px-2 my-1.5 rounded-md cursor-pointer font-extrabold hover:bg-secondary overflow-hidden"
              style={{ minHeight: 36 }}
              onClick={() => toggleFolder(folderPath)}
            >
              <span className="w-6 h-6 flex items-center justify-center">
                {isOpen ? (
                  <FolderOpenIcon size={20} className="text-primary" />
                ) : (
                  <FolderIcon size={20} className="text-primary" />
                )}
              </span>
              <div className="ml-2 w-full overflow-hidden truncate hover:text-ellipsis">{key}</div>
            </div>
          )}
          {/* if folder is open or has no folders, show files and subfolders */}
          {(isOpen || !hasFolders) && (
            <>
              <div className="w-full ml-2">
                {value.__files.map((file: IProcessFile) =>
                  file && file.id ? <Item key={file.id} file={file} setFile={setFile} /> : null
                )}
              </div>
              <div className="w-full ml-3 pl-1 border-l-[1px] border-l-zinc-700 dark:border-l-zinc-600">
                {renderTree(value.__folders, path.concat(key))}
              </div>
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
