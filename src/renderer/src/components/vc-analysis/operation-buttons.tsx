import React from 'react'
import { Button } from '../ui/button'
import { cn } from '@renderer/utils'

interface OperationButtonsProps {
  operations: { key: string; label: string; tooltip: string }[]
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
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {operations.map((op) => (
        <Button
          key={op.key}
          title={op.tooltip}
          variant={selected === op.key ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelect(op.key)}
          className={cn(
            selected === op.key
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground'
          )}
        >
          {op.label}
        </Button>
      ))}
    </div>
  )
}
