import Decimal from 'decimal.js'
import { calculatePeakHeight, calculatePeakInfo } from './peak-height'

// Example data points (simulating a voltammetry curve)
const examplePoints: [string, string][] = [
  ['0.0', '0.1'],
  ['0.1', '0.2'],
  ['0.2', '0.5'],
  ['0.3', '1.0'],
  ['0.4', '1.5'],
  ['0.5', '1.2'],
  ['0.6', '0.8'],
  ['0.7', '0.4'],
  ['0.8', '0.2'],
  ['0.9', '0.1']
]

// Define baseline points (simulating user selection)
const p1 = {
  x: new Decimal('0.0'),
  y: new Decimal('0.1'),
  pointIndex: 0
}

const p2 = {
  x: new Decimal('0.9'),
  y: new Decimal('0.1'),
  pointIndex: 9
}

// Calculate peak height and info
const peakHeight = calculatePeakHeight(examplePoints, p1, p2)
const peakInfo = calculatePeakInfo(examplePoints, p1, p2)

console.log('Peak Height:', peakHeight.toString())
console.log('Peak Info:', {
  peakHeight: peakInfo.peakHeight.toString(),
  peakX: peakInfo.peakX.toString(),
  peakY: peakInfo.peakY.toString(),
  peakIndex: peakInfo.peakIndex
})

// Function to run this test
export function testPeakHeight(): void {
  console.log('Running peak height calculation test...')
  console.log('Peak Height:', peakHeight.toString())
  console.log('Peak Info:', {
    peakHeight: peakInfo.peakHeight.toString(),
    peakX: peakInfo.peakX.toString(),
    peakY: peakInfo.peakY.toString(),
    peakIndex: peakInfo.peakIndex
  })
  console.log('Test completed')
}
