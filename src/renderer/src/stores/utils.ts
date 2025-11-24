import { StateCreator } from 'zustand'

/**
 * Middleware para logging de acciones en desarrollo
 */
export const logger = <T>(config: StateCreator<T>): StateCreator<T> => {
  return (set, get, api) =>
    config(
      (args) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('  applying', args)
        }
        set(args)
        if (process.env.NODE_ENV === 'development') {
          console.log('  new state', get())
        }
      },
      get,
      api
    )
}

/**
 * Helper para resetear todos los stores
 */
export const resetAllStores = () => {
  if (typeof window !== 'undefined') {
    // Limpiar localStorage de todos los stores persistidos
    const keysToRemove = [
      'files-storage',
      'visualization-storage',
      'analysis-storage',
      'app-storage'
    ]

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key)
    })
  }
}

/**
 * Helper para obtener el estado completo de todos los stores
 * Útil para debugging
 */
export const getAllStoresState = () => {
  if (typeof window !== 'undefined') {
    return {
      files: localStorage.getItem('files-storage'),
      visualization: localStorage.getItem('visualization-storage'),
      analysis: localStorage.getItem('analysis-storage'),
      app: localStorage.getItem('app-storage')
    }
  }
  return null
}

/**
 * Tipo helper para acciones asíncronas en Zustand
 */
export type AsyncAction<T extends (...args: never[]) => Promise<unknown>> = (
  ...args: Parameters<T>
) => ReturnType<T>

/**
 * Helper para crear acciones asíncronas con manejo de errores
 */
export const createAsyncAction = <T extends unknown[], R>(
  action: (...args: T) => Promise<R>,
  onError?: (error: Error) => void
) => {
  return async (...args: T): Promise<R | null> => {
    try {
      return await action(...args)
    } catch (error) {
      if (onError && error instanceof Error) {
        onError(error)
      } else {
        console.error('Async action error:', error)
      }
      return null
    }
  }
}
