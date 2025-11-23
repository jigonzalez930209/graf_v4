import React from 'react'
import { LayoutDashboard } from 'lucide-react'

import DragDrop from '@/components/drag-drop/drag-drop'
import Drawer from '@/components/drawer'
import PlotlyChart from '@/components/plot/plot'
import { Button } from '@/components/ui/button'

import { GrafContext } from '@/context/GraftContext'
import useLoading from '@/hooks/useLoader'
import { PlotParams } from 'react-plotly.js'

import { IProcessFile } from '@shared/models/files'

import usePlotlyOptions from '@/hooks/usePlotlyOptions'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import Loader from '@/components/loader'
import { cn } from '@/utils'
import VCAnalysisView from '../vc-analysis/view'
import FrequencyAnalysisView from '../frequency-analysis/view'

const Graf = () => {
  const { graftState, setDrawerOpen, activeTab } = React.useContext(GrafContext)
  const drawerOpen = graftState?.drawerOpen
  const { isLoading } = useLoading()
  const { data, config, layout } = usePlotlyOptions()

  const [isDrawerPinned, setIsDrawerPinned] = React.useState(true)

  const ChartContent = (
    <>
      {graftState?.fileType === 'csv' ? (
        <DragDrop
          PlotlyChart={
            <PlotlyChart
              layout={layout as PlotParams['layout']}
              config={config}
              data={data}
              fileType={graftState.fileType}
              exportFileName={graftState.files.find((file) => file.selected)?.name ?? undefined}
            />
          }
        />
      ) : (
        <PlotlyChart
          layout={layout as PlotParams['layout']}
          config={config}
          data={data}
          fileType={graftState.fileType as IProcessFile['type']}
          exportFileName={graftState.files.find((file) => file.selected)?.name}
        />
      )}
    </>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'vc-analysis':
        return <VCAnalysisView />
      case 'frequency':
        return <FrequencyAnalysisView />
      case 'visualization':
      default:
        return ChartContent
    }
  }

  return (
    <div className="h-full flex flex-col">
      {isLoading && <Loader />}

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden flex">
        {isDrawerPinned ? (
          <ResizablePanelGroup direction="horizontal" className="w-full h-full">
            <ResizablePanel
              defaultSize={20}
              minSize={15}
              maxSize={40}
              className={cn(!drawerOpen && 'hidden')}
            >
              <Drawer
                isPinned={true}
                onTogglePin={() => setIsDrawerPinned(false)}
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
              />
            </ResizablePanel>
            {drawerOpen && <ResizableHandle withHandle />}
            <ResizablePanel defaultSize={80} className="h-full flex-1 bg-background">
              {renderContent()}
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="w-full h-full relative">
            {/* Floating Drawer */}
            <div
              className={cn(
                'absolute left-0 top-0 bottom-0 z-20 w-72 transition-transform duration-300 ease-in-out',
                drawerOpen ? 'translate-x-0' : '-translate-x-full'
              )}
            >
              <Drawer
                isPinned={false}
                onTogglePin={() => setIsDrawerPinned(true)}
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
              />
            </div>

            {/* Drawer Toggle Button (when closed) */}
            {!drawerOpen && (
              <Button
                variant="outline"
                size="icon"
                className="absolute left-2 top-2 z-10 h-8 w-8 bg-background/50 backdrop-blur-sm"
                onClick={() => setDrawerOpen(true)}
              >
                <LayoutDashboard className="h-4 w-4" />
              </Button>
            )}

            {/* Main Content (Full Width) */}
            <div className="w-full h-full bg-background">{renderContent()}</div>
          </div>
        )}
      </div>
    </div>
  )
}
export default Graf
