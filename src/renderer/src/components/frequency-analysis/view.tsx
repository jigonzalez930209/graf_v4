import * as React from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

import { Button } from '../ui/button'
import ExportToExcel from './export-excel'
import ParameterInput from './parameter-input'
import PlotContainer from './plot-container'
import { ScrollArea } from '../ui/scroll-area'

const FrequencyAnalysisView = () => {
  const [openInputs, setOpenInputs] = React.useState(true)
  return (
    <div className="flex flex-col h-full w-full p-4">
      <div className="mb-4 flex h-6 w-full items-center gap-6 p-0">
        <div className="font-semibold text-lg">Frequency Analysis</div>
        <ExportToExcel />
      </div>

      <div className="flex flex-col flex-1 overflow-hidden border rounded-md bg-background">
        {openInputs && (
          <div className="p-4 border-b">
            <ParameterInput />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="w-full h-6 cursor-pointer items-center justify-center rounded-none border-b bg-muted/50 hover:bg-muted"
          onClick={() => setOpenInputs((prev) => !prev)}
        >
          {openInputs ? (
            <ChevronUp className="h-4 w-4 text-primary" />
          ) : (
            <ChevronDown className="h-4 w-4 text-primary" />
          )}
        </Button>
        <ScrollArea className="flex-1 bg-primary-foreground/5">
          <PlotContainer />
        </ScrollArea>
      </div>
    </div>
  )
}
export default FrequencyAnalysisView
