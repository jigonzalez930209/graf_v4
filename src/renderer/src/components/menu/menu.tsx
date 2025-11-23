'use client'

import * as React from 'react'
import { Activity, BarChart2, SaveIcon, SettingsIcon, Waves } from 'lucide-react'
import { Button } from '@/components/ui/button'

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger
} from '@/components/ui/menubar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import { GrafContext } from '@/context/GraftContext'
import { AboutDialog } from './about-dialog'
import { Settings } from './settings'
import ExportModal from '../export-dialog'
import ImportFile from '../import-dialog'
import ImportDialog from '../template-dialog/import-dialog'
import { Dialog, DialogTrigger } from '../ui/dialog'
import CustomTooltip from '../ui/tooltip'
import { MenuModeToggle } from './menu-mode-toggle'
import { ProjectMenu } from './project'
import EventProgress from './event-progress'
import WindowControls from './control-buttons'

export function Menu() {
  const [name, setName] = React.useState('')
  const { graftState, activeTab, setActiveTab } = React.useContext(GrafContext)
  const { files } = graftState

  const progress = React.useRef(0)

  const quit = React.useCallback(() => {
    window.context.quit()
  }, [])

  const openDevTools = React.useCallback(async () => {
    await window.context.openDevTools()
  }, [])

  React.useEffect(() => {
    window.context.getAppName().then((name) => setName(name))
    window.context.on('download-progress', (_, arg) => {
      progress.current = arg.percent
    })
  }, [])

  return (
    <header className="flex flex-col">
      <div className="flex items-center border-b bg-background px-2 h-10">
        {/* Unified Main Menu */}
        <Menubar className="border-none bg-transparent p-0 mr-4">
          <MenubarMenu>
            <MenubarTrigger className="font-bold capitalize hover:bg-secondary cursor-pointer data-[state=open]:bg-secondary">
              {name || 'Graf v4'}
            </MenubarTrigger>
            <Dialog modal={false}>
              <MenubarContent>
                <MenubarItem disabled className="font-semibold opacity-100">
                  Project
                </MenubarItem>
                <MenubarSeparator />
                <ProjectMenu />
                <MenubarSeparator />
                <MenubarItem disabled className="font-semibold opacity-100">
                  View
                </MenubarItem>
                <MenubarSeparator />
                <MenuModeToggle />
                <MenubarSeparator />
                <MenubarItem disabled className="font-semibold opacity-100">
                  Application
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem onClick={openDevTools}>Open Dev Tools</MenubarItem>
                <DialogTrigger asChild>
                  <MenubarItem>About {name}</MenubarItem>
                </DialogTrigger>
                <MenubarSeparator />
                <MenubarItem onClick={quit}>Quit</MenubarItem>
              </MenubarContent>
              <AboutDialog />
            </Dialog>
          </MenubarMenu>
        </Menubar>

        {/* Tabs Navigation */}
        <div className="flex items-center gap-1 flex-1">
          <Button
            variant={activeTab === 'visualization' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('visualization')}
            className="gap-2 h-8"
          >
            <BarChart2 className="h-4 w-4" />
            Visualization
          </Button>

          <Button
            variant={activeTab === 'vc-analysis' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('vc-analysis')}
            className="gap-2 h-8"
          >
            <Activity className="h-4 w-4" />
            VC Analysis
          </Button>

          <Button
            variant={activeTab === 'frequency' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('frequency')}
            className="gap-2 h-8"
          >
            <Waves className="h-4 w-4" />
            Frequency Analysis
          </Button>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <SettingsIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="h-auto w-auto bg-secondary" align="end">
              <Settings />
            </PopoverContent>
          </Popover>

          <ImportDialog />
          <ImportFile />
          {Boolean(files.find((f) => f.type === 'teq4' || f.type === 'teq4z')) && files.length && (
            <ExportModal>
              <CustomTooltip title="Export to Excel" Icon={<SaveIcon className="h-5 w-5" />} />
            </ExportModal>
          )}
          <EventProgress />
          <WindowControls />
        </div>
      </div>

      <div className="w-full h-[1.5px] bg-secondary/20">
        <div
          className="bg-primary h-[1.5px] transition-all duration-300"
          style={{
            width: `${progress.current}%`,
            opacity: progress.current > 0 && progress.current < 100 ? 1 : 0
          }}
        ></div>
      </div>
    </header>
  )
}
