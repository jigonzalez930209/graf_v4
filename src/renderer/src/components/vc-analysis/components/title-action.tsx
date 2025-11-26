import { PlusIcon } from 'lucide-react'
import { Button } from '../../ui/button'
import { useVCAnalysis } from '../context/use-vc-analysis'

const TitleAction = () => {
  const { handleSetGlobalSelectedFiles } = useVCAnalysis()
  return (
    <>
      <Button variant="success" size="icon" onClick={handleSetGlobalSelectedFiles}>
        <PlusIcon className="w-4 h-4" />
      </Button>
    </>
  )
}

export default TitleAction
