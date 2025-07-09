import React from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PageHeader({ 
  title, 
  description, 
  children, 
  size = 'md',
  className 
}: PageHeaderProps) {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <div className={cn("bg-surface-elevated shadow rounded-lg p-6 mb-6", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className={cn(
            "font-bold text-content mb-2",
            sizeClasses[size]
          )}>
            {title}
          </h1>
          {description && (
            <p className="text-content-secondary text-sm leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {children && (
          <div className="flex-shrink-0">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

export default PageHeader; 