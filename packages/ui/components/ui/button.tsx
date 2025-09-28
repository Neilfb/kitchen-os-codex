'use client'

import React, { forwardRef } from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const baseClasses =
  'inline-flex items-center justify-center rounded-lg text-base font-medium transition-transform transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F97316] disabled:pointer-events-none disabled:opacity-60'

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild = false, className = '', children, ...props }, ref) => {
    const mergedClasses = `${baseClasses} ${className}`.trim()

    if (asChild && React.isValidElement(children)) {
      const existingClasses = typeof children.props.className === 'string' ? children.props.className : ''
      return React.cloneElement(children, {
        className: `${existingClasses} ${mergedClasses}`.trim(),
      })
    }

    return (
      <button ref={ref} className={mergedClasses} {...props}>
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
