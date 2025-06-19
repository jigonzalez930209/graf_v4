import React from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/tabs'

// This tab implements the layout: Tabs | Tab Actions on top, File list | Plotly chart below
export default function IntegralTab() {
  return (
    <div className="flex flex-col h-full w-full gap-2">
      {/* Top row: Tabs and Tab Actions using custom Tabs components */}
      <Tabs defaultValue="a" className="flex flex-row gap-2 mb-2">
        <TabsList className="flex-1">
          <TabsTrigger value="a">A</TabsTrigger>
          <TabsTrigger value="b">B</TabsTrigger>
        </TabsList>
        <TabsContent
          value="a"
          className="flex-1 border rounded p-2 flex items-center justify-center"
        >
          Actions for Tab A
        </TabsContent>
        <TabsContent
          value="b"
          className="flex-1 border rounded p-2 flex items-center justify-center"
        >
          Actions for Tab B
        </TabsContent>
      </Tabs>
      {/* Bottom row: File list and Plotly chart */}
      <div className="flex flex-1 flex-row gap-2">
        <div className="w-1/3 border rounded p-2 flex items-center justify-center">File list</div>
        <div className="flex-1 border rounded p-2 flex items-center justify-center">
          Plotly chart
        </div>
      </div>
    </div>
  )
}
