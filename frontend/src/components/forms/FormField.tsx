"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { FaExclamationCircle, FaCheckCircle } from '@/lib/icons';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select';
  value: string | number;
  onChange: (value: string | number) => void;
  onBlur?: () => void;
  error?: string;
  success?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  options?: Array<{ value: string | number; label: string }>;
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
}

export function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  success,
  required = false,
  disabled = false,
  placeholder,
  className,
  options,
  rows = 3,
  min,
  max,
  step,
}: FormFieldProps) {
  const hasError = !!error;
  const hasSuccess = !!success && !hasError;
  
  const inputId = `field-${name}`;
  const errorId = `${inputId}-error`;
  const successId = `${inputId}-success`;

  const renderInput = () => {
    const commonProps = {
      id: inputId,
      name,
      value: value.toString(),
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const newValue = type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
        onChange(newValue);
      },
      onBlur,
      disabled,
      placeholder,
      required,
      'aria-invalid': hasError,
      'aria-describedby': hasError ? errorId : hasSuccess ? successId : undefined,
      className: cn(
        "transition-colors",
        hasError && "border-red-500 focus:border-red-500 focus:ring-red-500",
        hasSuccess && "border-green-500 focus:border-green-500 focus:ring-green-500"
      ),
    };

    switch (type) {
      case 'textarea':
        return (
          <Textarea
            {...commonProps}
            rows={rows}
          />
        );
      
      case 'select':
        return (
          <select
            {...commonProps}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              commonProps.className
            )}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      default:
        return (
          <Input
            {...commonProps}
            type={type}
            min={min}
            max={max}
            step={step}
          />
        );
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label 
        htmlFor={inputId}
        className={cn(
          "text-sm font-medium",
          hasError && "text-red-700 dark:text-red-400",
          hasSuccess && "text-green-700 dark:text-green-400"
        )}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <div className="relative">
        {renderInput()}
        
        {/* Status Icon */}
        {(hasError || hasSuccess) && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {hasError && (
              <FaExclamationCircle className="h-4 w-4 text-red-500" />
            )}
            {hasSuccess && (
              <FaCheckCircle className="h-4 w-4 text-green-500" />
            )}
          </div>
        )}
      </div>
      
      {/* Error Message */}
      {hasError && (
        <p 
          id={errorId}
          className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
          role="alert"
        >
          <FaExclamationCircle className="h-3 w-3 flex-shrink-0" />
          {error}
        </p>
      )}
      
      {/* Success Message */}
      {hasSuccess && (
        <p 
          id={successId}
          className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1"
        >
          <FaCheckCircle className="h-3 w-3 flex-shrink-0" />
          {success}
        </p>
      )}
    </div>
  );
}

// Validation utilities
export const validators = {
  required: (value: string | number) => {
    if (typeof value === 'string' && !value.trim()) {
      return 'This field is required';
    }
    if (typeof value === 'number' && isNaN(value)) {
      return 'This field is required';
    }
    return null;
  },
  
  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },
  
  minLength: (min: number) => (value: string) => {
    if (value.length < min) {
      return `Must be at least ${min} characters long`;
    }
    return null;
  },
  
  maxLength: (max: number) => (value: string) => {
    if (value.length > max) {
      return `Must be no more than ${max} characters long`;
    }
    return null;
  },
  
  minValue: (min: number) => (value: number) => {
    if (value < min) {
      return `Must be at least ${min}`;
    }
    return null;
  },
  
  maxValue: (max: number) => (value: number) => {
    if (value > max) {
      return `Must be no more than ${max}`;
    }
    return null;
  },
  
  pattern: (regex: RegExp, message: string) => (value: string) => {
    if (!regex.test(value)) {
      return message;
    }
    return null;
  },
}; 