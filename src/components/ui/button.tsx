// src/components/ui/button.tsx
// Zenith Design System - SSR-Safe Button Component

import * as React from "react"
import { cn } from "@/lib/utils"

// Define button variants without external libraries
const buttonVariants = {
  variant: {
    default: "bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl",
    destructive: "bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-xl",
    outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-900 shadow-sm hover:shadow-md",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 shadow-sm hover:shadow-md",
    ghost: "hover:bg-gray-100 text-gray-900",
    link: "text-blue-600 underline-offset-4 hover:underline",
    // Glassmorphic variants from landing page
    glass: "backdrop-blur-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:border-white/30 shadow-2xl hover:shadow-3xl transition-all duration-300",
    gradient: "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-2xl hover:shadow-purple-500/25 hover:scale-105 transition-all duration-300",
    "gradient-green": "bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600 shadow-lg hover:shadow-2xl hover:shadow-green-500/25 hover:scale-105 transition-all duration-300",
    "gradient-cyan": "bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 shadow-lg hover:shadow-2xl hover:shadow-cyan-500/25 hover:scale-105 transition-all duration-300",
  },
  size: {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    xl: "h-12 rounded-xl px-12 text-base",
    icon: "h-10 w-10",
  },
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * The visual variant of the button
   * @default "default"
   */
  variant?: keyof typeof buttonVariants.variant
  /**
   * The size of the button
   * @default "default"
   */
  size?: keyof typeof buttonVariants.size
  /**
   * When true, the button will render as its child element, merging the button's
   * styling classes with the child's existing classes. This is useful for 
   * creating button-styled links or other elements while maintaining proper
   * semantic HTML. The child must be a single React element.
   * 
   * @example
   * ```tsx
   * // Render a link that looks like a button
   * <Button asChild variant="default">
   *   <a href="/dashboard">Go to Dashboard</a>
   * </Button>
   * ```
   * 
   * @default false
   */
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    const variantClasses = buttonVariants.variant[variant] || buttonVariants.variant.default
    const sizeClasses = buttonVariants.size[size] || buttonVariants.size.default
    
    if (asChild) {
      // Extract children from props to avoid conflicts when spreading
      const { children, ...restProps } = props;
      
      // Validate that children exists and is a single React element
      if (!children) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Button: asChild prop requires a single child element');
        }
        return null;
      }

      try {
        // Ensure there is only one child, as cloneElement expects
        const child = React.Children.only(children);
        
        // Validate that the child is a React element
        if (!React.isValidElement(child)) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('Button: asChild prop requires a valid React element as child');
          }
          return null;
        }
        
        // Get the existing className from the child props
        const childClassName = (child.props as any)?.className || '';
        
        // Clone the child and merge props
        // We merge the CVA-generated classes with any classes on the child
        return React.cloneElement(child as React.ReactElement<any>, {
          ...restProps, // Pass props excluding children to avoid conflicts
          className: cn(baseClasses, variantClasses, sizeClasses, childClassName, className),
          ref, // Pass the ref to the cloned child
        });
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Button: asChild prop requires exactly one child element', error);
        }
        return null;
      }
    }

    // If not asChild, render a regular button as before
    return (
      <button
        className={cn(baseClasses, variantClasses, sizeClasses, className)}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"

export { Button, buttonVariants }
