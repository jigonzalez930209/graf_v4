import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../ui/resizable'
import { CurvePlot } from './curve-plot'
import { FileList } from './file-list'
import { useVCAnalysis } from './context/use-vc-analysis'

const CommonDialog = () => {
  const { internalFiles, newFiles, handleFileSelectedChange } = useVCAnalysis()
  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={25} minSize={15} className="max-h-[80vh]">
        <FileList files={[...internalFiles, ...newFiles]} onSelect={handleFileSelectedChange} />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={75} minSize={15} maxSize={85}>
        <CurvePlot
          data={[...internalFiles.filter((f) => f.selected), ...newFiles.filter((f) => f.selected)]}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

export default CommonDialog
