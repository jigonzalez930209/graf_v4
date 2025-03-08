'use client'

import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'

import { cn } from '@renderer/utils'

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

function Tooltip({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  )
}

function TooltipTrigger({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          'bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit rounded-md px-3 py-1.5 text-xs text-balance',
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="bg-primary fill-primary z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}
export type CustomTooltipProps = {
  title: string
  Icon?: React.ReactNode & { props: { className?: string } }
  content?: string
  children?: React.ReactNode
  className?: string
  onClick?: () => void
}

const CustomTooltip = React.forwardRef<HTMLDivElement, CustomTooltipProps>(
  (props: CustomTooltipProps, ref) => {
    const { title, Icon, content, children, onClick, className } = props
    return (
      <TooltipPrimitive.Provider delayDuration={100}>
        <TooltipPrimitive.Root>
          <TooltipPrimitive.Trigger asChild>
            <div
              ref={ref}
              className={cn(
                'flex items-center justify-center rounded-full p-2 hover:ring-1 hover:ring-primary/20 hover:shadow-md hover:bg-primary/10 transition-all duration-100',
                className
              )}
              onClick={onClick}
            >
              {!!Icon &&
                React.isValidElement(Icon) &&
                React.cloneElement(Icon, {
                  className: cn(Icon?.props?.className || 'h-4 w-4')
                })}
              {children}
            </div>
          </TooltipPrimitive.Trigger>
          <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content
              className="z-50 mt-1 select-none rounded-[4px] border border-border bg-popover px-[15px] py-[10px] text-sm leading-none shadow-md outline-none data-[state=open]:data-[side=bottom]:animate-slide-up-and-fade data-[state=open]:data-[side=left]:animate-slide-right-and-fade data-[state=open]:data-[side=right]:animate-slide-left-and-fade data-[state=open]:data-[side=top]:animate-slide-down-and-fade"
              sideOffset={5}
            >
              {title && <div className="font-bold">{title}</div>}
              {content && <div>{content}</div>}
              <TooltipPrimitive.Arrow className="fill-popover" />
            </TooltipPrimitive.Content>
          </TooltipPrimitive.Portal>
        </TooltipPrimitive.Root>
      </TooltipPrimitive.Provider>
    )
  }
)
CustomTooltip.displayName = 'CustomTooltip'

export default CustomTooltip

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
