import React from 'react'
import { Button } from '../ui/button'
import { cn } from '@renderer/utils'

interface OperationButtonsProps {
  operations: { key: string; icon: React.ReactNode; tooltip: string }[]
  selected: string | null
  onSelect: (key: string) => void
}

/**
 * Renders a set of buttons for selecting mathematical operations.
 */
export const OperationButtons: React.FC<OperationButtonsProps> = ({
  operations,
  selected,
  onSelect
}) => {
  return (
    <div className="flex gap-2 flex-wrap">
      {operations.map((op) => (
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

interface FitButtonsProps {
  fitButtons: { key: string; icon: React.ReactNode; tooltip: string }[]
  selected: string | null
  onSelect: (key: string) => void
}

export const FitButtons: React.FC<FitButtonsProps> = ({ fitButtons, selected, onSelect }) => {
  return (
    <div className="flex gap-2">
      {fitButtons.map((op) => (
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
