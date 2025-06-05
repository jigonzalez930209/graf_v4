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
import FolderView from './folder-view'

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
      <Tabs
        defaultValue="all"
        className="w-full relative h-full overflow-y-auto overflow-x-hidden mt-1 ml-1"
      >
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

GroupFilesByType.displayName = 'GroupFilesByType'

export default GroupFilesByType
