/**
 * Cubic Spline Interpolator (Custom)
 * Inspired by https://github.com/AdaskoTheBeAsT/Splines-TypeScript
 * Usage: const spline = new CubicSpline(xArray, yArray); spline.interpolate(x)
 */

import Decimal from 'decimal.js'

export class CubicSpline {
  private x: Decimal[]
  private y: Decimal[]
  private a: Decimal[]
  private b: Decimal[]
  private c: Decimal[]
  private d: Decimal[]

  /**
   * @param points Array of [x, y] pairs, where x and y are Decimals
   */
  constructor(points: [Decimal, Decimal][]) {
    if (points.length < 2) throw new Error('At least two points are required')
    // Copy and sort the data by x
    const sorted = points.slice().sort((a, b) => a[0].cmp(b[0]))
    this.x = sorted.map((p) => p[0])
    this.y = sorted.map((p) => p[1])
    const n = this.x.length
    const h: Decimal[] = new Array(n - 1)
    for (let i = 0; i < n - 1; i++) h[i] = this.x[i + 1].sub(this.x[i])
    // Build the tridiagonal system
    const alpha: Decimal[] = new Array(n - 1)
    for (let i = 1; i < n - 1; i++) {
      alpha[i] = new Decimal(3)
        .div(h[i])
        .mul(this.y[i + 1].sub(this.y[i]))
        .sub(new Decimal(3).div(h[i - 1]).mul(this.y[i].sub(this.y[i - 1])))
    }
    // Solve the tridiagonal system for c
    const l: Decimal[] = new Array(n)
    const mu: Decimal[] = new Array(n)
    const z: Decimal[] = new Array(n)
    l[0] = new Decimal(1)
    mu[0] = new Decimal(0)
    z[0] = new Decimal(0)
    for (let i = 1; i < n - 1; i++) {
      l[i] = this.x[i + 1]
        .sub(this.x[i - 1])
        .mul(2)
        .sub(h[i - 1].mul(mu[i - 1]))
      mu[i] = h[i].div(l[i])
      z[i] = alpha[i].sub(h[i - 1].mul(z[i - 1])).div(l[i])
    }
    l[n - 1] = new Decimal(1)
    z[n - 1] = new Decimal(0)
    this.c = new Array(n).fill(new Decimal(0))
    this.b = new Array(n - 1)
    this.d = new Array(n - 1)
    this.a = this.y.slice(0, n - 1)
    for (let j = n - 2; j >= 0; j--) {
      this.c[j] = z[j].sub(mu[j].mul(this.c[j + 1]))
      this.b[j] = this.y[j + 1]
        .sub(this.y[j])
        .div(h[j])
        .sub(h[j].mul(this.c[j + 1].add(this.c[j].mul(2))).div(3))
      this.d[j] = this.c[j + 1].sub(this.c[j]).div(h[j].mul(3))
    }
  }

  /**
   * Interpolates the value at x (Decimal or number).
   */
  interpolate(x: Decimal | number): Decimal {
    const n = this.x.length
    const xVal = new Decimal(x)
    // Find the correct segment
    let i = n - 2
    if (xVal.lte(this.x[0])) i = 0
    else if (xVal.gte(this.x[n - 1])) i = n - 2
    else {
      for (let j = 0; j < n - 1; j++) {
        if (xVal.gte(this.x[j]) && xVal.lte(this.x[j + 1])) {
          i = j
          break
        }
      }
    }
    const dx = xVal.sub(this.x[i])
    return this.a[i]
      .add(this.b[i].mul(dx))
      .add(this.c[i].mul(dx.pow(2)))
      .add(this.d[i].mul(dx.pow(3)))
  }

  /**
   * Computes the definite integral between the spline and the straight line connecting two points, over [x1, x2].
   * @param p1 [x1, y1] as Decimals
   * @param p2 [x2, y2] as Decimals
   * @returns The area (as Decimal) between the spline and the line from x1 to x2
   */
  integralDifferenceWithLine(p1: [Decimal, Decimal], p2: [Decimal, Decimal]): Decimal {
    const [x1, y1] = p1
    const [x2, y2] = p2
    if (x2.lte(x1)) throw new Error('x2 must be greater than x1')

    // Line equation: y = m * x + b
    const m = y2.sub(y1).div(x2.sub(x1))
    const b = y1.sub(m.mul(x1))
    // Integral of the line from x1 to x2
    // ∫ (m x + b) dx = (m/2) x^2 + b x
    const lineIntegral = m
      .div(2)
      .mul(x2.pow(2).sub(x1.pow(2)))
      .add(b.mul(x2.sub(x1)))

    // Integral of the spline from x1 to x2 (sum over relevant segments)
    let splineIntegral = new Decimal(0)
    let a = x1
    const b_ = x2
    // Find the first segment
    let i = this.x.length - 2
    for (let j = 0; j < this.x.length - 1; j++) {
      if (a.gte(this.x[j]) && a.lte(this.x[j + 1])) {
        i = j
        break
      }
    }
    while (a.lt(b_)) {
      const segStart = this.x[i]
      const segEnd = this.x[i + 1]
      const left = Decimal.max(a, segStart)
      const right = Decimal.min(b_, segEnd)
      if (right.lte(left)) {
        i++
        if (i >= this.x.length - 1) break
        continue
      }
      // Integrate cubic polynomial on [left, right]
      // S(x) = a + b*(x-xi) + c*(x-xi)^2 + d*(x-xi)^3
      const dx1 = left.sub(segStart)
      const dx2 = right.sub(segStart)
      const A = this.a[i]
      const B = this.b[i]
      const C = this.c[i]
      const D = this.d[i]
      // Indefinite integral: A*x + B/2*(x-xi)^2 + C/3*(x-xi)^3 + D/4*(x-xi)^4
      const F = (dx: Decimal) =>
        A.mul(dx)
          .add(B.div(2).mul(dx.pow(2)))
          .add(C.div(3).mul(dx.pow(3)))
          .add(D.div(4).mul(dx.pow(4)))
      splineIntegral = splineIntegral.add(F(dx2).sub(F(dx1)))
      i++
      if (i >= this.x.length - 1) break
      a = right
    }
    return splineIntegral.sub(lineIntegral).abs()
  }
}

// Example usage:
// const spline = new CubicSpline([ [new Decimal(0), new Decimal(0)], [new Decimal(1), new Decimal(1)], [new Decimal(2), new Decimal(0)] ]);
// const y = spline.interpolate(new Decimal(1.5));
// const area = spline.integralDifferenceWithLine([new Decimal(0), new Decimal(0)], [new Decimal(2), new Decimal(0)]);
