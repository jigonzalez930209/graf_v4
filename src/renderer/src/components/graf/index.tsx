import React from 'react'

import DragDrop from '@/components/drag-drop/drag-drop'
import Drawer from '@/components/drawer'
import PlotlyChart from '@/components/plot/plot'

import { GrafContext } from '@/context/GraftContext'
import useLoading from '@/hooks/useLoader'
import { PlotParams } from 'react-plotly.js'

import { IProcessFile } from '@shared/models/files'

import usePlotlyOptions from '@/hooks/usePlotlyOptions'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import Loader from '@/components/loader'

const Graf = () => {
  const { graftState } = React.useContext(GrafContext)
  const { isLoading } = useLoading()

  const { data, config, layout } = usePlotlyOptions()

  return (
    <div className="h-full">
      {isLoading && <Loader />}
      <div className="flex max-h-full max-w-full h-full">
        <ResizablePanelGroup direction="horizontal" className="w-full h-full">
          <ResizablePanel defaultSize={25} minSize={15}>
            <Drawer />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={75} className="h-full flex-1">
            {graftState?.fileType === 'csv' ? (
              <DragDrop
                PlotlyChart={
                  <PlotlyChart
                    layout={layout as PlotParams['layout']}
                    config={config}
                    data={data}
                    fileType={graftState.fileType}
                    exportFileName={
                      graftState.files.find((file) => file.selected)?.name ?? undefined
                    }
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
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
export default Graf
