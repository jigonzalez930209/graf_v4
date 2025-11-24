/**
 * Normalización y validación de datos CV
 * Convierte IProcessFile a CVData con validaciones robustas
 */

import type { IProcessFile } from '@shared/models/files'
import type { CVData } from '../types'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface NormalizedCVData extends CVData {
  scanRate: number
  validation: ValidationResult
}

/**
 * Valida que los datos sean numéricos y finitos
 */
const validateNumericArray = (arr: number[], name: string): string[] => {
  const errors: string[] = []

  if (!Array.isArray(arr)) {
    errors.push(`${name} no es un array`)
    return errors
  }

  if (arr.length === 0) {
    errors.push(`${name} está vacío`)
    return errors
  }

  const invalidCount = arr.filter((v) => !Number.isFinite(v)).length
  if (invalidCount > 0) {
    errors.push(`${name} contiene ${invalidCount} valores no finitos (NaN/Infinity)`)
  }

  return errors
}

/**
 * Filtra valores NaN e Infinity de los arrays
 */
const filterInvalidValues = (
  potential: number[],
  current: number[]
): { potential: number[]; current: number[] } => {
  const filtered: { potential: number[]; current: number[] } = {
    potential: [],
    current: []
  }

  for (let i = 0; i < Math.min(potential.length, current.length); i++) {
    if (Number.isFinite(potential[i]) && Number.isFinite(current[i])) {
      filtered.potential.push(potential[i])
      filtered.current.push(current[i])
    }
  }

  return filtered
}

/**
 * Verifica si el potencial es monotónico (creciente o decreciente)
 */
const checkMonotonicity = (
  potential: number[]
): {
  isMonotonic: boolean
  direction: 'increasing' | 'decreasing' | 'mixed'
} => {
  if (potential.length < 2) {
    return { isMonotonic: true, direction: 'mixed' }
  }

  let increasing = 0
  let decreasing = 0

  for (let i = 1; i < potential.length; i++) {
    const diff = potential[i] - potential[i - 1]
    if (diff > 0) increasing++
    else if (diff < 0) decreasing++
  }

  const total = potential.length - 1
  const threshold = 0.9 // 90% de los puntos deben seguir la misma dirección

  if (increasing / total > threshold) {
    return { isMonotonic: true, direction: 'increasing' }
  } else if (decreasing / total > threshold) {
    return { isMonotonic: true, direction: 'decreasing' }
  }

  return { isMonotonic: false, direction: 'mixed' }
}

/**
 * Extrae scan rate del archivo
 */
const extractScanRate = (file: IProcessFile): number => {
  // Prioridad 1: scanRate explícito
  if (file.voltammeter?.scanRate && Number.isFinite(file.voltammeter.scanRate)) {
    return file.voltammeter.scanRate
  }

  // Prioridad 2: samplesSec (legacy)
  if (file.voltammeter?.samplesSec && Number.isFinite(file.voltammeter.samplesSec)) {
    return file.voltammeter.samplesSec
  }

  // Prioridad 3: calcular desde datos si es posible
  if (file.content && file.content.length >= 2) {
    const potential = file.content.map(([e]) => parseFloat(e))
    const totalTime = file.voltammeter?.totalTime

    if (totalTime && totalTime > 0) {
      const voltageRange = Math.max(...potential) - Math.min(...potential)
      return voltageRange / totalTime // V/s
    }
  }

  // Default: 0.1 V/s
  return 0.1
}

/**
 * Convierte IProcessFile a CVData normalizado con validaciones
 *
 * @param file - Archivo a procesar
 * @param options - Opciones de validación
 * @returns Datos CV normalizados con información de validación
 */
export const toCVData = (
  file: IProcessFile,
  options: {
    minDataPoints?: number
    requireMonotonic?: boolean
    filterInvalid?: boolean
  } = {}
): NormalizedCVData => {
  const { minDataPoints = 10, requireMonotonic = false, filterInvalid = true } = options

  const errors: string[] = []
  const warnings: string[] = []

  // Validar que el archivo existe y tiene contenido
  if (!file || !file.content) {
    errors.push('Archivo vacío o sin contenido')
    return {
      potential: [],
      current: [],
      scanRate: 0,
      validation: { isValid: false, errors, warnings }
    }
  }

  // Extraer datos brutos y parsear a números
  let potential = file.content.map(([e]) => parseFloat(e))
  let current = file.content.map(([, i]) => parseFloat(i))

  // Validar longitud mínima
  if (potential.length < minDataPoints) {
    errors.push(`Datos insuficientes: ${potential.length} puntos (mínimo: ${minDataPoints})`)
  }

  // Validar arrays numéricos
  const potentialErrors = validateNumericArray(potential, 'Potential')
  const currentErrors = validateNumericArray(current, 'Current')
  errors.push(...potentialErrors, ...currentErrors)

  // Filtrar valores inválidos si está habilitado
  if (filterInvalid && errors.length === 0) {
    const originalLength = potential.length
    const filtered = filterInvalidValues(potential, current)
    potential = filtered.potential
    current = filtered.current

    const removed = originalLength - potential.length
    if (removed > 0) {
      warnings.push(`Se filtraron ${removed} puntos con valores inválidos`)
    }
  }

  // Verificar monotonía si es requerido
  if (requireMonotonic && potential.length > 0) {
    const monotonicity = checkMonotonicity(potential)
    if (!monotonicity.isMonotonic) {
      warnings.push('El potencial no es monotónico (puede ser CV multi-ciclo)')
    }
  }

  // Extraer scan rate
  const scanRate = extractScanRate(file)
  if (scanRate <= 0) {
    warnings.push(`Scan rate inválido o no disponible (usando default: 0.1 V/s)`)
  }

  // Validar rangos razonables
  const potentialRange = Math.max(...potential) - Math.min(...potential)
  if (potentialRange < 0.01) {
    warnings.push('Rango de potencial muy pequeño (<10 mV)')
  }
  if (potentialRange > 5) {
    warnings.push('Rango de potencial muy grande (>5 V)')
  }

  const maxCurrent = Math.max(...current.map(Math.abs))
  if (maxCurrent < 1e-12) {
    warnings.push('Corriente muy pequeña (<1 pA)')
  }
  if (maxCurrent > 1) {
    warnings.push('Corriente muy grande (>1 A)')
  }

  return {
    potential,
    current,
    scanRate,
    validation: {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
}

/**
 * Valida múltiples archivos CV
 */
export const validateMultipleCVFiles = (
  files: IProcessFile[]
): {
  validFiles: IProcessFile[]
  invalidFiles: Array<{ file: IProcessFile; errors: string[] }>
  warnings: string[]
} => {
  const validFiles: IProcessFile[] = []
  const invalidFiles: Array<{ file: IProcessFile; errors: string[] }> = []
  const warnings: string[] = []

  for (const file of files) {
    const normalized = toCVData(file)

    if (normalized.validation.isValid) {
      validFiles.push(file)
      warnings.push(...normalized.validation.warnings.map((w) => `${file.name}: ${w}`))
    } else {
      invalidFiles.push({
        file,
        errors: normalized.validation.errors
      })
    }
  }

  return { validFiles, invalidFiles, warnings }
}

/**
 * Helper para extraer CVData simple (sin validación extendida)
 * Útil para compatibilidad con código existente
 */
export const extractCVData = (file: IProcessFile): CVData & { scanRate: number } => {
  const normalized = toCVData(file, { filterInvalid: true })
  return {
    potential: normalized.potential,
    current: normalized.current,
    scanRate: normalized.scanRate
  }
}
