"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface PopoverProps {
  children: React.ReactNode
}

interface PopoverTriggerProps {
  children: React.ReactNode
  asChild?: boolean
  onClick?: () => void
}

interface PopoverContentProps {
  children: React.ReactNode
  className?: string
  align?: "start" | "center" | "end"
  side?: "top" | "bottom" | "left" | "right"
}

const PopoverContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
}>({
  open: false,
  setOpen: () => {}
})

const Popover = ({ children }: PopoverProps) => {
  const [open, setOpen] = React.useState(false)
  
  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">
        {children}
      </div>
    </PopoverContext.Provider>
  )
}

const PopoverTrigger = React.forwardRef<
  HTMLButtonElement,
  PopoverTriggerProps
>(({ children, asChild, onClick, ...props }, ref) => {
  const { open, setOpen } = React.useContext(PopoverContext)
  
  const handleClick = () => {
    setOpen(!open)
    onClick?.()
  }
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...children.props,
      onClick: handleClick,
      ref
    } as any)
  }
  
  return (
    <button ref={ref} onClick={handleClick} {...props}>
      {children}
    </button>
  )
})
PopoverTrigger.displayName = "PopoverTrigger"

const PopoverContent = React.forwardRef<
  HTMLDivElement,
  PopoverContentProps
>(({ children, className, align = "center", side = "bottom", ...props }, ref) => {
  const { open, setOpen } = React.useContext(PopoverContext)
  
  if (!open) return null
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={() => setOpen(false)}
      />
      {/* Content */}
      <div
        ref={ref}
        className={cn(
          "absolute z-50 mt-2 rounded-md border bg-white p-4 shadow-lg",
          align === "start" && "left-0",
          align === "center" && "left-1/2 transform -translate-x-1/2",
          align === "end" && "right-0",
          side === "top" && "bottom-full mb-2 mt-0",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </>
  )
})
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }