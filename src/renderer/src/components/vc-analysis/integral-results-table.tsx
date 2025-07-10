import React, { useMemo, useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ArrowUpDown, Download, Info, Search } from 'lucide-react'
import { useVCAnalysis } from './context/use-vc-analysis'
import { cn } from '@renderer/utils'

export interface IntegralResultRow {
  id: string
  curveName: string
  area: string
  peakHeight: string
  peakX: string
  peakY: string
}

type SortField = 'curveName' | 'area' | 'peakHeight' | 'peakX' | 'peakY'

const IntegralResultsTable: React.FC = () => {
  const { integralResults } = useVCAnalysis()

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [sortField, setSortField] = useState<SortField>('peakHeight')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Filter and sort data based on search query and sort field
  const filteredAndSortedData = useMemo(() => {
    // First filter by search query
    const filtered = searchQuery
      ? integralResults.filter((row) =>
          row.curveName.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : integralResults

    // Then sort the filtered results
    return [...filtered].sort((a, b) => {
      let valueA: number | string
      let valueB: number | string

      // Handle numeric fields
      if (
        sortField === 'area' ||
        sortField === 'peakHeight' ||
        sortField === 'peakX' ||
        sortField === 'peakY'
      ) {
        valueA = parseFloat(a[sortField])
        valueB = parseFloat(b[sortField])
      } else {
        // Handle string fields
        valueA = a[sortField].toLowerCase()
        valueB = b[sortField].toLowerCase()
      }

      // Sort based on direction
      if (sortDirection === 'asc') {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0
      } else {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0
      }
    })
  }, [integralResults, searchQuery, sortField, sortDirection])

  const allSelected =
    filteredAndSortedData.length > 0 && selectedIds.length === filteredAndSortedData.length

  const handleSelectAll = () => {
    setSelectedIds(allSelected ? [] : filteredAndSortedData.map((row) => row.id))
  }

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]))
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new field and default to descending for numeric values, ascending for text
      if (field === 'curveName') {
        setSortDirection('asc')
      } else {
        setSortDirection('desc')
      }
      setSortField(field)
    }
  }

  const exportSelectedData = () => {
    // Filter data to only selected rows
    const dataToExport =
      selectedIds.length > 0
        ? filteredAndSortedData.filter((row) => selectedIds.includes(row.id))
        : filteredAndSortedData

    // Convert to CSV
    const headers = ['Curve Name', 'Area', 'Peak Height', 'Peak X', 'Peak Y']
    const csvContent = [
      headers.join(','),
      ...dataToExport.map((row) =>
        [
          `${row.curveName}`, // Quote curve name to handle commas
          row.area,
          row.peakHeight,
          row.peakX,
          row.peakY
        ].join(',')
      )
    ].join('\n')

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'integral_results.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Helper to render sort indicator
  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return null
    return (
      <ArrowUpDown
        size={14}
        className={cn(
          'ml-1 inline-block h-4 w-4 transition-transform',
          sortDirection === 'asc' ? 'rotate-180' : ''
        )}
      />
    )
  }

  // Empty state when no data is available
  if (integralResults.length === 0) {
    return (
      <Card className="w-full h-full">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center h-full">
          <Info className="h-10 w-10 text-muted-foreground mb-2" />
          <CardTitle className="text-lg font-medium">No integral data available</CardTitle>
          <CardDescription className="mt-1">
            Select two points on a curve to calculate integrals and peak information.
          </CardDescription>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full h-full flex flex-col border-0 shadow-none">
      <CardHeader className="pb-2 flex-shrink-0 px-2 pt-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Integral Results</CardTitle>
            <Badge variant="outline" className="ml-2">
              {selectedIds.length > 0
                ? `${selectedIds.length} of ${filteredAndSortedData.length} selected`
                : `${filteredAndSortedData.length} results`}
            </Badge>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={exportSelectedData}
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4 mr-1" />
            <span>Export {selectedIds.length > 0 ? 'Selected' : 'All'}</span>
          </Button>
        </div>
        <div className="mt-2 relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by curve name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 w-full"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        <div className="rounded-md border h-full flex flex-col">
          <Table className="h-full">
            <TableHeader className="sticky top-0 bg-background z-10 rounded-t-md">
              <TableRow className="rounded-t-md">
                <TableHead className="w-[40px] rounded-tl-md">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 w-[40%]"
                  onClick={() => handleSort('curveName')}
                >
                  <div className="flex items-center">
                    Curve Name {renderSortIndicator('curveName')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 w-[15%]"
                  onClick={() => handleSort('area')}
                >
                  <div className="flex items-center">Area {renderSortIndicator('area')}</div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 w-[15%]"
                  onClick={() => handleSort('peakHeight')}
                >
                  <div className="flex items-center">
                    Peak Height {renderSortIndicator('peakHeight')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 w-[15%]"
                  onClick={() => handleSort('peakX')}
                >
                  <div className="flex items-center">Peak X {renderSortIndicator('peakX')}</div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 w-[15%] rounded-tr-[3px]"
                  onClick={() => handleSort('peakY')}
                >
                  <div className="flex items-center">Peak Y {renderSortIndicator('peakY')}</div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="overflow-y-auto">
              {filteredAndSortedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No results found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedData.map((row) => (
                  <TableRow
                    key={row.id}
                    className={cn(selectedIds.includes(row.id) && 'bg-muted/50')}
                  >
                    <TableCell className="w-[40px]">
                      <Checkbox
                        checked={selectedIds.includes(row.id)}
                        onCheckedChange={() => handleSelectRow(row.id)}
                        aria-label={`Select ${row.curveName}`}
                      />
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <div className="truncate" title={row.curveName}>
                        {row.curveName}
                      </div>
                    </TableCell>
                    <TableCell>{row.area}</TableCell>
                    <TableCell>{row.peakHeight}</TableCell>
                    <TableCell>{row.peakX}</TableCell>
                    <TableCell>{row.peakY}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

export default IntegralResultsTable
