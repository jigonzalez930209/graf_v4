import React from 'react'
import { useGraftStore } from '@renderer/stores/useGraftStore'
import { useData } from '@/hooks/useData'
import { BookIcon, BookXIcon } from 'lucide-react'

import { Button } from '../ui/button'

const RemoveSelection = () => {
  const { cleanSelectionFiles } = useData()
  
  // Migrado a Zustand
  const { selectedFilesCount } = useGraftStore()

  const handleRemoveSelection = () => cleanSelectionFiles()

  return (
    <Button variant="ghost" size="icon" className="size-5" onClick={handleRemoveSelection}>
      {selectedFilesCount > 0 ? (
        <BookXIcon className="h-5 w-5" />
      ) : (
        <BookIcon className="h-5 w-5" />
      )}
    </Button>
  )
}

export default RemoveSelection
