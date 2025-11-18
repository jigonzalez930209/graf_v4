import { CV_THRESHOLDS } from '../constants'
import { DiagnoseParams, Diagnostics, MechanismType } from '../types'
import { computeLinearRegression } from './laviron'

const { slopeTolerance, hysteresisArea, deltaEpKinetic } = CV_THRESHOLDS

const withinTolerance = (value: number, target: number, tolerance: number) =>
  Math.abs(value - target) <= tolerance

/**
 * Tipo de control del proceso electroquímico
 */
export type ControlType = 'diffusion' | 'adsorption' | 'mixed' | 'unknown'

/**
 * Tipo de reversibilidad
 */
export type ReversibilityType = 'reversible' | 'quasi-reversible' | 'irreversible' | 'unknown'

/**
 * Resultado de clasificación de reversibilidad
 */
export interface ReversibilityClassification {
  type: ReversibilityType
  confidence: number
  deltaEp: number // mV
  ipRatio: number | null // Ip,a / Ip,c
  notes: string[]
}

/**
 * Resultado del análisis de control
 */
export interface ControlAnalysisResult {
  controlType: ControlType
  confidence: number
  slopeIpVsSqrtV: number | null // Para difusión
  r2IpVsSqrtV: number | null
  slopeIpVsV: number | null // Para adsorción
  r2IpVsV: number | null
  slopeLogIpVsLogV: number | null // Diagnóstico general
  r2LogIpVsLogV: number | null
  notes: string[]
}

/**
 * Analiza el tipo de control (difusión vs adsorción) a partir de correlaciones
 *
 * @param peakCurrents - Corrientes de pico (A)
 * @param scanRates - Velocidades de barrido (V/s)
 * @returns Análisis completo del control
 */
export const analyzeControl = (
  peakCurrents: number[],
  scanRates: number[]
): ControlAnalysisResult => {
  const notes: string[] = []
  let controlType: ControlType = 'unknown'
  let confidence = 0.4

  if (peakCurrents.length < 2 || scanRates.length < 2) {
    notes.push('Datos insuficientes para análisis de control')
    return {
      controlType,
      confidence,
      slopeIpVsSqrtV: null,
      r2IpVsSqrtV: null,
      slopeIpVsV: null,
      r2IpVsV: null,
      slopeLogIpVsLogV: null,
      r2LogIpVsLogV: null,
      notes
    }
  }

  // 1. Ip vs √v (difusión)
  const sqrtV = scanRates.map((v) => Math.sqrt(v))
  const regressionSqrtV = computeLinearRegression(sqrtV, peakCurrents)

  // 2. Ip vs v (adsorción)
  const regressionV = computeLinearRegression(scanRates, peakCurrents)

  // 3. log(Ip) vs log(v) (diagnóstico general)
  const logIp = peakCurrents.map((ip) => Math.log(Math.abs(ip)))
  const logV = scanRates.map((v) => Math.log(v))
  const regressionLogLog = computeLinearRegression(logV, logIp)

  // Análisis de resultados
  const r2SqrtV = regressionSqrtV?.r2 || 0
  const r2V = regressionV?.r2 || 0
  const slopeLogLog = regressionLogLog?.slope || 0

  // Determinar control basado en mejor ajuste y pendiente log-log
  if (regressionLogLog && regressionLogLog.r2 > 0.85) {
    if (withinTolerance(slopeLogLog, 0.5, slopeTolerance)) {
      controlType = 'diffusion'
      confidence = 0.9
      notes.push('log(Ip) vs log(v): slope ≈ 0.5 → Control difusional (Randles-Sevcik)')

      if (r2SqrtV > 0.9) {
        confidence = 0.95
        notes.push(`Ip vs √v: R² = ${r2SqrtV.toFixed(3)} confirma control difusional`)
      }
    } else if (withinTolerance(slopeLogLog, 1.0, slopeTolerance)) {
      controlType = 'adsorption'
      confidence = 0.9
      notes.push('log(Ip) vs log(v): slope ≈ 1.0 → Control por adsorción')

      if (r2V > 0.9) {
        confidence = 0.95
        notes.push(`Ip vs v: R² = ${r2V.toFixed(3)} confirma control por adsorción`)
      }
    } else if (slopeLogLog > 0.5 && slopeLogLog < 1.0) {
      controlType = 'mixed'
      confidence = 0.7
      notes.push(`log(Ip) vs log(v): slope = ${slopeLogLog.toFixed(2)} → Control mixto`)
    }
  } else {
    // Si log-log no es concluyente, comparar R² de ajustes lineales
    if (r2SqrtV > r2V && r2SqrtV > 0.85) {
      controlType = 'diffusion'
      confidence = 0.75
      notes.push(`Mejor ajuste con Ip vs √v (R² = ${r2SqrtV.toFixed(3)}) → Control difusional`)
    } else if (r2V > r2SqrtV && r2V > 0.85) {
      controlType = 'adsorption'
      confidence = 0.75
      notes.push(`Mejor ajuste con Ip vs v (R² = ${r2V.toFixed(3)}) → Control por adsorción`)
    }
  }

  if (notes.length === 0) {
    notes.push('Datos insuficientes o comportamiento no concluyente')
  }

  return {
    controlType,
    confidence,
    slopeIpVsSqrtV: regressionSqrtV?.slope || null,
    r2IpVsSqrtV: regressionSqrtV?.r2 || null,
    slopeIpVsV: regressionV?.slope || null,
    r2IpVsV: regressionV?.r2 || null,
    slopeLogIpVsLogV: regressionLogLog?.slope || null,
    r2LogIpVsLogV: regressionLogLog?.r2 || null,
    notes
  }
}

/**
 * Diagnóstico de mecanismo (función original mejorada)
 */
export const diagnoseMechanism = ({
  anodicPeak,
  cathodicPeak,
  deltaEp,
  hysteresisArea: area,
  slopeLogLog
}: DiagnoseParams): Diagnostics => {
  let mechanism: MechanismType = 'unknown'
  let confidence = 0.4
  const notes: string[] = []

  if (typeof slopeLogLog === 'number') {
    if (withinTolerance(slopeLogLog, 0.5, slopeTolerance)) {
      mechanism = 'diffusion'
      confidence = 0.8
      notes.push('Pendiente log(ip)-log(v) ≈ 0.5 indica control difusional (Randles-Sevcik).')
    } else if (withinTolerance(slopeLogLog, 1, slopeTolerance)) {
      mechanism = 'adsorption'
      confidence = 0.85
      notes.push('Pendiente log(ip)-log(v) ≈ 1 sugiere especie adsorbida.')
    }
  }

  if (!cathodicPeak && area > hysteresisArea) {
    mechanism = 'EC'
    confidence = 0.75
    notes.push('Ausencia de pico catódico + histéresis alta → posible mecanismo EC rápido.')
  }

  if (deltaEp && deltaEp > deltaEpKinetic) {
    mechanism = 'kinetic'
    confidence = Math.max(confidence, 0.7)
    notes.push('ΔEp grande indica cinética lenta / casi irreversible (Laviron).')
  }

  if (anodicPeak && cathodicPeak && deltaEp && deltaEp < 0.08) {
    mechanism = 'diffusion'
    confidence = Math.max(confidence, 0.75)
    notes.push('ΔEp cercano a 59/n mV consistente con sistema reversible controlado por difusión.')
  }

  if (notes.length === 0) {
    notes.push('Datos insuficientes para un diagnóstico concluyente.')
  }

  return { mechanism, confidence, notes }
}

/**
 * Clasifica la reversibilidad del sistema electroquímico
 *
 * Criterios (a 25°C, n=1):
 * - Reversible: ΔEp ≈ 59 mV, Ip,a/Ip,c ≈ 1
 * - Quasi-reversible: 59 < ΔEp < 200 mV
 * - Irreversible: ΔEp > 200 mV, ausencia de pico inverso
 *
 * @param deltaEp - Separación de picos (V)
 * @param ipAnodic - Corriente de pico anódico (A)
 * @param ipCathodic - Corriente de pico catódico (A)
 * @param n - Número de electrones
 * @returns Clasificación de reversibilidad
 */
export const classifyReversibility = (
  deltaEp: number | undefined,
  ipAnodic: number | undefined,
  ipCathodic: number | undefined,
  n: number = 1
): ReversibilityClassification => {
  const notes: string[] = []
  let type: ReversibilityType = 'unknown'
  let confidence = 0.4

  // Convertir ΔEp a mV
  const deltaEpMv = deltaEp ? deltaEp * 1000 : null

  // Calcular ratio de corrientes
  const ipRatio =
    ipAnodic && ipCathodic && ipCathodic !== 0 ? Math.abs(ipAnodic / ipCathodic) : null

  // Valores teóricos
  const reversibleDeltaEp = 59 / n // mV a 25°C
  const quasiReversibleThreshold = 200 // mV

  if (!deltaEpMv) {
    notes.push('ΔEp no disponible - clasificación limitada')
    if (!ipCathodic) {
      type = 'irreversible'
      confidence = 0.7
      notes.push('Ausencia de pico catódico → sistema irreversible')
    }
    return { type, confidence, deltaEp: 0, ipRatio, notes }
  }

  // Clasificación basada en ΔEp
  if (Math.abs(deltaEpMv - reversibleDeltaEp) < 10) {
    // ΔEp ≈ 59/n mV (±10 mV)
    type = 'reversible'
    confidence = 0.85
    notes.push(
      `ΔEp = ${deltaEpMv.toFixed(1)} mV ≈ ${reversibleDeltaEp.toFixed(1)} mV → Sistema reversible`
    )

    // Verificar ratio de corrientes
    if (ipRatio) {
      if (Math.abs(ipRatio - 1) < 0.15) {
        confidence = 0.95
        notes.push(`Ip,a/Ip,c = ${ipRatio.toFixed(2)} ≈ 1 confirma reversibilidad`)
      } else {
        confidence = 0.75
        notes.push(
          `Ip,a/Ip,c = ${ipRatio.toFixed(2)} se desvía de 1 (puede haber reacciones acopladas)`
        )
      }
    }
  } else if (deltaEpMv > reversibleDeltaEp + 10 && deltaEpMv < quasiReversibleThreshold) {
    // 59 < ΔEp < 200 mV
    type = 'quasi-reversible'
    confidence = 0.8
    notes.push(
      `ΔEp = ${deltaEpMv.toFixed(1)} mV (${reversibleDeltaEp.toFixed(1)}-${quasiReversibleThreshold} mV) → Sistema quasi-reversible`
    )
    notes.push('Cinética de transferencia electrónica lenta (use Nicholson o Laviron)')

    if (ipRatio) {
      if (ipRatio > 0.5 && ipRatio < 2) {
        notes.push(`Ip,a/Ip,c = ${ipRatio.toFixed(2)} - ambos picos presentes`)
      }
    }
  } else if (deltaEpMv >= quasiReversibleThreshold) {
    // ΔEp > 200 mV
    type = 'irreversible'
    confidence = 0.85
    notes.push(
      `ΔEp = ${deltaEpMv.toFixed(1)} mV > ${quasiReversibleThreshold} mV → Sistema irreversible`
    )
    notes.push('Transferencia electrónica muy lenta (use Laviron)')

    if (!ipCathodic) {
      confidence = 0.95
      notes.push('Ausencia de pico catódico confirma irreversibilidad')
    }
  } else if (deltaEpMv < reversibleDeltaEp - 10) {
    // ΔEp < 59/n mV (inusual)
    type = 'unknown'
    confidence = 0.5
    notes.push(
      `ΔEp = ${deltaEpMv.toFixed(1)} mV < ${reversibleDeltaEp.toFixed(1)} mV - comportamiento inusual`
    )
    notes.push('Posible error en detección de picos o sistema no estándar')
  }

  return {
    type,
    confidence,
    deltaEp: deltaEpMv,
    ipRatio,
    notes
  }
}

/**
 * Análisis completo de mecanismo y reversibilidad
 */
export interface ComprehensiveDiagnostics {
  reversibility: ReversibilityClassification
  control: ControlAnalysisResult
  mechanism: Diagnostics
  summary: string
}

/**
 * Realiza un análisis diagnóstico completo
 *
 * @param params - Parámetros de diagnóstico
 * @param peakCurrents - Corrientes de pico para análisis de control
 * @param scanRates - Velocidades de barrido
 * @returns Diagnóstico completo
 */
export const comprehensiveDiagnosis = (
  params: DiagnoseParams,
  peakCurrents: number[],
  scanRates: number[]
): ComprehensiveDiagnostics => {
  // Clasificar reversibilidad
  const reversibility = classifyReversibility(
    params.deltaEp,
    params.anodicPeak?.Ip,
    params.cathodicPeak?.Ip
  )

  // Analizar control
  const control = analyzeControl(peakCurrents, scanRates)

  // Diagnosticar mecanismo
  const mechanism = diagnoseMechanism(params)

  // Generar resumen
  let summary = `Sistema ${reversibility.type}`
  if (control.controlType !== 'unknown') {
    summary += ` con control ${control.controlType}`
  }
  if (mechanism.mechanism !== 'unknown' && mechanism.mechanism !== control.controlType) {
    summary += ` (mecanismo: ${mechanism.mechanism})`
  }

  return {
    reversibility,
    control,
    mechanism,
    summary
  }
}
