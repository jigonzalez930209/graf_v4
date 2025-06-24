import { Tabs, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import MathOperationsTab from './operations-tab'
// import IntegralTab from './integral-tab'
import DerivateTab from './derivate-tab'
import FitTab from './fit-tab'

export type TabType = 'operations' | 'integral' | 'fit' | 'derivate'

const tabs: TabType[] = [
  'operations',
  //'integral',
  'fit',
  'derivate'
]

type TabsProps = {
  selectedTab: TabType
  setSelectedTab: (tab: TabType) => void
}

const TabsRoot = ({ selectedTab = tabs[0], setSelectedTab }: TabsProps) => {
  const tabsContent = {
    operations: <MathOperationsTab />,
    // integral: <IntegralTab />,
    fit: <FitTab />,
    derivate: <DerivateTab />
  }

  return (
    <div className="flex flex-col h-full w-full gap-2">
      <Tabs defaultValue={selectedTab} className="flex flex-row gap-2 mb-2">
        <TabsList className="flex-1" NextToElement={selectedTab && tabsContent[selectedTab]}>
          {tabs.map((tab) => (
            <TabsTrigger key={tab} value={tab} onClick={() => setSelectedTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}

export default TabsRoot
