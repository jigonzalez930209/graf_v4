import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import List from './list'
import { GrafContext } from '@renderer/context/GraftContext'
import { useData } from '@renderer/hooks/useData'
import { useSnackbar } from 'notistack'
import Item from './item'
import { Button } from '../ui/button'
import { ArrowDownAZIcon, ArrowUpAZIcon, MenuIcon, MoveIcon } from 'lucide-react'
import _ from 'lodash'
import RemoveSelection from './remove-selection'
import useResizeObserver from '@renderer/hooks/useResizeObserve'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { IProcessFile } from '@shared/models/files'
import { Folder as FolderIcon, FolderOpen as FolderOpenIcon } from 'lucide-react'

const GroupFilesByType = React.forwardRef(() => {
  const {
    graftState: { files }
  } = React.useContext(GrafContext)

  const [order, setOrder] = React.useState<'asc' | 'desc' | 'none'>('none')

  const [internalFiles, setInternalFiles] = React.useState(files)

  const { changeSelectedFile } = useData()
  const { enqueueSnackbar } = useSnackbar()
  const containerRef = React.useRef<HTMLDivElement>(null)

  const { width } = useResizeObserver(containerRef)
  const isChange = width < 250

  const handleSort = React.useCallback(() => {
    if (order === 'none') {
      setInternalFiles(_.sortBy(files, 'name'))
      setOrder('asc')
    } else if (order === 'asc') {
      setInternalFiles(_.sortBy(files, 'name').reverse())
      setOrder('desc')
    } else {
      setInternalFiles(files)
      setOrder('none')
    }
  }, [files, order])

  const handleFileSelectedChange = React.useCallback(
    (id: string) => {
      try {
        changeSelectedFile(id)
      } catch (e) {
        enqueueSnackbar(`You can't select more than 10 files ${e}`, {
          variant: 'warning'
        })
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [files]
  )

  React.useEffect(() => {
    const sortedFilesFromState = _.sortBy(files, 'name')
    const sortedFilesInternal = _.sortBy(internalFiles, 'name')

    if (_.isEqual(sortedFilesFromState, sortedFilesInternal)) return
    if (order === 'none') {
      setInternalFiles(files)
    } else if (order === 'asc') {
      setInternalFiles(sortedFilesFromState)
    } else {
      setInternalFiles(sortedFilesFromState.reverse())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, handleSort])

  const TabsListContent = (
    <TabsList className={`w-full sticky top-0 z-1`}>
      <TabsTrigger title="All files together" value="all">
        All
      </TabsTrigger>
      <TabsTrigger title="All Impedance files" value="teq4z">
        Imp
      </TabsTrigger>
      <TabsTrigger title="All Cyclic Voltametry files" value="teq4">
        VC
      </TabsTrigger>
      <TabsTrigger title="All csv files" value="csv">
        CSV
      </TabsTrigger>
      <TabsTrigger title="By Folder" value="by-folder">
        By Folder
      </TabsTrigger>
      <div className="flex gap-1 justify-center items-center">
        <Button
          variant="ghost"
          title="Sort"
          size="icon"
          className="p-0 size-5 "
          onClick={() => handleSort()}
        >
          {order === 'none' && <MoveIcon />}
          {order === 'asc' && <ArrowDownAZIcon />}
          {order === 'desc' && <ArrowUpAZIcon />}
        </Button>
        <RemoveSelection />
      </div>
    </TabsList>
  )

  return (
    <div ref={containerRef} className="w-full h-full pr-2">
      <Tabs defaultValue="all" className="w-full relative h-full overflow-auto mt-1 ml-1">
        {isChange ? (
          <Popover>
            <PopoverTrigger asChild className="bg-secondary">
              <Button variant="ghost" size="icon" className="hover:cursor-pointer">
                <MenuIcon />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-2">{TabsListContent}</PopoverContent>
          </Popover>
        ) : (
          TabsListContent
        )}
        <div className="w-full grow h-full overflow-auto px-2">
          <TabsContent value="all" className="h-full min-h-full">
            <List className="h-full">
              {internalFiles.map((file) => (
                <Item key={file.id} file={file} setFile={handleFileSelectedChange} />
              ))}
            </List>
          </TabsContent>
          <TabsContent value="teq4z">
            <List className="">
              {internalFiles
                .filter((f) => f.type === 'teq4z')
                .map((file) => (
                  <Item key={file.id} file={file} setFile={handleFileSelectedChange} />
                ))}
            </List>
          </TabsContent>
          <TabsContent value="teq4">
            <List className="">
              {internalFiles
                .filter((f) => f.type === 'teq4')
                .map((file) => (
                  <Item key={file.id} file={file} setFile={handleFileSelectedChange} />
                ))}
            </List>
          </TabsContent>
          <TabsContent value="csv">
            <List className="">
              {internalFiles
                .filter((f) => f.type === 'csv')
                .map((file) => (
                  <Item key={file.id} file={file} setFile={handleFileSelectedChange} />
                )) || 'not files to show'}
            </List>
          </TabsContent>
          <TabsContent value="by-folder">
            <FolderView files={internalFiles} setFile={handleFileSelectedChange} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
})

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
            <div className="w-full ml-2">
              {value.__files.map((file: IProcessFile) =>
                file && file.id ? <Item key={file.id} file={file} setFile={setFile} /> : null
              )}
              {renderTree(value.__folders, path.concat(key))}
            </div>
          )}
        </div>
      )
    })
  }
  return <div className="py-2">{renderTree(tree)}</div>
}

GroupFilesByType.displayName = 'GroupFilesByType'

export default GroupFilesByType
