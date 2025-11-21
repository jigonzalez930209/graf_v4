import { PlusIcon, XIcon } from 'lucide-react'
import { Button } from '../../ui/button'
import { useVCAnalysis } from '../context/use-vc-analysis'

const TitleAction = ({ setOpen }: { setOpen: (open: boolean) => void }) => {
  const { handleSetGlobalSelectedFiles } = useVCAnalysis()
  return (
    <>
      <Button variant="success" size="icon" onClick={handleSetGlobalSelectedFiles}>
        <PlusIcon className="w-4 h-4" />
      </Button>
      <Button
        className="absolute right-2"
        variant="ghost"
        size="icon"
        onClick={() => setOpen(false)}
      >
        <XIcon className="w-4 h-4" />
      </Button>
    </>
  )
}

export default TitleAction
