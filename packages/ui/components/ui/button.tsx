'use client'

import React, { forwardRef } from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const baseClasses =
  'inline-flex items-center justify-center rounded-lg text-base font-medium transition-transform transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F97316] disabled:pointer-events-none disabled:opacity-60'

function isReactElement(
  child: React.ReactNode
): child is React.ReactElement<Record<string, unknown>> {
  return React.isValidElement(child) && typeof child.props === 'object' && child.props !== null
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild = false, className = '', children, ...props }, ref) => {
    const mergedClasses = `${baseClasses} ${className}`.trim()

    if (asChild && isReactElement(children)) {
      const element = children
      const classNameProp = element.props.className
      const existingClasses =
        typeof classNameProp === 'string' ? classNameProp : ''

      return React.cloneElement(element, {
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
