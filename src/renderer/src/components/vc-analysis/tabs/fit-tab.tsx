import { useFit } from '@renderer/hooks/useFit'
import { generateRandomId } from '@renderer/utils/common'
import { IProcessFile } from '@shared/models/files'
import Decimal from 'decimal.js'
import React from 'react'
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
  const {
    selectedPoints,
    selectedDegree,
    internalFiles,
    newFiles,
    setNewFiles,
    setSelectedFit,
    selectedFit,
    setCountPoints,
    countPoints,
    handleManualSelection
  } = useVCAnalysis()

  const { fit, fitMultiple } = useFit()

  const handleFit = React.useCallback(() => {
    const files = internalFiles.filter((f) => f.selected)
    if (files.length > 1 || files.length === 0) {
      alert('Please select one file')
      return
    }
    const file = files[0]
    const res = fit(
      file.content.map((c) => [Decimal(c[0]), Decimal(c[1])]),
      selectedPoints,
      selectedDegree
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
  }, [internalFiles, fit, selectedPoints, selectedDegree, setNewFiles])

  const handleFitMultiple = React.useCallback(() => {
    const selectedFiles = internalFiles.filter((f) => f.selected)
    if (selectedFiles.length === 0) {
      alert('Please select at least one file')
      return
    }
    const res = fitMultiple(selectedFiles)
    console.log({ res })
    setNewFiles((prev) => [...prev, ...res.map((r) => r.file)])
  }, [internalFiles, fitMultiple, setNewFiles])

  return (
    <div className="flex gap-3 items-center bg-accent/20 p-2">
      <FitButtons fitButtons={fitButtons} selected={selectedFit} onSelect={setSelectedFit} />
      <Button
        disabled={[...internalFiles, ...newFiles].filter((f) => f.selected).length === 0}
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
