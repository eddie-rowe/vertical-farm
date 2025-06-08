import React from 'react'

interface ScreenReaderOnlyProps {
  children: React.ReactNode
  className?: string
}

export const ScreenReaderOnly: React.FC<ScreenReaderOnlyProps> = ({ 
  children, 
  className = '',
  ...props 
}) => {
  return (
    <span 
      className={`sr-only ${className}`.trim()}
      {...props}
    >
      {children}
    </span>
  )
} 