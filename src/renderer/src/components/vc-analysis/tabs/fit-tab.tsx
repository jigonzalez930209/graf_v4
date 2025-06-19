import React from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/tabs'

export default function FitTab() {
  return (
    <div className="flex flex-col h-full w-full gap-2">
      {/* Top row: Tabs and Tab Actions using custom Tabs components */}
      <Tabs defaultValue="linear" className="flex flex-row gap-2 mb-2">
        <TabsList className="flex-1">
          <TabsTrigger value="linear">Linear</TabsTrigger>
          <TabsTrigger value="poly">Polynomial</TabsTrigger>
        </TabsList>
        <TabsContent value="linear" className="flex-1 border rounded p-2 flex items-center justify-center">
          Actions for Linear Fit
        </TabsContent>
        <TabsContent value="poly" className="flex-1 border rounded p-2 flex items-center justify-center">
          Actions for Polynomial Fit
        </TabsContent>
      </Tabs>
      {/* Bottom row: File list and Plotly chart */}
      <div className="flex flex-1 flex-row gap-2">
        <div className="w-1/3 border rounded p-2 flex items-center justify-center">File list</div>
        <div className="flex-1 border rounded p-2 flex items-center justify-center">Plotly chart</div>
      </div>
    </div>
  )
}
