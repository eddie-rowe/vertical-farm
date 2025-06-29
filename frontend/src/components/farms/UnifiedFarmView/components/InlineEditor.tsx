import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Check, X, Edit3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface InlineEditorProps {
  value: string
  onSave: (value: string) => void
  onCancel?: () => void
  placeholder?: string
  className?: string
  editMode?: boolean
  showEditIcon?: boolean
  disabled?: boolean
}

export const InlineEditor: React.FC<InlineEditorProps> = ({
  value,
  onSave,
  onCancel,
  placeholder = "Enter value",
  className,
  editMode = false,
  showEditIcon = true,
  disabled = false
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setEditValue(value)
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = useCallback(() => {
    if (editValue.trim() !== value) {
      onSave(editValue.trim())
    }
    setIsEditing(false)
  }, [editValue, value, onSave])

  const handleCancel = useCallback(() => {
    setEditValue(value)
    setIsEditing(false)
    onCancel?.()
  }, [value, onCancel])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }, [handleSave, handleCancel])

  const startEditing = useCallback(() => {
    if (!disabled) {
      setIsEditing(true)
    }
  }, [disabled])

  if (isEditing) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="h-8 text-sm"
          onBlur={handleSave}
        />
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
          onClick={handleSave}
        >
          <Check className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
          onClick={handleCancel}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    )
  }

  return (
    <div 
      className={cn(
        "group flex items-center gap-1 cursor-pointer",
        editMode && !disabled && "hover:bg-slate-100 dark:hover:bg-slate-700 rounded px-1 py-0.5",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
      onClick={startEditing}
    >
      <span className="text-sm font-medium">
        {value || placeholder}
      </span>
      {editMode && showEditIcon && !disabled && (
        <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500" />
      )}
    </div>
  )
} 