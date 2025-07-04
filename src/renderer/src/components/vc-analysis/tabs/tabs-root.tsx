import { Tabs, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import MathOperationsTab from './operations-tab'
import DerivateTab from './derivate-tab'
import FitTab from './fit-tab'

export type TabType = 'operations' | 'integral table' | 'fit' | 'derivate'

const tabs: TabType[] = ['operations', 'fit', 'derivate', 'integral table']

type TabsProps = {
  selectedTab: TabType
  setSelectedTab: (tab: TabType) => void
}

const TabsRoot = ({ selectedTab = tabs[0], setSelectedTab }: TabsProps) => {
  const tabsContent = {
    operations: <MathOperationsTab />,
    fit: <FitTab />,
    derivate: <DerivateTab />,
    integral: <> </>
  }

  return (
    <div className="flex flex-col w-full">
      <Tabs defaultValue={selectedTab} className="w-full mt-4">
        <TabsList className="w-1/3">
          {tabs.map((tab) => (
            <TabsTrigger key={tab} value={tab} onClick={() => setSelectedTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {tabsContent[selectedTab]}
    </div>
  )
}

export default TabsRoot
