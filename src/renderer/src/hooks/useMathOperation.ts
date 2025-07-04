import { generateRandomId } from '@renderer/utils/common'
import { COLORS } from '@shared/constants'
import { IProcessFile } from '@shared/models/files'
import Decimal from 'decimal.js'

function validatePairArray(arr: unknown, name: string): asserts arr is Decimal[][] {
  // Check if input is an array
  if (!Array.isArray(arr)) {
    throw new Error(`${name} must be an array.`)
  }
  // Check if array is not empty
  if (arr.length === 0) {
    throw new Error(`${name} cannot be empty.`)
  }
  // Check each element is a pair of numbers
  arr.forEach((item, idx) => {
    if (!Array.isArray(item) || item.length !== 2) {
      throw new Error(`Element at position ${idx} in ${name} is not a pair [a, b].`)
    }
    if (!Decimal.isDecimal(item[0]) || !Decimal.isDecimal(item[1])) {
      throw new Error(`Elements of the pair at position ${idx} in ${name} must be numbers.`)
    }
  })
}

function validateSameLength(a: Decimal[][], b: Decimal[][]) {
  if (a.length !== b.length) {
    throw new Error('Both arrays must have the same length.')
  }
}

interface HandleOperationParams {
  operation: string
  arr1: Decimal[][]
  options: {
    folderPath: string
    name: string
  }
  arr2?: Decimal[][]
}

export const useMathOperation = () => {
  // Sum point by point
  /**
   * Returns the sum of two arrays of pairs number[], point by point.
   * @param a First array of pairs
   * @param b Second array of pairs
   * @returns Array of pairs with the sum of each component
   * @throws Error if arrays are not valid or do not have the same length
   */
  const sum = (a: Decimal[][], b: Decimal[][]): Decimal[][] => {
    validatePairArray(a, 'First array')
    validatePairArray(b, 'Second array')
    validateSameLength(a, b)
    return a.map((item, idx) => {
      const r1 = item[0].add(b[idx][0]).div(2)
      const r2 = item[1].add(b[idx][1])

      return [r1, r2]
    })
  }

  // Subtraction point by point
  /**
   * Returns the difference of two arrays of pairs number[], point by point.
   * @param a First array of pairs
   * @param b Second array of pairs
   * @returns Array of pairs with the difference of each component
   * @throws Error if arrays are not valid or do not have the same length
   */
  const subtractArrays = (a: Decimal[][], b: Decimal[][]): Decimal[][] => {
    validatePairArray(a, 'First array')
    validatePairArray(b, 'Second array')
    validateSameLength(a, b)
    return a.map((item, idx) => {
      const r1 = item[1].sub(b[idx][1])
      const r2 = item[0].add(b[idx][0]).div(2)
      return [r2, r1]
    })
  }

  // Multiply point by point
  /**
   * Returns the product of two arrays of pairs number[], point by point.
   * @param a First array of pairs
   * @param b Second array of pairs
   * @returns Array of pairs with the product of each component
   * @throws Error if arrays are not valid or do not have the same length
   */
  const multiplyArrays = (a: Decimal[][], b: Decimal[][]): Decimal[][] => {
    validatePairArray(a, 'First array')
    validatePairArray(b, 'Second array')
    validateSameLength(a, b)
    return a.map((item, idx) => {
      const r1 = item[0].add(b[idx][0]).div(2)
      const r2 = item[1].mul(b[idx][1])
      return [r1, r2]
    })
  }

  // Division point by point
  /**
   * Returns the quotient of two arrays of pairs number[], point by point.
   * @param a First array of pairs
   * @param b Second array of pairs
   * @returns Array of pairs with the quotient of each component
   * @throws Error if arrays are not valid or do not have the same length or division by zero occurs
   */
  const divideArrays = (a: Decimal[][], b: Decimal[][]): Decimal[][] => {
    validatePairArray(a, 'First array')
    validatePairArray(b, 'Second array')
    validateSameLength(a, b)
    return a.map((item, idx) => {
      const r1 = item[0].add(b[idx][0]).div(2)
      const r2 = item[1].div(b[idx][1])

      return [r1, r2]
    })
  }

  // Dot product point by point
  /**
   * Returns the dot product of two arrays of pairs number[], point by point.
   * @param a First array of pairs
   * @param b Second array of pairs
   * @returns Array of numbers with the dot product of each pair
   * @throws Error if arrays are not valid or do not have the same length
   */
  const dotProduct = (a: Decimal[][], b: Decimal[][]): Decimal[] => {
    validatePairArray(a, 'First array')
    validatePairArray(b, 'Second array')
    validateSameLength(a, b)
    return a.map((item, idx) => item[0].mul(b[idx][0]).add(item[1].mul(b[idx][1])))
  }

  // Euclidean distance point by point
  /**
   * Returns the Euclidean distance between two arrays of pairs number[], point by point.
   * @param a First array of pairs
   * @param b Second array of pairs
   * @returns Array of numbers with the Euclidean distance of each pair
   * @throws Error if arrays are not valid or do not have the same length
   */
  const euclideanDistance = (a: Decimal[][], b: Decimal[][]): Decimal[] => {
    validatePairArray(a, 'First array')
    validatePairArray(b, 'Second array')
    validateSameLength(a, b)
    return a.map((item, idx) => Decimal.hypot(item[0].sub(b[idx][0]), item[1].sub(b[idx][1])))
  }

  // Norm (magnitude) of each vector
  /**
   * Returns the norm (magnitude) of each pair number[] in the array.
   * @param a Array of pairs
   * @returns Array of numbers with the magnitude of each pair
   * @throws Error if array is not valid
   */
  const norm = (a: Decimal[][]): Decimal[] => {
    validatePairArray(a, 'Input array')
    return a.map((item) => Decimal.hypot(item[0], item[1]))
  }

  // Angle between vectors point by point (in radians)
  /**
   * Returns the angle (in radians) between corresponding pairs in two arrays, point by point.
   * @param a First array of pairs
   * @param b Second array of pairs
   * @returns Array of numbers with the angle (in radians) between each pair
   * @throws Error if arrays are not valid, do not have the same length, or a zero-length vector is encountered
   */
  const angleBetween = (a: Decimal[][], b: Decimal[][]): Decimal[] => {
    validatePairArray(a, 'First array')
    validatePairArray(b, 'Second array')
    validateSameLength(a, b)
    return a.map((item, idx) => {
      const dot = item[0].mul(b[idx][0]).add(item[1].mul(b[idx][1]))
      const normA = item[0].mul(item[0]).add(item[1].mul(item[1]))
      const normB = b[idx][0].mul(b[idx][0]).add(b[idx][1].mul(b[idx][1]))
      if (normA.eq(0) || normB.eq(0)) {
        throw new Error('Cannot compute angle with zero-length vector')
      }
      // Clamp value to [-1,1] to avoid NaN due to floating point errors
      const cosTheta = Decimal.max(-1, Decimal.min(1, dot.div(normA.mul(normB))))
      return Decimal.acos(cosTheta)
    })
  }

  // Element-wise power: raise each component to the power of the corresponding component in b
  /**
   * Raises each component of the first array to the power of the corresponding component in the second array, point by point.
   * @param a First array of pairs (base)
   * @param b Second array of pairs (exponent)
   * @returns Array of pairs with powered components
   * @throws Error if arrays are not valid or do not have the same length
   */
  const elementWisePower = (a: Decimal[][], b: Decimal[][]): Decimal[][] => {
    validatePairArray(a, 'First array')
    validatePairArray(b, 'Second array')
    validateSameLength(a, b)
    return a.map((item, idx) => [item[0].pow(b[idx][0]), item[1].pow(b[idx][1])])
  }

  // Component-wise min
  /**
   * Returns the component-wise minimum between two arrays of pairs number[], point by point.
   * @param a First array of pairs
   * @param b Second array of pairs
   * @returns Array of pairs with the minimum of each component
   * @throws Error if arrays are not valid or do not have the same length
   */
  const minComponentWise = (a: Decimal[][], b: Decimal[][]): Decimal[][] => {
    validatePairArray(a, 'First array')
    validatePairArray(b, 'Second array')
    validateSameLength(a, b)
    return a.map((item, idx) => [Decimal.min(item[0], b[idx][0]), Decimal.min(item[1], b[idx][1])])
  }

  // Component-wise max
  /**
   * Returns the component-wise maximum between two arrays of pairs number[], point by point.
   * @param a First array of pairs
   * @param b Second array of pairs
   * @returns Array of pairs with the maximum of each component
   * @throws Error if arrays are not valid or do not have the same length
   */
  const maxComponentWise = (a: Decimal[][], b: Decimal[][]): Decimal[][] => {
    validatePairArray(a, 'First array')
    validatePairArray(b, 'Second array')
    validateSameLength(a, b)
    return a.map((item, idx) => [Decimal.max(item[0], b[idx][0]), Decimal.max(item[1], b[idx][1])])
  }

  // Projection of a onto b point by point
  /**
   * Returns the projection of each pair in the first array onto the corresponding pair in the second array, point by point.
   * @param a First array of pairs (to be projected)
   * @param b Second array of pairs (direction)
   * @returns Array of pairs with the projection of each vector
   * @throws Error if arrays are not valid, do not have the same length, or projection onto zero vector is attempted
   */
  const projection = (a: Decimal[][], b: Decimal[][]): Decimal[][] => {
    validatePairArray(a, 'First array')
    validatePairArray(b, 'Second array')
    validateSameLength(a, b)
    return a.map((item, idx) => {
      const dot = item[0].mul(b[idx][0]).add(item[1].mul(b[idx][1]))
      const normBSquared = b[idx][0].mul(b[idx][0]).add(b[idx][1].mul(b[idx][1]))
      if (normBSquared.eq(0)) {
        throw new Error('Cannot project onto zero vector')
      }
      const scalar = dot.div(normBSquared)
      return [b[idx][0].mul(scalar), b[idx][1].mul(scalar)]
    })
  }

  /**
   * Handles the operation based on the selected operation and returns the result as a new file.
   * @param operation The selected operation
   * @param a The first array of pairs
   * @param b The second array of pairs (optional)
   * @param options Optional parameters
   * @param options.folderPath The folder path where the file will be saved
   * @param options.name The name of the file
   * @returns The result as a new file
   * @throws Error if the operation is not valid or if the arrays are not valid
   */

  const handleOperation = ({
    operation,
    arr1,
    options,
    arr2
  }: HandleOperationParams): IProcessFile => {
    let res: Decimal[][] = []
    switch (operation) {
      case 'sum':
        if (!arr2) {
          throw new Error('Second array is required for sum operation')
        }
        res = sum(arr1, arr2)
        break
      case 'avg':
        if (!arr2) {
          throw new Error('Second array is required for avg operation')
        }
        res = sum(arr1, arr2).map(([x, y]) => [x.div(2), y.div(2)])
        break
      case 'diff':
        if (!arr2) {
          throw new Error('Second array is required for diff operation')
        }
        res = subtractArrays(arr1, arr2)
        break
      case 'multiply':
        if (!arr2) {
          throw new Error('Second array is required for multiply operation')
        }
        res = multiplyArrays(arr1, arr2)
        break
      case 'divide':
        if (!arr2) {
          throw new Error('Second array is required for divide operation')
        }
        res = divideArrays(arr1, arr2)
        break
      case 'projection':
        if (!arr2) {
          throw new Error('Second array is required for projection operation')
        }
        res = projection(arr1, arr2)
        break
      case 'elementWisePower':
        if (!arr2) {
          throw new Error('Second array is required for elementWisePower operation')
        }
        res = elementWisePower(arr1, arr2)
        break
      case 'maxComponentWise':
        if (!arr2) {
          throw new Error('Second array is required for maxComponentWise operation')
        }
        res = maxComponentWise(arr1, arr2)
        break
      case 'minComponentWise':
        if (!arr2) {
          throw new Error('Second array is required for minComponentWise operation')
        }
        res = minComponentWise(arr1, arr2)
        break
      default:
        alert('Select an operation')
        break
    }
    if (!res) {
      throw new Error('Result is undefined')
    }
    const id = generateRandomId()
    const generatedFile: IProcessFile = {
      id,
      name: options.name,
      type: 'teq4',
      content: res.map(([x, y]) => [x.toString(), y.toString()]),
      selected: true,
      relativePath: `${options?.folderPath}`,
      color: COLORS[Decimal.floor(Decimal.random().mul(COLORS.length)).toNumber()]
    }
    return generatedFile
  }

  return {
    sum,
    subtract: subtractArrays,
    multiply: multiplyArrays,
    divide: divideArrays,
    dotProduct,
    euclideanDistance,
    norm,
    angleBetween,
    elementWisePower,
    minComponentWise,
    maxComponentWise,
    projection,
    handleOperation
  }
}
