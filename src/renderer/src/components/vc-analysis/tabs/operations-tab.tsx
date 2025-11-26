import { useVCAnalysis } from '../context/use-vc-analysis'
import { OperationButtons } from '../components/process-buttons'
import {
  AvgIcon,
  ElementWisePowerIcon,
  MaxComponentWiseIcon,
  MinComponentWiseIcon,
  ProcessIcon,
  ProcessMultipleIcon
} from '../components/icons'
import { MinusIcon, ProjectorIcon, PlusIcon, XIcon, DivideIcon } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { useGraftStore } from '@renderer/stores/useGraftStore'

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
  const { files } = useGraftStore()
  const {
    selectedOperation,
    setSelectedOperation,
    inputExpression,
    setInputExpression,
    handleProcess,
    handleProcessMultiple
  } = useVCAnalysis()

  return (
    <div className="flex gap-3 rounded-md bg-accent/20 p-2 w-full">
      <div className="flex gap-3 items-center col-span-6">
        <OperationButtons
          operations={operations}
          selected={selectedOperation}
          onSelect={setSelectedOperation}
        />
        <Button
          disabled={
            !selectedOperation ||
            files.filter((f) => f.selected).length < 2
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
