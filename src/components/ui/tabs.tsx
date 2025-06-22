"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string
}

function Tabs({ value, onValueChange, children, className }: TabsProps) {
  // Clone children and inject props - SSR-safe like Button component
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        ...child.props,
        selectedValue: value,
        onValueChange: onValueChange,
      } as any);
    }
    return child;
  });

  return (
    <div className={cn("w-full", className)}>
      {enhancedChildren}
    </div>
  )
}

interface TabsListProps {
  children: React.ReactNode
  className?: string
  selectedValue?: string
  onValueChange?: (value: string) => void
}

function TabsList({ children, className, selectedValue, onValueChange }: TabsListProps) {
  // Clone children and pass down props
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        ...child.props,
        selectedValue,
        onValueChange,
      } as any);
    }
    return child;
  });

  return (
    <div className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500",
      className
    )}>
      {enhancedChildren}
    </div>
  )
}

interface TabsTriggerProps {
  value: string
  children: React.ReactNode
  className?: string
  selectedValue?: string
  onValueChange?: (value: string) => void
}

function TabsTrigger({ value, children, className, selectedValue, onValueChange }: TabsTriggerProps) {
  const isActive = selectedValue === value

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive 
          ? "bg-white text-gray-950 shadow-sm" 
          : "text-gray-600 hover:text-gray-900",
        className
      )}
      onClick={() => onValueChange?.(value)}
    >
      {children}
    </button>
  )
}

interface TabsContentProps {
  value: string
  children: React.ReactNode
  className?: string
  selectedValue?: string
}

function TabsContent({ value, children, className, selectedValue }: TabsContentProps) {
  if (selectedValue !== value) {
    return null
  }

  return (
    <div className={cn(
      "mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
      className
    )}>
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
