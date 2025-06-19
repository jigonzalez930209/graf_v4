import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/tabs'
import IntegralTab from './integral-tab'
import FitTab from './fit-tab'
import MathOperationsTab from './math-operations-tab'

export default function VCAnalysisTabs() {
  return (
    <Tabs defaultValue="integral" className="h-full flex flex-col gap-2">
      <TabsList className="mb-2">
        <TabsTrigger value="integral">Integral</TabsTrigger>
        <TabsTrigger value="fit">Fit</TabsTrigger>
        <TabsTrigger value="math">Math Operations</TabsTrigger>
      </TabsList>
      <TabsContent value="integral" className="flex-1">
        <IntegralTab />
      </TabsContent>
      <TabsContent value="fit" className="flex-1">
        <FitTab />
      </TabsContent>
      <TabsContent value="math" className="flex-1">
        <MathOperationsTab />
      </TabsContent>
    </Tabs>
  )
}
