import { CV_THRESHOLDS } from '../constants'
import { DiagnoseParams, Diagnostics, MechanismType } from '../types'

const { slopeTolerance, hysteresisArea, deltaEpKinetic } = CV_THRESHOLDS

const withinTolerance = (value: number, target: number, tolerance: number) =>
  Math.abs(value - target) <= tolerance

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
