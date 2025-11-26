/* eslint-disable react-refresh/only-export-components */
import { useData } from '@renderer/hooks/useData'
import { useFit } from '@renderer/hooks/useFit'
import { useMathOperation } from '@renderer/hooks/useMathOperation'
import { generateRandomId } from '@renderer/utils/common'

import init from 'math-lib'
import { COLORS } from '@shared/constants'
import { IProcessFile } from '@shared/models/files'
import Decimal from 'decimal.js'
import _ from 'lodash'
import React, { createContext, ReactNode, useCallback, useEffect, useState } from 'react'
import { useLocalStorage } from 'usehooks-ts'
import {
  savitzkyGolayDerivative as sgDerivative,
  savitzkyGolaySmooth as sgSmooth
} from '@renderer/utils/math'

export interface IntegralResultRow {
  id: string
  curveName: string
  area: string
  peakHeight: string
  peakX: string
  peakY: string
}

export interface VCAnalysisContextType {
  selectedPoint: Record<string, Array<{ x: Decimal; y: Decimal; uid: string; pointIndex: number }>>
  setSelectedPoint: React.Dispatch<
    React.SetStateAction<
      Record<string, Array<{ x: Decimal; y: Decimal; uid: string; pointIndex: number }>>
    >
  >

  selectedOperation: string | null
  selectedFit: string | null
  selectedDerivate: string | null

  countPoints: number
  selectedPoints: number[]
  selectedDegree: number

  windowSize: number
  polyOrder: number

  inputExpression: { '1': string; '2': string }

  handleProcess: () => void
  handleProcessMultiple: () => void
  handleFit: () => void
  handleFitMultiple: () => void
  handleManualSelection: (points: number[], degree: number) => void
  setInputExpression: React.Dispatch<React.SetStateAction<{ '1': string; '2': string }>>
  setSelectedOperation: React.Dispatch<React.SetStateAction<string | null>>
  setSelectedFit: React.Dispatch<React.SetStateAction<string | null>>
  setSelectedDerivate: React.Dispatch<React.SetStateAction<string | null>>
  setCountPoints: React.Dispatch<React.SetStateAction<number>>
  setSelectedPoints: React.Dispatch<React.SetStateAction<number[]>>
  setSelectedDegree: React.Dispatch<React.SetStateAction<number>>
  setWindowSize: React.Dispatch<React.SetStateAction<number>>
  setPolyOrder: React.Dispatch<React.SetStateAction<number>>

  // Integral results for all analyzed curves
  integralResults: IntegralResultRow[]
  setIntegralResults: React.Dispatch<React.SetStateAction<IntegralResultRow[]>>
  derivate: (
    operation: string,
    windowSize?: number,
    polyOrder?: number,
    file?: IProcessFile
  ) => IProcessFile | null
  derivateMultiple: (operation: string, windowSize?: number, polyOrder?: number) => IProcessFile[]
}

export const VCAnalysisContext = createContext<VCAnalysisContextType | undefined>(undefined)

export type VCAnalysisProviderProps = {
  children: ReactNode
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const VCAnalysisProvider: React.FC<VCAnalysisProviderProps> = ({ children }) => {
  const { data: files, addFiles } = useData()

  const [selectedOperation, setSelectedOperation] = useState<string | null>(null)
  const [selectedFit, setSelectedFit] = useState<string | null>(null)
  const [selectedDerivate, setSelectedDerivate] = useState<string | null>(null)

  const [windowSize, setWindowSize] = useLocalStorage<number>('windowSize', 3)
  const [polyOrder, setPolyOrder] = useLocalStorage<number>('polyOrder', 1)

  useEffect(() => {
    // This effect sanitizes the windowSize value loaded from localStorage.
    // It ensures that the value is always odd, preventing panics in the Rust code
    // if an even number was persisted in a previous session.
    if (windowSize % 2 === 0) {
      setWindowSize(windowSize + 1)
    }
    // We only want this to run when the component mounts and if the value changes from an external source.
  }, [windowSize, setWindowSize])

  const [countPoints, setCountPoints] = useLocalStorage<number>('countPoints', 6)
  const [selectedPoints, setSelectedPoints] = useLocalStorage<number[]>('selectedPoints', [])
  const [selectedDegree, setSelectedDegree] = useLocalStorage<number>('selectedDegree', 0)

  const [inputExpression, setInputExpression] = useState<{ '1': string; '2': string }>({
    '1': '',
    '2': ''
  })
  const [selectedPoint, setSelectedPoint] = useState<
    Record<string, Array<{ x: Decimal; y: Decimal; uid: string; pointIndex: number }>>
  >({})

  // Store all calculated integrals and peaks for the session
  const [integralResults, setIntegralResults] = useState<IntegralResultRow[]>([])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [wasm, setWasm] = useState<any>(null)
  useEffect(() => {
    init().then((wasmModule) => {
      // Initialize the panic hook to get better error messages from Rust
      wasmModule.set_panic_hook()
      setWasm(wasmModule)
    })
  }, [])

  const { handleOperation } = useMathOperation()
  const { fit, fitMultiple } = useFit()

  const getSelectedFiles = useCallback(() => {
    return files.filter((f) => f.selected).sort((a, b) => Number(a.selected) - Number(b.selected))
  }, [files])

  const handleProcess = useCallback(() => {
    const selectedFiles = getSelectedFiles()

    if (selectedFiles.length < 2) {
      alert('Please select at least two files')
      return
    }

    const fileA = selectedFiles[0]
    const fileB = selectedFiles[1]

    const arrA = fileA?.content.map((c) => [Decimal(c[0]), Decimal(c[1])])
    const arrB = fileB?.content.map((c) => [Decimal(c[0]), Decimal(c[1])])
    console.log({ arrA, arrB, selectedFiles, selectedOperation })

    if (!arrA || !arrB) {
      alert('Invalid input, Arr1 or Arr2 is undefined')
      return
    }
    if (!selectedOperation) {
      alert('Please select an operation')
      return
    }

    const res = handleOperation({
      operation: selectedOperation,
      arr1: arrA,
      options: {
        name: `${fileA?.name}-${selectedOperation}-${fileB?.name}`,
        folderPath: fileA?.relativePath || selectedOperation
      },
      arr2: arrB
    })
    addFiles([res])
  }, [selectedOperation, handleOperation, addFiles, getSelectedFiles])

  const handleProcessMultiple = useCallback(() => {
    if (!inputExpression['1'] || !inputExpression['2'] || !selectedOperation) {
      alert('Please enter both expressions and select an operation')
      return
    }
    const groupByFolder = _.groupBy(files, 'relativePath')

    const filesToWork = Object.entries(groupByFolder).map(([folderPath, files]) => {
      const a = files.find((f) => f.name.toLowerCase().includes(inputExpression['1'].toLowerCase()))
      const b = files.find((f) => f.name.toLowerCase().includes(inputExpression['2'].toLowerCase()))
      if (!a || !b) {
        console.error('Invalid input, Arr1 or Arr2 is undefined')
        // alert('Invalid input, Arr1 or Arr2 is undefined')
        return null
      }

      const arrA = a.content.map((c) => [Decimal(c[0]), Decimal(c[1])])
      const arrB = b.content.map((c) => [Decimal(c[0]), Decimal(c[1])])
      const res = handleOperation({
        operation: selectedOperation,
        arr1: arrA,
        options: {
          name: `${a.name}-${selectedOperation}-${b.name}`,
          folderPath
        },
        arr2: arrB
      })
      return res
    })
    addFiles(filesToWork.filter((f) => !!f) as IProcessFile[])
  }, [files, inputExpression, selectedOperation, handleOperation, addFiles])

  const handleFit = useCallback(() => {
    const files = getSelectedFiles()
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
    addFiles([f])
  }, [fit, selectedPoints, selectedDegree, addFiles, getSelectedFiles])

  const handleFitMultiple = useCallback(() => {
    const selectedFiles = getSelectedFiles()
    if (selectedFiles.length === 0) {
      alert('Please select at least one file')
      return
    }
    const res = fitMultiple(selectedFiles)
    addFiles(res.map((r) => r.file))
  }, [fitMultiple, addFiles, getSelectedFiles])

  const handleManualSelection = useCallback(
    (points: number[], degree: number) => {
      setSelectedPoints(points)
      setSelectedDegree(degree)
      console.log({ points, degree })
    },
    [setSelectedPoints, setSelectedDegree]
  )

  const derivate = useCallback(
    (
      operation: string,
      windowSize?: number,
      polyOrder?: number,
      file?: IProcessFile
    ): IProcessFile | null => {
      console.log(
        `Context 'derivate' received: operation=${operation}-windowSize=${windowSize}-polyOrder=${polyOrder}`
      )

      const selectedFile = file

      console.log('File being processed in context:', {
        fileName: selectedFile?.name,
        fileLength: selectedFile?.content?.length
      })

      if (!selectedFile || !selectedFile.content || selectedFile.content.length === 0) {
        alert('Error in context: No valid file or file content to process.')
        return null
      }

      let res: [Decimal, Decimal][] = []

      // Prepare data for Wasm by creating a single, flattened, interleaved array of coordinates.
      // This is a more robust way to pass data to Wasm.
      const flatCoords = new Float64Array(selectedFile.content.flat().map((c) => parseFloat(c)))

      switch (operation) {
        case 'numericalDerivative':
          if (wasm) {
            console.log('Calling wasm.numerical_derivative with:', flatCoords)
            const deriv_flat = wasm.numerical_derivative(flatCoords)
            console.log(`TS received deriv_flat with length: ${deriv_flat.length}`)

            // Unflatten the result: [x1, dy/dx1, x2, dy/dx2, ...] -> [[x1, dy/dx1], [x2, dy/dx2], ...]
            const unflattened_res: [Decimal, Decimal][] = []
            for (let i = 0; i < deriv_flat.length; i += 2) {
              unflattened_res.push([new Decimal(deriv_flat[i]), new Decimal(deriv_flat[i + 1])])
            }
            res = unflattened_res
          } else {
            res = [] // Fallback or loading state
          }
          break
        case 'savitzkyGolayDerivative':
          if (wasm) {
            console.log('Calling wasm.savitzky_golay_derivative with:', flatCoords)
            const deriv_flat = wasm.savitzky_golay_derivative(windowSize!, polyOrder!, flatCoords)
            const unflattened_res: [Decimal, Decimal][] = []
            for (let i = 0; i < deriv_flat.length; i += 2) {
              unflattened_res.push([new Decimal(deriv_flat[i]), new Decimal(deriv_flat[i + 1])])
            }
            res = unflattened_res
          } else {
            // Fallback to TS implementation
            const coordsDecimal: [Decimal, Decimal][] = selectedFile.content.map(([x, y]) => [
              new Decimal(x),
              new Decimal(y)
            ])
            res = sgDerivative(coordsDecimal, windowSize!, polyOrder!)
          }
          break
        case 'savitzkyGolaySmooth':
          if (wasm) {
            console.log('Calling wasm.savitzky_golay_smooth with:', flatCoords)
            const smoothed_flat = wasm.savitzky_golay_smooth(windowSize!, polyOrder!, flatCoords)
            const unflattened_res: [Decimal, Decimal][] = []
            for (let i = 0; i < smoothed_flat.length; i += 2) {
              unflattened_res.push([
                new Decimal(smoothed_flat[i]),
                new Decimal(smoothed_flat[i + 1])
              ])
            }
            res = unflattened_res
          } else {
            // Fallback to TS implementation
            const coordsDecimal: [Decimal, Decimal][] = selectedFile.content.map(([x, y]) => [
              new Decimal(x),
              new Decimal(y)
            ])
            res = sgSmooth(coordsDecimal, windowSize!, polyOrder!)
          }
          break
        default:
          console.warn(`Unknown derivative operation: ${operation}`)
          return null
      }

      if (!res || res.length === 0) {
        console.warn(`Operation ${operation} produced no result.`)
        return null
      }

      const id = generateRandomId()

      const name =
        operation === 'numericalDerivative'
          ? `Derivative of ${selectedFile.name}`
          : `${operation} (w=${windowSize}-p=${polyOrder}) of ${selectedFile.name}`

      return {
        ...selectedFile,
        id,
        content: res.map((p) => [p[0].toString(), p[1].toString()]),
        selected: true,
        name,
        color: COLORS[Decimal.floor(Decimal.random().mul(COLORS.length)).toNumber()]
      }
    },
    [wasm]
  )

  const derivateMultiple = useCallback(
    (operation: string, windowSize?: number, polyOrder?: number): IProcessFile[] => {
      const selectedFiles = getSelectedFiles()
      if (selectedFiles.length < 2) {
        alert('Please select at least two files')
        return []
      }
      const newFiles = selectedFiles
        .map((file) => derivate(operation, windowSize, polyOrder, file))
        .filter((file) => file !== null) as IProcessFile[]
      addFiles(newFiles)
      return newFiles
    },
    [derivate, getSelectedFiles, addFiles]
  )

  return (
    <VCAnalysisContext.Provider
      value={{
        selectedPoint,
        setSelectedPoint,
        selectedOperation,
        setSelectedOperation,
        selectedFit,
        setSelectedFit,
        selectedDerivate,
        setSelectedDerivate,
        countPoints,
        setCountPoints,
        selectedPoints,
        setSelectedPoints,
        selectedDegree,
        setSelectedDegree,
        windowSize,
        setWindowSize,
        polyOrder,
        setPolyOrder,
        inputExpression,
        setInputExpression,
        handleProcess,
        handleProcessMultiple,
        handleFit,
        handleFitMultiple,
        handleManualSelection,
        derivate,
        derivateMultiple,
        integralResults,
        setIntegralResults
      }}
    >
      {children}
    </VCAnalysisContext.Provider>
  )
}

export default VCAnalysisProvider
