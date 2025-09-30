import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Input mode for mobile keyboards
   * - 'text': Standard keyboard
   * - 'decimal': Numeric keyboard with decimal
   * - 'numeric': Numeric keyboard
   * - 'tel': Telephone keypad
   * - 'search': Search keyboard with "Go" button
   * - 'email': Email keyboard with @ symbol
   * - 'url': URL keyboard with .com
   */
  inputMode?: 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, inputMode, ...props }, ref) => {
    // Auto-determine inputMode based on type if not explicitly provided
    const autoInputMode = inputMode || getInputModeFromType(type);

    return (
      <input
        type={type}
        inputMode={autoInputMode}
        className={cn(
          "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-colors duration-150",
          // Enhanced touch targets for mobile
          "touch-manipulation",
          // Better mobile appearance
          "appearance-none [-webkit-appearance:none]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

// Helper function to determine inputMode from type
function getInputModeFromType(type?: string): InputProps['inputMode'] {
  switch (type) {
    case 'email':
      return 'email';
    case 'tel':
      return 'tel';
    case 'number':
      return 'numeric';
    case 'search':
      return 'search';
    case 'url':
      return 'url';
    default:
      return 'text';
  }
}

export { Input }
