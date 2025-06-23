import { Button } from '@renderer/components/ui/button'
import React from 'react'

export default function IntegralTab() {
  const [selectedIntegral, setSelectedIntegral] = React.useState(false)

  const handleIntegral = () => {
    setSelectedIntegral((prev) => !prev)
  }

  return (
    <div className="flex gap-3 p-2 bg-accent/20">
      <Button variant={selectedIntegral ? 'success' : 'secondary'} onClick={handleIntegral}>
        Integral
      </Button>
    </div>
  )
}
