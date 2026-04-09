'use client'

import * as React from 'react'
import * as ResizablePrimitive from 'react-resizable-panels'

import { cn } from '@/lib/utils'

function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Group>) {
  return (
    <ResizablePrimitive.Group
      className={cn(
        'flex h-full w-full',
        className,
      )}
      {...props}
    />
  )
}

function ResizablePanel(
  props: React.ComponentProps<typeof ResizablePrimitive.Panel>,
) {
  return <ResizablePrimitive.Panel {...props} />
}

function ResizableHandle({
  className,
  withHandle = false,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Separator> & {
  withHandle?: boolean
}) {
  return (
    <ResizablePrimitive.Separator
      className={cn(
        'group relative -mx-[2px] flex w-4 shrink-0 cursor-col-resize items-center justify-center self-stretch bg-[#faf9f5] focus-visible:outline-none',
        className,
      )}
      {...props}
    >
      {withHandle ? (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border/40 transition-colors group-hover:bg-border/60 group-focus-visible:bg-border/60" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-11 w-[8px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-border/70 bg-[#faf9f5] shadow-sm transition-colors group-hover:border-border group-focus-visible:border-border" />
        </>
      ) : null}
    </ResizablePrimitive.Separator>
  )
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup }
