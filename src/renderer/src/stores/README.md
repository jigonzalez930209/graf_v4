# Zustand Stores - Graf V4

Esta carpeta contiene todos los stores de estado global de la aplicación usando **Zustand**.

## 📁 Estructura de Stores

### `useFilesStore.ts`

Maneja todo el estado relacionado con archivos:

- Lista de archivos cargados
- Columnas CSV seleccionadas
- Conteo de archivos seleccionados
- Agrupación de archivos

**Estado:**

```typescript
{
  files: IProcessFile[]
  csvFileColum: ICsvFileColum[]
  selectedFilesCount: number
  isFilesGrouped: boolean
}
```

**Acciones principales:**

- `setFiles()` - Establece la lista completa de archivos
- `addFiles()` - Agrega archivos a la lista existente
- `updateFile()` - Actualiza un archivo específico
- `removeFile()` - Elimina un archivo por ID
- `clearFiles()` - Limpia todos los archivos

### `useVisualizationStore.ts`

Maneja el estado de visualización de gráficos:

- Tipo de archivo
- Tipo de gráfico (line/scatter)
- Tipo de impedancia
- Configuración de visualización

**Estado:**

```typescript
{
  fileType: IFileType
  graftType: IGrafType
  impedanceType: IGraftImpedanceType
  stepBetweenPoints: number
  lineOrPointWidth: number
  colorScheme: IColorScheme
}
```

**Persistencia:** ✅ Se guarda en localStorage

### `useUIStore.ts`

Maneja el estado de la interfaz de usuario:

- Estado del drawer (abierto/cerrado)
- Tab activa
- Estado de carga

**Estado:**

```typescript
{
  drawerOpen: boolean
  activeTab: 'visualization' | 'vc-analysis' | 'frequency'
  loading: boolean
}
```

### `useNotificationsStore.ts`

Maneja las notificaciones de la aplicación:

**Helpers disponibles:**

- `showSuccess()` - Muestra notificación de éxito
- `showError()` - Muestra notificación de error
- `showWarning()` - Muestra notificación de advertencia
- `showInfo()` - Muestra notificación informativa

### `useAnalysisStore.ts`

Maneja el estado de análisis:

- Cálculos de frecuencia única
- Valores de concentración

**Persistencia:** ✅ Se guarda en localStorage

### `useAppStore.ts`

Maneja el estado general de la aplicación:

- Plataforma (web/desktop)
- Información de actualizaciones
- Eventos de progreso

**Persistencia:** ✅ Parcial (solo platform)

## 🎯 Uso

### Opción 1: Hook Combinado (Recomendado para migración)

```typescript
import { useGraftStore } from '@renderer/stores/useGraftStore'

function MyComponent() {
  const { files, setFiles, drawerOpen, setDrawerOpen } = useGraftStore()

  // Usar como antes con el Context
  return <div>...</div>
}
```

### Opción 2: Stores Individuales (Mejor rendimiento)

```typescript
import { useFilesStore } from '@renderer/stores'

function MyComponent() {
  // Solo se re-renderiza cuando cambian los archivos
  const files = useFilesStore((state) => state.files)
  const setFiles = useFilesStore((state) => state.setFiles)

  return <div>...</div>
}
```

### Opción 3: Hooks Especializados

```typescript
import { useFiles, useUI, useNotifications } from '@renderer/stores/useGraftStore'

function MyComponent() {
  const { files, setFiles } = useFiles()
  const { drawerOpen, setDrawerOpen } = useUI()
  const { showSuccess } = useNotifications()

  return <div>...</div>
}
```

## 🔄 Migración desde Context API

### Antes (Context API):

```typescript
import { useContext } from 'react'
import { GrafContext } from '@renderer/context/GraftContext'

function MyComponent() {
  const { graftState, setFiles, setDrawerOpen } = useContext(GrafContext)
  const files = graftState.files

  return <div>...</div>
}
```

### Después (Zustand):

```typescript
import { useGraftStore } from '@renderer/stores/useGraftStore'

function MyComponent() {
  const { files, setFiles, setDrawerOpen } = useGraftStore()

  return <div>...</div>
}
```

## 🎨 Características de Zustand

### ✅ Ventajas sobre Context API:

1. **Mejor rendimiento**: Solo re-renderiza componentes que usan el estado que cambió
2. **Sin Provider**: No necesitas envolver tu app en un Provider
3. **DevTools**: Integración con Redux DevTools
4. **Persistencia**: Fácil persistencia en localStorage
5. **TypeScript**: Excelente soporte de tipos
6. **Menos boilerplate**: Código más simple y directo

### 🔧 Middleware Incluido:

- **devtools**: Integración con Redux DevTools
- **persist**: Persistencia automática en localStorage
- **logger**: Logging en desarrollo (en utils.ts)

## 📊 DevTools

Para usar Redux DevTools:

1. Instala la extensión de Redux DevTools en tu navegador
2. Abre las DevTools
3. Verás todos los stores con sus nombres:
   - `FilesStore`
   - `VisualizationStore`
   - `UIStore`
   - `NotificationsStore`
   - `AnalysisStore`
   - `AppStore`

## 🛠️ Utilidades

### Reset de todos los stores:

```typescript
import { resetAllStores } from '@renderer/stores/utils'

// Limpia todo el estado persistido
resetAllStores()
```

### Debug del estado:

```typescript
import { getAllStoresState } from '@renderer/stores/utils'

// Obtiene el estado de todos los stores
const state = getAllStoresState()
console.log(state)
```

## 📝 Notas de Migración

1. **No eliminar Context API todavía**: Mantener ambos sistemas durante la transición
2. **Migrar componente por componente**: Ir reemplazando gradualmente
3. **Probar cada migración**: Asegurar que todo funciona antes de continuar
4. **Actualizar tests**: Los tests también necesitan actualizarse

## 🔗 Referencias

- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Zustand Best Practices](https://github.com/pmndrs/zustand/blob/main/docs/guides/practice-with-no-store-actions.md)
