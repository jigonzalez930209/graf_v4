import { CurvePlot } from '../charts/curve-plot'
import { useGraftStore } from '@renderer/stores/useGraftStore'

const CommonDialog = () => {
  const { files } = useGraftStore()
  const selectedFiles = files.filter((f) => f.selected)

  return (
    <div className="w-full h-full">
      <CurvePlot data={selectedFiles} />
    </div>
  )
}

export default CommonDialog
