import * as React from 'react'
import { Minus, Maximize2, Minimize2, X } from 'lucide-react'
import { useGraftStore } from '@renderer/stores/useGraftStore'

const WindowControls = () => {
  const [isMaximized, setIsMaximized] = React.useState(false)

  // Migrado a Zustand - obtenemos todo el estado necesario
  const {
    files,
    csvFileColum,
    fileType,
    graftType,
    impedanceType,
    stepBetweenPoints,
    lineOrPointWidth,
    colorScheme,
    isFilesGrouped,
    selectedFilesCount,
    uniqueFrequencyCalc,
    concInputValues,
    platform
  } = useGraftStore()

  // Reconstruir graftState para compatibilidad con el guardado
  const graftState = {
    files,
    csvFileColum,
    fileType,
    graftType,
    impedanceType,
    stepBetweenPoints,
    lineOrPointWidth,
    colorScheme,
    isFilesGrouped,
    selectedFilesCount,
    uniqueFrequencyCalc,
    concInputValues,
    platform,
    drawerOpen: true,
    loading: false,
    notifications: { content: [''], title: '', type: undefined },
    state: null,
    updateContent: null,
    progressEvent: { message: '', name: '', type: undefined, timeOut: 0 }
  }

  const handleQuit = () => {
    window.context.saveProject(JSON.stringify(graftState), true).then(() => {
      window.context.quit()
    })
  }

  const handleMaximize = async () => {
    setIsMaximized(await window.context.maximize())
  }

  const handleMinimize = () => {
    window.context.minimize()
  }

  return (
    <div className="flex space-x-2 ml-auto pr-3">
      <button className="p-2 rounded-full hover:bg-secondary" onClick={handleMinimize}>
        <Minus size={16} />
      </button>
      <button className="p-2 rounded-full hover:bg-secondary" onClick={handleMaximize}>
        {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </button>
      <button className="p-2 rounded-full hover:bg-red-500" onClick={handleQuit}>
        <X size={16} />
      </button>
    </div>
  )
}

export default WindowControls
