import React from 'react'
import { GrafContext } from '@/context/GraftContext'
import { useData } from '@/hooks/useData'
import { BookIcon, BookXIcon } from 'lucide-react'

import { Button } from '../ui/button'

const RemoveSelection = () => {
  const { cleanSelectionFiles } = useData()
  const {
    graftState: { selectedFilesCount }
  } = React.useContext(GrafContext)

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
