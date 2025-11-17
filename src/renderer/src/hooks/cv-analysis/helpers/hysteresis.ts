import { HysteresisData } from '../types'

const GRID_POINTS = 256

const sortBranch = (potential: number[], current: number[]) => {
  const pairs = potential.map((value, idx) => ({ value, current: current[idx] }))
  pairs.sort((a, b) => a.value - b.value)
  return {
    potential: pairs.map((pair) => pair.value),
    current: pairs.map((pair) => pair.current)
  }
}

const createInterpolator = (potential: number[], current: number[]) => {
  if (!potential.length || potential.length !== current.length) {
    return () => 0
  }

  return (target: number) => {
    if (target <= potential[0]) return current[0]
    if (target >= potential[potential.length - 1]) return current[current.length - 1]

    for (let i = 0; i < potential.length - 1; i++) {
      const x1 = potential[i]
      const x2 = potential[i + 1]
      if (target >= x1 && target <= x2) {
        const ratio = (target - x1) / (x2 - x1)
        const y1 = current[i]
        const y2 = current[i + 1]
        return y1 + ratio * (y2 - y1)
      }
    }

    return current[current.length - 1]
  }
}

export const computeHysteresis = (potential: number[], current: number[]): HysteresisData => {
  if (potential.length < 3 || current.length < 3 || potential.length !== current.length) {
    return { area: 0, curve: [] }
  }

  const maxPotential = Math.max(...potential)
  const idxMax = potential.indexOf(maxPotential)
  if (idxMax <= 0 || idxMax >= potential.length - 1) {
    return { area: 0, curve: [] }
  }

  const forwardPotential = potential.slice(0, idxMax + 1)
  const forwardCurrent = current.slice(0, idxMax + 1)
  const reversePotential = potential.slice(idxMax)
  const reverseCurrent = current.slice(idxMax)

  const forward = sortBranch(forwardPotential, forwardCurrent)
  const reverse = sortBranch(reversePotential.reverse(), reverseCurrent.reverse())

  const startE = Math.max(forward.potential[0], reverse.potential[0])
  const endE = Math.min(
    forward.potential[forward.potential.length - 1],
    reverse.potential[reverse.potential.length - 1]
  )

  if (!Number.isFinite(startE) || !Number.isFinite(endE) || startE >= endE) {
    return { area: 0, curve: [] }
  }

  const interpForward = createInterpolator(forward.potential, forward.current)
  const interpReverse = createInterpolator(reverse.potential, reverse.current)

  const step = (endE - startE) / GRID_POINTS
  if (!Number.isFinite(step) || step <= 0) {
    return { area: 0, curve: [] }
  }

  const diffCurve: number[] = []
  const grid: number[] = []

  for (let i = 0; i <= GRID_POINTS; i++) {
    grid.push(startE + step * i)
  }

  let area = 0
  let prevDiff = 0

  grid.forEach((e, idx) => {
    const forwardValue = interpForward(e)
    const reverseValue = interpReverse(e)
    const diff = forwardValue - reverseValue
    diffCurve.push(diff)

    if (idx > 0) {
      const deltaE = grid[idx] - grid[idx - 1]
      area += ((prevDiff + diff) / 2) * deltaE
    }

    prevDiff = diff
  })

  return {
    area: Math.abs(area),
    curve: diffCurve
  }
}
