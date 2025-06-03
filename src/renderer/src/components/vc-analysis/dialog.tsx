import * as React from 'react'
import { Dialog, DialogTrigger, DialogContent, DialogDescription } from '../ui/dialog'
import { Button } from '../ui/button'
import { SlidersHorizontal } from 'lucide-react'
import FolderView from '../file-sort/folder-view'
import { useData } from '@renderer/hooks/useData'

export default function VCAnalysisDialog() {
  const [open, setOpen] = React.useState(false)
  const [input1, setInput1] = React.useState('')
  const [input2, setInput2] = React.useState('')

  const { data: files, changeSelectedFile } = useData()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full border-0" size="icon" title="Process VC">
          <SlidersHorizontal className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl w-full">
        <DialogDescription>Process VC</DialogDescription>
        <div className="flex flex-col w-full h-[calc(100vh-150px)]">
          <div className="flex flex-col gap-2 p-4 w-full max-w-xs">
            <input
              className="border rounded p-2 text-base bg-background"
              placeholder="Texto 1"
              value={input1}
              onChange={(e) => setInput1(e.target.value)}
            />
            <input
              className="border rounded p-2 text-base bg-background"
              placeholder="Texto 2"
              value={input2}
              onChange={(e) => setInput2(e.target.value)}
            />
          </div>
          <div className="flex-1 h-full overflow-auto p-4">
            <FolderView files={files} setFile={changeSelectedFile} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
