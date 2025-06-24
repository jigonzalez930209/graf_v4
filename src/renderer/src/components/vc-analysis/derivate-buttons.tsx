import React from 'react'
import { Button } from '../ui/button'
import { cn } from '@renderer/utils'

interface DerivateButtonsProps {
  derivateButtons: { key: string; icon: React.ReactNode; tooltip: string; label: string }[]
  selected: string | null
  onSelect: (key: string) => void
}

export const DerivateButtons: React.FC<DerivateButtonsProps> = ({
  derivateButtons,
  selected,
  onSelect
}) => {
  return (
    <div className="flex gap-2">
      {derivateButtons.map((op) => (
        <Button
          key={op.key}
          title={op.tooltip}
          variant={selected === op.key ? 'default' : 'outline'}
          size="icon"
          onClick={() => onSelect(op.key)}
          className={cn(
            selected === op.key
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground'
          )}
        >
          {op.icon}
        </Button>
      ))}
    </div>
  )
}
