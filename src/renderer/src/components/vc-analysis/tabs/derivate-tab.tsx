import React from 'react'
import {
  NumericalDerivativeIcon,
  ProcessIcon,
  ProcessMultipleIcon,
  SavitzkyGolayIcon
} from '../icons'
import { Button } from '@renderer/components/ui/button'
import { useVCAnalysis } from '../context/use-vc-analysis'
import { DerivateButtons } from '../derivate-buttons'
import { Slider } from '@renderer/components/ui/slider'
import { Label } from '@renderer/components/ui/label'

const derivateButtons = [
  {
    key: 'numericalDerivative',
    label: 'Savitzky-Golay Derivative',
    tooltip: 'Calculate the numerical derivative',
    icon: NumericalDerivativeIcon
  },
  {
    key: 'savitzkyGolaySmooth',
    label: 'Savitzky-Golay',
    tooltip: 'Smooth the data using Savitzky-Golay filter',
    icon: SavitzkyGolayIcon
  }
]

const DerivateTab = () => {
  const {
    internalFiles,
    newFiles,
    setNewFiles,
    selectedDerivate,
    setSelectedDerivate,
    windowSize,
    setWindowSize,
    polyOrder,
    setPolyOrder,
    derivate,
    derivateMultiple
  } = useVCAnalysis()

  const handleDerivate = React.useCallback(() => {
    if (!selectedDerivate) {
      alert('Please select a derivate operation')
      return
    }
    const res = derivate(selectedDerivate, windowSize, polyOrder)
    if (!res) return
    setNewFiles((prev) => [...prev, res])
  }, [derivate, selectedDerivate, windowSize, polyOrder, setNewFiles])

  const handleDerivateMultiple = React.useCallback(() => {
    const selectedFiles = [...internalFiles, ...newFiles].filter((f) => f.selected)
    if (selectedFiles.length === 0) {
      alert('Please select at least one file')
      return
    }
    if (!selectedDerivate) {
      alert('Please select a derivate operation')
      return
    }
    const res = derivateMultiple(selectedDerivate, windowSize, polyOrder)
    setNewFiles((prev) => [...prev, ...res])
  }, [
    internalFiles,
    newFiles,
    selectedDerivate,
    derivateMultiple,
    windowSize,
    polyOrder,
    setNewFiles
  ])

  return (
    <div className="ml-4 flex gap-3 items-center bg-accent/20 p-2">
      <DerivateButtons
        derivateButtons={derivateButtons}
        selected={selectedDerivate}
        onSelect={setSelectedDerivate}
      />
      <Button
        disabled={[...internalFiles, ...newFiles].filter((f) => f.selected).length === 0}
        size="icon"
        onClick={handleDerivate}
        className="border-0 bg-blue-500"
      >
        {ProcessIcon}
      </Button>
      <Button variant="success" onClick={handleDerivateMultiple} size="icon">
        {ProcessMultipleIcon}
      </Button>

      {selectedDerivate && (
        <div className="flex gap-4 items-center">
          <div className="flex flex-col gap-2 w-40">
            <Label htmlFor="windowSize">Window Size: {windowSize}</Label>
            <Slider
              id="windowSize"
              value={[windowSize]}
              onValueChange={([value]) => setWindowSize(value)}
              min={3}
              max={21}
              step={2}
            />
          </div>
          <div className="flex flex-col gap-2 w-40">
            <Label htmlFor="polyOrder">Polynomial Order: {polyOrder}</Label>
            <Slider
              id="polyOrder"
              value={[polyOrder]}
              onValueChange={([value]) => setPolyOrder(value)}
              min={1}
              max={5}
              step={1}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default DerivateTab
