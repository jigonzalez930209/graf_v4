import * as React from 'react'
import { Dialog, DialogTrigger, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { SlidersHorizontal } from 'lucide-react'
import { useData } from '@renderer/hooks/useData'
import { IProcessFile } from '@shared/models/files'
import { FileList } from './file-list'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../ui/resizable'
import { CurvePlot } from './curve-plot'
import { generateRandomId } from '@renderer/utils/common'
import { OperationButtons } from './operation-buttons'
import { useMathOperation } from '@/hooks/useMathOperation'
import _ from 'lodash'
import Decimal from 'decimal.js'
import { Input } from '../ui/input'

const operations = [
  { key: 'sum', label: 'Sum', tooltip: 'Sum the selected files' },
  { key: 'avg', label: 'Average', tooltip: 'Compute the average of the selected files' },
  { key: 'diff', label: 'Difference', tooltip: 'Compute the difference between files' },
  { key: 'multiply', label: 'Multiply', tooltip: 'Multiply the selected files' },
  { key: 'divide', label: 'Divide', tooltip: 'Divide the selected files' },
  {
    key: 'projection',
    label: 'Projection',
    tooltip: 'Compute the projection of the selected files'
  },
  {
    key: 'elementWisePower',
    label: 'Element-wise Power',
    tooltip: 'Compute the element-wise power of the selected files'
  },
  {
    key: 'maxComponentWise',
    label: 'Max Component-wise',
    tooltip: 'Compute the max component-wise of the selected files'
  },
  {
    key: 'minComponentWise',
    label: 'Min Component-wise',
    tooltip: 'Compute the min component-wise of the selected files'
  }
]

export default function VCAnalysisDialog() {
  const [open, setOpen] = React.useState(false)

  const { data: files } = useData()

  const [internalFiles, setInternalFiles] = React.useState<IProcessFile[]>([])
  const [selectedOperation, setSelectedOperation] = React.useState<string | null>(null)

  const [selectionOrder, setSelectionOrder] = React.useState<string[]>([])
  const [inputExpression, setInputExpression] = React.useState<{ '1': string; '2': string }>({
    '1': '',
    '2': ''
  })

  const {
    sum,
    subtract,
    multiply,
    divide,
    // angleBetween,
    // dotProduct,
    // euclideanDistance,
    // norm,
    projection,
    elementWisePower,
    maxComponentWise,
    minComponentWise,
    handleOperation
  } = useMathOperation()

  const handleProcess = () => {
    const selectedFiles = internalFiles.filter((f) => f.selected)

    console.log({ selectionOrder, selectedFiles })
    if (selectedFiles.length < 2) {
      alert('Please select at least two files')
      return
    }

    const arrA = _.find(internalFiles, ['id', selectionOrder[0]])?.content.map((c) => [
      Decimal(c[0]),
      Decimal(c[1])
    ])
    const arrB = _.find(internalFiles, ['id', selectionOrder[1]])?.content.map((c) => [
      Decimal(c[0]),
      Decimal(c[1])
    ])
    console.log({ arrA, arrB })

    if (!arrA || !arrB) {
      alert('Invalid input, Arr1 or Arr2 is undefined')
      return
    }

    let res: Decimal[][] = []
    switch (selectedOperation) {
      case 'sum':
        res = sum(arrA, arrB)
        break
      case 'avg':
        res = sum(arrA, arrB).map(([x, y]) => [x.div(2), y.div(2)])
        break
      case 'diff':
        res = subtract(arrA, arrB)
        break
      case 'multiply':
        res = multiply(arrA, arrB)
        break
      case 'divide':
        res = divide(arrA, arrB)
        break
      case 'projection':
        res = projection(arrA, arrB)
        break
      case 'elementWisePower':
        res = elementWisePower(arrA, arrB)
        break
      case 'maxComponentWise':
        res = maxComponentWise(arrA, arrB)
        break
      case 'minComponentWise':
        res = minComponentWise(arrA, arrB)
        break
      default:
        alert('Select an operation')
        return
    }
    const id = generateRandomId()
    const generatedFile: IProcessFile = {
      id,
      name: `Generated ${selectedOperation}-${id}.teq4`,
      type: 'teq4',
      content: res.map(([x, y]) => [x.toString(), y.toString()]),
      selected: true,
      relativePath: `${selectedOperation}/Generated ${selectedOperation}-${id}.teq4`,
      color: 'red'
    }
    setInternalFiles((prev) => [...prev, generatedFile])
  }

  const handleProcessMultiple = () => {
    if (!inputExpression['1'] || !inputExpression['2'] || !selectedOperation) {
      alert('Please enter both expressions and select an operation')
      return
    }
    const groupByFolder = _.groupBy(internalFiles, 'relativePath')
    console.log(groupByFolder)

    const newFiles = Object.entries(groupByFolder).map(([folderPath, files]) => {
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
        name: folderPath,
        folderPath
      })
      console.log({ res })
      return res
    })
    console.log({ newFiles })
    setInternalFiles((prev) => [...prev, ...newFiles.filter((f) => !!f)])
  }

  const handleFileSelectedChange = React.useCallback((id: string) => {
    setSelectionOrder((prev) => {
      if (prev.includes(id)) {
        return prev.filter((f) => f !== id)
      } else {
        return [...prev, id]
      }
    })
    setInternalFiles((prev) =>
      prev.map((file) => {
        if (file.id === id) {
          return {
            ...file,
            selected: !file.selected
          }
        }
        return file
      })
    )
  }, [])

  React.useEffect(() => {
    if (!open) return setInternalFiles([])
    if (!files) return setInternalFiles([])
    if (files.length === 0) return setInternalFiles([])
    const nF = files
      .filter((file) => file.type === 'teq4')
      .map((file) => ({ ...file, id: generateRandomId(), selected: false }))
    setInternalFiles(nF)
  }, [open, files])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full border-0" size="icon" title="Process VC">
          <SlidersHorizontal className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl w-full min-w-[90vw] min-h-[90vh]">
        <DialogTitle>Process VC</DialogTitle>
        <DialogDescription className="sr-only">Process VC</DialogDescription>
        <div className="flex gap-3 items-center">
          <OperationButtons
            operations={operations}
            selected={selectedOperation}
            onSelect={setSelectedOperation}
          />
          <Button
            disabled={!selectedOperation || internalFiles.filter((f) => f.selected).length < 2}
            onClick={handleProcess}
            style={{
              margin: '16px 0',
              padding: '8px 20px',
              borderRadius: 8,
              background: '#0070f3',
              color: 'white',
              border: 'none',
              cursor:
                !selectedOperation || internalFiles.filter((f) => f.selected).length < 2
                  ? 'not-allowed'
                  : 'pointer',
              fontWeight: 'bold',
              fontSize: 16
            }}
          >
            Process
          </Button>
          <Button
            variant="success"
            disabled={!selectedOperation || !inputExpression['1'] || !inputExpression['2']}
            onClick={handleProcessMultiple}
          >
            Process Multiple
          </Button>
        </div>
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
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={25} minSize={15} className="max-h-[80vh]">
            <FileList files={internalFiles} onSelect={handleFileSelectedChange} />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={75} minSize={15} maxSize={85}>
            <CurvePlot data={internalFiles.filter((f) => f.selected)} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </DialogContent>
    </Dialog>
  )
}
