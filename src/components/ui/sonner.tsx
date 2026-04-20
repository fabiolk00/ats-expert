'use client'

import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      closeButton
      className="toaster group"
      style={
        {
          '--normal-bg': '#050505',
          '--normal-text': '#ffffff',
          '--normal-border': '#1f1f1f',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
