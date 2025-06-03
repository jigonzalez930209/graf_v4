import { useMemo } from 'react'
import * as LM from 'ml-levenberg-marquardt'

// Simple Gaussian model
export type GaussianParameters = {
  amplitude: number
  mean: number
  sigma: number
}

// Gaussian function generator
function gaussian([amplitude, mean, sigma]: number[]) {
  return (x: number) => amplitude * Math.exp(-((x - mean) ** 2) / (2 * sigma ** 2))
}

export interface LevenbergMarquardtOptions {
  damping?: number
  gradientDifference?: number
  maxIterations?: number
  errorTolerance?: number
  // initialValues?: number[] // (handled internally)
}

export interface UseGaussianIterationOptions {
  x: number[]
  y: number[]
  initialParams: GaussianParameters
  options?: LevenbergMarquardtOptions // extra options for the optimizer
}

export function useGaussianIteration({
  x,
  y,
  initialParams,
  options
}: UseGaussianIterationOptions) {
  // Fit parameters using Levenberg-Marquardt algorithm
  const result = useMemo(() => {
    if (!x || !y || x.length !== y.length || x.length === 0) return null
    // Initial parameter vector
    const initial = [initialParams.amplitude, initialParams.mean, initialParams.sigma]
    // Fitting function
    const fitted = LM.levenbergMarquardt(
      {
        x,
        y
      },
      gaussian,
      {
        initialValues: initial,
        ...options
      }
    )
    // Fitted curve
    const fittedCurve = x.map((xi) => gaussian(fitted.parameterValues)(xi))
    return {
      params: {
        amplitude: fitted.parameterValues[0],
        mean: fitted.parameterValues[1],
        sigma: fitted.parameterValues[2]
      },
      fittedCurve,
      residual: fitted.iterations,
      iterations: fitted.iterations,
      error: fitted.parameterError
    }
  }, [x, y, initialParams, options])

  return result
}
