import * as React from 'react'
import VCAnalysisProvider from './context/vc-analysis-context'
import CommonDialog from './components/common-dialog'
import TabsRoot, { TabType } from './tabs/tabs-root'
import TitleAction from './components/title-action'
import IntegralResultsTable from './components/integral-results-table'

import { GrafContext } from '@/context/GraftContext'
import ScanRateAnalysisPanel from './components/scan-rate-dialog'
import CVMultiAnalysisPanel from './cv-multi-analysis-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'

export default function VCAnalysisView() {
  const [open, setOpen] = React.useState(true) // Always open in view mode
  const [selectedTab, setSelectedTab] = React.useState<TabType>('operations')
  const { graftState } = React.useContext(GrafContext)
  const { fileType } = graftState

  return (
    <div className="h-full flex flex-col w-full p-4">
      <Tabs defaultValue="multi-scan" className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-6">
            <div className="font-semibold text-lg">Process VC</div>
            <TabsList>
              <TabsTrigger value="vc-analysis">VC Analysis</TabsTrigger>
              {fileType === 'teq4' && <TabsTrigger value="scan-rate">Scan Rate</TabsTrigger>}
              {fileType === 'teq4' && <TabsTrigger value="multi-scan">Multi-Scan</TabsTrigger>}
            </TabsList>
          </div>
        </div>

        <TabsContent
          value="vc-analysis"
          className="flex-1 overflow-hidden flex flex-col data-[state=inactive]:hidden"
        >
          <VCAnalysisProvider open={open} setOpen={setOpen}>
            <div className="flex flex-col h-full w-full">
              <div className="flex flex-col space-y-2 mb-4">
                <div className="relative flex h-6 w-full items-center gap-6 p-0 mb-0">
                  <TitleAction setOpen={() => {}} />
                </div>
                <TabsRoot selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
              </div>
              <div className="flex-1 overflow-hidden border rounded-md bg-background">
                {selectedTab !== 'integral table' ? <CommonDialog /> : <IntegralResultsTable />}
              </div>
            </div>
          </VCAnalysisProvider>
        </TabsContent>

        <TabsContent
          value="scan-rate"
          className="flex-1 overflow-hidden border rounded-md bg-background data-[state=inactive]:hidden"
        >
          <ScanRateAnalysisPanel />
        </TabsContent>

        <TabsContent
          value="multi-scan"
          className="flex-1 overflow-hidden border rounded-md bg-background data-[state=inactive]:hidden"
        >
          <CVMultiAnalysisPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
