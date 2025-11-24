/**
 * Tipos y utilidades de TypeScript para los stores de Zustand
 */

import type { StateCreator } from 'zustand'
import type { IProcessFile } from '@shared/models/files'
import type {
  ICsvFileColum,
  IFileType,
  IGrafType,
  IGraftImpedanceType,
  IColorScheme,
  INotification,
  FrequencyValues,
  ConcInputValue,
  IPlatform,
  IProgressEvent
} from '@shared/models/graf'
import type { UpdateInfo } from 'electron-updater'

/**
 * Tipo helper para extraer el estado de un store
 */
export type ExtractState<S> = S extends {
  getState: () => infer T
}
  ? T
  : never

/**
 * Tipo helper para crear slices de estado
 */
export type StateSlice<T> = StateCreator<T, [], [], T>

/**
 * Tipo para acciones del store
 */
export type StoreActions<T> = {
  [K in keyof T]: T[K] extends (...args: infer Args) => infer Return
    ? (...args: Args) => Return
    : never
}

/**
 * Tipo para el estado del store (sin acciones)
 */
export type StoreState<T> = {
  [K in keyof T]: T[K] extends (...args: never[]) => unknown ? never : T[K]
}

/**
 * Tipo combinado de todos los estados
 */
export interface CombinedGraftState {
  // Files
  files: IProcessFile[]
  csvFileColum: ICsvFileColum[]
  selectedFilesCount: number
  isFilesGrouped: boolean

  // Visualization
  fileType: IFileType
  graftType: IGrafType
  impedanceType: IGraftImpedanceType
  stepBetweenPoints: number
  lineOrPointWidth: number
  colorScheme: IColorScheme

  // UI
  drawerOpen: boolean
  activeTab: 'visualization' | 'vc-analysis' | 'frequency'
  loading: boolean

  // Notifications
  notifications: INotification

  // Analysis
  uniqueFrequencyCalc: FrequencyValues[]
  concInputValues: ConcInputValue[]

  // App
  platform: IPlatform
  updateContent: UpdateInfo | null
  progressEvent: IProgressEvent
}

/**
 * Tipo para selectores de Zustand
 */
export type Selector<T, U> = (state: T) => U

/**
 * Tipo para comparadores de igualdad
 */
export type EqualityFn<T> = (a: T, b: T) => boolean

/**
 * Helper para crear selectores tipados
 */
export const createSelector = <T, U>(selector: Selector<T, U>): Selector<T, U> => {
  return selector
}

/**
 * Comparador shallow para arrays
 */
export const shallowArrayEqual = <T>(a: T[], b: T[]): boolean => {
  if (a.length !== b.length) return false
  return a.every((item, index) => item === b[index])
}

/**
 * Comparador shallow para objetos
 */
export const shallowObjectEqual = <T extends Record<string, unknown>>(a: T, b: T): boolean => {
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)

  if (keysA.length !== keysB.length) return false

  return keysA.every((key) => a[key] === b[key])
}
