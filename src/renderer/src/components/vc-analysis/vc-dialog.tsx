import * as React from 'react'
import { Button } from '../ui/button'
import { SlidersHorizontal } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger
} from '../ui/alert-dialog'
import VCAnalysisProvider from './context/vc-analysis-context'
import CommonDialog from './common-dialog'
import TabsRoot, { TabType } from './tabs/tabs-root'
import TitleAction from './title-action'

export default function VCAnalysisDialog() {
  const [open, setOpen] = React.useState(false)
  const [selectedTab, setSelectedTab] = React.useState<TabType>('operations')

  return (
    <VCAnalysisProvider open={open} setOpen={setOpen}>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            className="rounded-full border-0"
            size="icon"
            title="Process VC"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="w-[90vw] h-[90vh] max-w-[90vw] max-h-[90vh]">
          <AlertDialogTitle className="mb-1 relative flex h-6 w-full items-center gap-6 p-0">
            Process VC <TitleAction setOpen={setOpen} />
          </AlertDialogTitle>
          <AlertDialogDescription className="sr-only"></AlertDialogDescription>
          <TabsRoot selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
          <CommonDialog />
        </AlertDialogContent>
      </AlertDialog>
    </VCAnalysisProvider>
  )
}
