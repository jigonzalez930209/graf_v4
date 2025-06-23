import { useMathOperation } from '@renderer/hooks/useMathOperation'
import Decimal from 'decimal.js'
import _ from 'lodash'
import React from 'react'
import { useVCAnalysis } from '../context/use-vc-analysis'
import { OperationButtons } from '../process-buttons'
import {
  AvgIcon,
  ElementWisePowerIcon,
  MaxComponentWiseIcon,
  MinComponentWiseIcon,
  ProcessIcon,
  ProcessMultipleIcon
} from '../icons'
import { MinusIcon, ProjectorIcon, PlusIcon, XIcon, DivideIcon } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'

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

const MathOperationsTab = () => {
  const {
    selectedOperation,
    setSelectedOperation,
    inputExpression,
    internalFiles,
    newFiles,
    selectionOrder,
    setNewFiles,
    setInputExpression
  } = useVCAnalysis()

  const { handleOperation } = useMathOperation()

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
  }, [internalFiles, newFiles, selectionOrder, selectedOperation, handleOperation, setNewFiles])

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
  }, [inputExpression, selectedOperation, internalFiles, newFiles, setNewFiles, handleOperation])

  return (
    <div className="ml-4 flex gap-3 rounded-md bg-accent/20 p-2 w-full">
      <div className="flex gap-3 items-center col-span-6">
        <OperationButtons
          operations={operations}
          selected={selectedOperation}
          onSelect={setSelectedOperation}
        />
        <Button
          disabled={
            !selectedOperation ||
            [...internalFiles, ...newFiles].filter((f) => f.selected).length < 2
          }
          size="icon"
          onClick={handleProcess}
          className="border-0 bg-blue-500"
        >
          {ProcessIcon}
        </Button>
        <Button
          variant="success"
          disabled={!selectedOperation || !inputExpression['1'] || !inputExpression['2']}
          onClick={handleProcessMultiple}
          size="icon"
        >
          {ProcessMultipleIcon}
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
    </div>
  )
}

export default MathOperationsTab
