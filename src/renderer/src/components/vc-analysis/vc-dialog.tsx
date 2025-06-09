import * as React from 'react'
import { Button } from '../ui/button'
import {
  DivideIcon,
  LineChartIcon,
  MinusIcon,
  PlusIcon,
  ProjectorIcon,
  SlidersHorizontal,
  XIcon
} from 'lucide-react'
import {
  AvgIcon,
  ElementWisePowerIcon,
  MaxComponentWiseIcon,
  MinComponentWiseIcon,
  PolynomialIcon,
  ExponentialIcon,
  LogarithmicIcon,
  ProcessMultipleIcon,
  ProcessIcon
} from './icons'
import { useData } from '@renderer/hooks/useData'
import { IProcessFile } from '@shared/models/files'
import { FileList } from './file-list'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../ui/resizable'
import { CurvePlot } from './curve-plot'
import { generateRandomId } from '@renderer/utils/common'
import { FitButtons, OperationButtons } from './process-buttons'
import { useMathOperation } from '@/hooks/useMathOperation'
import _ from 'lodash'
import Decimal from 'decimal.js'
import { Input } from '../ui/input'
import { Switch } from '../ui/switch'
import { useFit } from '@renderer/hooks/useFit'
import { Label } from '../ui/label'
import { cn } from '@renderer/utils'
import { Slider } from '../ui/slider'
import { ManualSelection } from './manual-selection'
import { useLocalStorage } from 'usehooks-ts'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger
} from '../ui/alert-dialog'

const operations = [
  { key: 'sum', label: 'Sum', tooltip: 'Sum the selected files', icon: <PlusIcon /> },
  {
    key: 'avg',
    label: 'Average',
    tooltip: 'Compute the average of the selected files',
    icon: AvgIcon
  },
  {
    key: 'diff',
    label: 'Difference',
    tooltip: 'Compute the difference between files',
    icon: <MinusIcon />
  },
  { key: 'multiply', label: 'Multiply', tooltip: 'Multiply the selected files', icon: <XIcon /> },
  { key: 'divide', label: 'Divide', tooltip: 'Divide the selected files', icon: <DivideIcon /> },
  {
    key: 'projection',
    label: 'Projection',
    tooltip: 'Compute the projection of the selected files',
    icon: <ProjectorIcon />
  },
  {
    key: 'elementWisePower',
    label: 'Element-wise Power',
    tooltip: 'Compute the element-wise power of the selected files',
    icon: ElementWisePowerIcon
  },
  {
    key: 'maxComponentWise',
    label: 'Max Component-wise',
    tooltip: 'Compute the max component-wise of the selected files',
    icon: MaxComponentWiseIcon
  },
  {
    key: 'minComponentWise',
    label: 'Min Component-wise',
    tooltip: 'Compute the min component-wise of the selected files',
    icon: MinComponentWiseIcon
  }
]

const fitButtons = [
  { key: 'linear', label: 'Linear', tooltip: 'Fit a linear curve', icon: <LineChartIcon /> },
  {
    key: 'polynomial',
    label: 'Polynomial',
    tooltip: 'Fit a polynomial curve',
    icon: PolynomialIcon
  },
  {
    key: 'exponential',
    label: 'Exponential',
    tooltip: 'Fit an exponential curve',
    icon: ExponentialIcon
  },
  {
    key: 'logarithmic',
    label: 'Logarithmic',
    tooltip: 'Fit a logarithmic curve',
    icon: LogarithmicIcon
  }
]

export default function VCAnalysisDialog() {
  const [open, setOpen] = React.useState(false)

  const { data: files, addFiles } = useData()

  const [switchMode, setSwitchMode] = React.useState<'operation' | 'fit'>('operation')

  const [internalFiles, setInternalFiles] = React.useState<IProcessFile[]>([])
  const [newFiles, setNewFiles] = React.useState<IProcessFile[]>([])

  const [selectedOperation, setSelectedOperation] = React.useState<string | null>(null)
  const [selectedFit, setSelectedFit] = React.useState<string | null>(null)

  const [countPoints, setCountPoints] = useLocalStorage<number>('countPoints', 6)

  const [selectedPoints, setSelectedPoints] = useLocalStorage<number[]>('selectedPoints', [])

  const [selectionOrder, setSelectionOrder] = React.useState<string[]>([])
  const [inputExpression, setInputExpression] = React.useState<{ '1': string; '2': string }>({
    '1': '',
    '2': ''
  })

  const { handleOperation } = useMathOperation()
  const { fit, fitMultiple } = useFit()

  const handleProcess = React.useCallback(() => {
    const selectedFiles = [...internalFiles, ...newFiles].filter((f) => f.selected)

    if (selectedFiles.length < 2) {
      alert('Please select at least two files')
      return
    }

    const fileA = _.find(selectedFiles, ['id', selectionOrder[0]])?.name
    const fileB = _.find(selectedFiles, ['id', selectionOrder[1]])?.name

    const arrA = _.find(selectedFiles, ['id', selectionOrder[0]])?.content.map((c) => [
      Decimal(c[0]),
      Decimal(c[1])
    ])
    const arrB = _.find(selectedFiles, ['id', selectionOrder[1]])?.content.map((c) => [
      Decimal(c[0]),
      Decimal(c[1])
    ])
    console.log({ arrA, arrB, selectedFiles, selectionOrder })

    if (!arrA || !arrB) {
      alert('Invalid input, Arr1 or Arr2 is undefined')
      return
    }
    if (!selectedOperation) {
      alert('Please select an operation')
      return
    }

    const res = handleOperation(selectedOperation, arrA, arrB, {
      name: `${fileA}-${selectedOperation}-${fileB}`,
      folderPath: selectedOperation
    })
    setNewFiles((prev) => [...prev, res])
  }, [internalFiles, selectionOrder, selectedOperation, handleOperation, newFiles])

  const handleProcessMultiple = React.useCallback(() => {
    if (!inputExpression['1'] || !inputExpression['2'] || !selectedOperation) {
      alert('Please enter both expressions and select an operation')
      return
    }
    const groupByFolder = _.groupBy([...internalFiles, ...newFiles], 'relativePath')
    console.log(groupByFolder)

    const filesToWork = Object.entries(groupByFolder).map(([folderPath, files]) => {
      console.log(folderPath, files)
      const a = files.find((f) => f.name.toLowerCase().includes(inputExpression['1'].toLowerCase()))
      const b = files.find((f) => f.name.toLowerCase().includes(inputExpression['2'].toLowerCase()))
      if (!a || !b) {
        console.error('Invalid input, Arr1 or Arr2 is undefined')
        return
      }

      const arrA = a.content.map((c) => [Decimal(c[0]), Decimal(c[1])])
      const arrB = b.content.map((c) => [Decimal(c[0]), Decimal(c[1])])
      const res = handleOperation(selectedOperation, arrA, arrB, {
        name: `${a.name}-${selectedOperation}-${b.name}`,
        folderPath
      })
      return res
    })
    console.log({ newFiles: filesToWork })
    setNewFiles((prev) => [...prev, ...filesToWork.filter((f) => !!f)])
  }, [internalFiles, inputExpression, selectedOperation, handleOperation, newFiles])

  const handleFileSelectedChange = React.useCallback(
    (id: string, action?: 'selected' | 'deselected') => {
      console.log({ id })
      setSelectionOrder((prev) => {
        if (action === 'deselected') {
          return prev.filter((f) => f !== id)
        } else {
          return [...prev, id]
        }
      })
      setNewFiles((prev) =>
        prev.map((file) => {
          if (file.id === id) {
            return {
              ...file,
              selected: action === 'selected'
            }
          }
          return file
        })
      )
      setInternalFiles((prev) =>
        prev.map((file) => {
          if (file.id === id) {
            return {
              ...file,
              selected: action === 'selected'
            }
          }
          return file
        })
      )
    },
    []
  )

  const handleFit = React.useCallback(() => {
    const files = internalFiles.filter((f) => f.selected)
    if (files.length > 1 || files.length === 0) {
      alert('Please select one file')
      return
    }
    const file = files[0]
    const res = fit(
      file.content.map((c) => [Decimal(c[0]), Decimal(c[1])]),
      selectedPoints
    )
    if (!res) return
    console.log({ res })
    const id = generateRandomId()
    const f: IProcessFile = {
      ...file,
      id,
      content: res.point.map((p) => [p[0].toString(), p[1].toString()]),
      selected: true,
      name: `fit ${res.fit.degree}°, r² ${res.fit.r2}, mse ${res.fit.mse} ${file.name}`,
      type: file.type
    }
    console.log({ f })
    setNewFiles((prev) => [...prev, f])
  }, [internalFiles, fit, selectedPoints])

  const handleFitMultiple = React.useCallback(() => {
    const selectedFiles = internalFiles.filter((f) => f.selected)
    if (selectedFiles.length === 0) {
      alert('Please select at least one file')
      return
    }
    const res = fitMultiple(selectedFiles)
    console.log({ res })
    setNewFiles((prev) => [...prev, ...res.map((r) => r.file)])
  }, [internalFiles, fitMultiple])

  // const handleSelectPoint = React.useCallback((point: [number, number]) => {
  //   setCountPoints((prev) => {
  //     if (prev?.includes(point)) {
  //       return prev.filter((p) => p !== point)
  //     } else if (prev?.length) {
  //       return [...prev, point]
  //     } else {
  //       return [point]
  //     }
  //   })
  // }, [])

  const handleSetGlobalSelectedFiles = React.useCallback(() => {
    const filesToGlobalState = newFiles.filter((f) => f.selected)
    if (filesToGlobalState.length === 0) {
      alert('Please select at least one file')
      return
    }
    const continueAdd = confirm(
      `Are you sure you want to add ${filesToGlobalState.length} files to the global state?`
    )
    if (!continueAdd) return
    setOpen(false)
    addFiles(filesToGlobalState)
  }, [addFiles, newFiles])

  React.useEffect(() => {
    if (!open) return setInternalFiles([])
    if (!files) return setInternalFiles([])
    if (files.length === 0) return setInternalFiles([])
    const nF = files
      .filter((file) => file.type === 'teq4')
      .map((file) => ({ ...file, selected: false }))
    setInternalFiles(nF)
    setNewFiles([])
  }, [open, files])

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="rounded-full border-0" size="icon" title="Process VC">
          <SlidersHorizontal className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="w-[90vw] h-[90vh] max-w-[90vw] max-h-[90vh]">
        <AlertDialogTitle className="mb-1 flex h-6 w-full items-center gap-6 p-0">
          Process VC{' '}
          <Button variant="success" size="icon" onClick={handleSetGlobalSelectedFiles}>
            <PlusIcon className="w-4 h-4" />
          </Button>
        </AlertDialogTitle>
        <AlertDialogDescription className="sr-only"></AlertDialogDescription>
        <div className="grid grid-cols-12 gap-3 rounded-md bg-accent/20 pl-4 py-2">
          <div className={cn('grid grid-cols-3 col-span-2 gap-2 items-center')}>
            <Label
              htmlFor="switch-1"
              className={cn(switchMode === 'operation' ? 'text-blue-500' : '')}
            >
              Operation
            </Label>
            <Switch
              id="switch-1"
              checked={switchMode === 'fit'}
              onCheckedChange={() =>
                setSwitchMode((prev) => (prev === 'operation' ? 'fit' : 'operation'))
              }
            />
            <Label htmlFor="switch-1" className={cn(switchMode === 'fit' ? 'text-blue-500' : '')}>
              Fit
            </Label>
          </div>
          <div
            className={cn(
              'flex gap-3 items-center',
              switchMode === 'fit' ? 'col-span-2' : 'col-span-4'
            )}
          >
            {switchMode === 'operation' && (
              <OperationButtons
                operations={operations}
                selected={selectedOperation}
                onSelect={setSelectedOperation}
              />
            )}
            {switchMode === 'fit' && (
              <FitButtons
                fitButtons={fitButtons}
                selected={selectedFit}
                onSelect={setSelectedFit}
              />
            )}
            <Button
              disabled={
                switchMode === 'operation'
                  ? !selectedOperation ||
                    [...internalFiles, ...newFiles].filter((f) => f.selected).length < 2
                  : !selectedFit ||
                    [...internalFiles, ...newFiles].filter((f) => f.selected).length === 0
              }
              size="icon"
              onClick={switchMode === 'operation' ? handleProcess : handleFit}
              className="border-0 bg-blue-500"
            >
              {ProcessIcon}
            </Button>
            <Button
              variant="success"
              disabled={!selectedOperation || !inputExpression['1'] || !inputExpression['2']}
              onClick={switchMode === 'operation' ? handleProcessMultiple : handleFitMultiple}
              size="icon"
            >
              {ProcessMultipleIcon}
            </Button>
          </div>
          {switchMode === 'fit' && (
            <div className="grid grid-cols-10 gap-2 col-span-8">
              <div className="col-span-2 flex flex-row gap-3">
                <Slider
                  id="slider"
                  className=""
                  value={[countPoints]}
                  defaultValue={[countPoints]}
                  onValueChange={([value]) => setCountPoints(value)}
                  min={0}
                  step={1}
                  max={10}
                />
                <Label htmlFor="slider">{countPoints}</Label>
              </div>
              <div className="col-span-8">
                <ManualSelection
                  values={selectedPoints}
                  count={countPoints}
                  onChange={setSelectedPoints}
                />
              </div>
            </div>
          )}
        </div>
        {switchMode === 'operation' && (
          <div className="flex gap-2">
            <Input
              placeholder="Expression 1"
              value={inputExpression['1']}
              onChange={(e) => setInputExpression({ ...inputExpression, '1': e.target.value })}
            />
            <Input
              placeholder="Expression 2"
              value={inputExpression['2']}
              onChange={(e) => setInputExpression({ ...inputExpression, '2': e.target.value })}
            />
          </div>
        )}
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={25} minSize={15} className="max-h-[80vh]">
            <FileList files={[...internalFiles, ...newFiles]} onSelect={handleFileSelectedChange} />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={75} minSize={15} maxSize={85}>
            <CurvePlot
              data={[
                ...internalFiles.filter((f) => f.selected),
                ...newFiles.filter((f) => f.selected)
              ]}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </AlertDialogContent>
    </AlertDialog>
  )
}
