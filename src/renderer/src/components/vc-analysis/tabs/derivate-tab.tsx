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
    label: 'Derivative',
    tooltip: 'Calculate the standard numerical derivative (no smoothing)',
    icon: NumericalDerivativeIcon
  },
  {
    key: 'savitzkyGolayDerivative',
    label: 'SG Derivative',
    tooltip: 'Calculate a smoothed derivative using the Savitzky-Golay filter',
    icon: SavitzkyGolayIcon
  },
  {
    key: 'savitzkyGolaySmooth',
    label: 'SG Smooth',
    tooltip: 'Smooth the data using the Savitzky-Golay filter',
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

  const selectedFile = React.useMemo(
    () => [...internalFiles, ...newFiles].find((f) => f.selected),
    [internalFiles, newFiles]
  )

  const maxWindowSize = React.useMemo(() => {
    if (!selectedFile) return 99 // Default max if no file is selected
    let size = selectedFile.content.length
    // Ensure the max size is odd and at least 3
    if (size % 2 === 0) {
      size -= 1
    }
    return size < 3 ? 3 : size
  }, [selectedFile])

  // Diagnostic log to trace state on each render
  console.log({
    fileName: selectedFile?.name,
    fileLength: selectedFile?.content.length,
    maxWindowSize,
    windowSize
  })

  React.useEffect(() => {
    // Adjust windowSize if it's larger than the max allowed for the current file
    if (windowSize > maxWindowSize) {
      setWindowSize(maxWindowSize)
    }
  }, [maxWindowSize, windowSize, setWindowSize])

  const handleWindowSizeChange = (value: number[]) => {
    let newSize = value[0]
    // Ensure windowSize is always odd
    if (newSize % 2 === 0) {
      newSize += 1
    }
    setWindowSize(newSize)

    // Ensure polyOrder is always less than windowSize
    if (polyOrder >= newSize) {
      setPolyOrder(newSize - 1)
    }
  }

  const handlePolyOrderChange = (value: number[]) => {
    const newOrder = value[0]
    // Ensure polyOrder is always less than windowSize
    if (newOrder >= windowSize) {
      setPolyOrder(windowSize - 1)
    } else {
      setPolyOrder(newOrder)
    }
  }

  const handleDerivate = React.useCallback(() => {
    if (!selectedDerivate) {
      alert('Please select a derivate operation')
      return
    }

    // Final safeguard to prevent panic if window size is larger than data length.
    if (
      selectedFile &&
      selectedDerivate.includes('savitzky') &&
      windowSize > selectedFile.content.length
    ) {
      alert(
        `Error: Window Size (${windowSize}) cannot be larger than the number of data points (${selectedFile.content.length}).`
      )
      return
    }

    // Final validation before calling the function
    console.log(`Executing Derivate with: windowSize=${windowSize}, polyOrder=${polyOrder}`)
    if (selectedDerivate.includes('savitzky') && windowSize % 2 === 0) {
      alert(`Invalid Window Size: ${windowSize}. Window size must be an odd number.`)
      return
    }

    const res = derivate(selectedDerivate, windowSize, polyOrder, selectedFile)
    if (!res) return
    setNewFiles((prev) => [...prev, res])
  }, [derivate, selectedDerivate, windowSize, polyOrder, setNewFiles, selectedFile])

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

    // Final validation before calling the function
    console.log(
      `Executing Derivate Multiple with: windowSize=${windowSize}, polyOrder=${polyOrder}`
    )
    if (selectedDerivate.includes('savitzky') && windowSize % 2 === 0) {
      alert(`Invalid Window Size: ${windowSize}. Window size must be an odd number.`)
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

      {['savitzkyGolayDerivative', 'savitzkyGolaySmooth'].includes(selectedDerivate || '') && (
        <div className="flex gap-4 items-center">
          <div className="flex flex-col gap-2 w-40">
            <Label htmlFor="windowSize">Window Size: {windowSize}</Label>
            <Slider
              disabled={!selectedDerivate?.includes('savitzky')}
              value={[windowSize]}
              onValueChange={handleWindowSizeChange}
              min={3}
              max={25}
              step={2}
            />
          </div>
          <div className="flex flex-col gap-2 w-40">
            <Label htmlFor="polyOrder">Polynomial Order: {polyOrder}</Label>
            <Slider
              disabled={!selectedDerivate?.includes('savitzky')}
              value={[polyOrder]}
              onValueChange={handlePolyOrderChange}
              min={1}
              max={5}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default DerivateTab
