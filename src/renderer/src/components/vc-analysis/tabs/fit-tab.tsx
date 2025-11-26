import {
  ExponentialIcon,
  LogarithmicIcon,
  PolynomialIcon,
  ProcessIcon,
  ProcessMultipleIcon
} from '../components/icons'
import { Button } from '@renderer/components/ui/button'
import { useVCAnalysis } from '../context/use-vc-analysis'
import { FitButtons } from '../components/process-buttons'
import { LineChartIcon } from 'lucide-react'
import { Slider } from '@renderer/components/ui/slider'
import { ManualSelection } from '../components/manual-selection'
import { Label } from '@renderer/components/ui/label'
import { useGraftStore } from '@renderer/stores/useGraftStore'

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

const FitTab = () => {
  const { files } = useGraftStore()
  const {
    selectedPoints,
    selectedDegree,
    setSelectedFit,
    selectedFit,
    setCountPoints,
    countPoints,
    handleManualSelection,
    handleFit,
    handleFitMultiple
  } = useVCAnalysis()

  return (
    <div className="flex gap-3 items-center bg-accent/20 p-2">
      <FitButtons fitButtons={fitButtons} selected={selectedFit} onSelect={setSelectedFit} />
      <Button
        disabled={files.filter((f) => f.selected).length === 0}
        size="icon"
        onClick={handleFit}
        className="border-0 bg-blue-500"
      >
        {ProcessIcon}
      </Button>
      <Button variant="success" onClick={handleFitMultiple} size="icon">
        {ProcessMultipleIcon}
      </Button>

      <div className="flex gap-2">
        <div className="flex flex-row gap-3 w-40">
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
            onChange={handleManualSelection}
            degree={selectedDegree}
          />
        </div>
      </div>
    </div>
  )
}

export default FitTab
