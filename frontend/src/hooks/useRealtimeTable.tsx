'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRealtime } from '../context/RealtimeContext'
import { supabase } from '@/supabaseClient'
import toast from 'react-hot-toast'

interface UseRealtimeTableOptions {
  // Initial data loading
  initialData?: any[]
  
  // Filter options
  filter?: {
    column: string
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in'
    value: any
  }
  
  // Ordering
  orderBy?: {
    column: string
    ascending?: boolean
  }
  
  // Callbacks for real-time events
  onInsert?: (record: any) => void
  onUpdate?: (record: any, oldRecord?: any) => void
  onDelete?: (record: any) => void
  
  // UI feedback options
  showToasts?: boolean
  toastMessages?: {
    insert?: string
    update?: string
    delete?: string
  }
}

/**
 * Custom hook for real-time table subscriptions with automatic data management
 * 
 * @param tableName - The name of the table to subscribe to
 * @param options - Configuration options for the subscription
 * @returns Object with data, loading state, and utility functions
 */
export function useRealtimeTable(tableName: string, options: UseRealtimeTableOptions = {}) {
  const [data, setData] = useState<any[]>(options.initialData || [])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { subscribe, isConnected } = useRealtime()

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      let query = supabase.from(tableName).select('*')
      
      // Apply filters
      if (options.filter) {
        const { column, operator, value } = options.filter
        switch (operator) {
          case 'eq':
            query = query.eq(column, value)
            break
          case 'neq':
            query = query.neq(column, value)
            break
          case 'gt':
            query = query.gt(column, value)
            break
          case 'gte':
            query = query.gte(column, value)
            break
          case 'lt':
            query = query.lt(column, value)
            break
          case 'lte':
            query = query.lte(column, value)
            break
          case 'like':
            query = query.like(column, value)
            break
          case 'ilike':
            query = query.ilike(column, value)
            break
          case 'in':
            query = query.in(column, value)
            break
        }
      }
      
      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending ?? true 
        })
      }
      
      const { data: result, error: queryError } = await query
      
      if (queryError) {
        throw queryError
      }
      
      setData(result || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data'
      setError(errorMessage)
      console.error(`Error loading ${tableName}:`, err)
      
      if (options.showToasts !== false) {
        toast.error(`Failed to load ${tableName}: ${errorMessage}`)
      }
    } finally {
      setLoading(false)
    }
  }, [tableName, options.filter, options.orderBy, options.showToasts])

  // Handle real-time events
  const handleRealtimeEvent = useCallback((event: any) => {
    const { type, record, old_record } = event

    switch (type) {
      case 'INSERT':
        setData(prevData => {
          // Check if record already exists to avoid duplicates
          const exists = prevData.some(item => item.id === record.id)
          if (exists) return prevData
          
          const newData = [...prevData, record]
          
          // Apply ordering if specified
          if (options.orderBy) {
            newData.sort((a, b) => {
              const { column, ascending = true } = options.orderBy!
              const aVal = a[column]
              const bVal = b[column]
              
              if (aVal < bVal) return ascending ? -1 : 1
              if (aVal > bVal) return ascending ? 1 : -1
              return 0
            })
          }
          
          return newData
        })
        
        if (options.onInsert) {
          options.onInsert(record)
        }
        
        if (options.showToasts !== false) {
          const message = options.toastMessages?.insert || `New ${tableName} added`
          toast.success(message)
        }
        break

      case 'UPDATE':
        setData(prevData => 
          prevData.map(item => 
            item.id === record.id ? { ...item, ...record } : item
          )
        )
        
        if (options.onUpdate) {
          options.onUpdate(record, old_record)
        }
        
        if (options.showToasts !== false) {
          const message = options.toastMessages?.update || `${tableName} updated`
          toast.success(message)
        }
        break

      case 'DELETE':
        const deletedRecord = old_record || record
        setData(prevData => 
          prevData.filter(item => item.id !== deletedRecord.id)
        )
        
        if (options.onDelete) {
          options.onDelete(deletedRecord)
        }
        
        if (options.showToasts !== false) {
          const message = options.toastMessages?.delete || `${tableName} deleted`
          toast.error(message)
        }
        break
    }
  }, [tableName, options])

  // Set up subscription and load initial data
  useEffect(() => {
    loadInitialData()
    
    // Subscribe to real-time updates
    const unsubscribe = subscribe(tableName, handleRealtimeEvent)
    
    return unsubscribe
  }, [loadInitialData, subscribe, tableName, handleRealtimeEvent])

  // Utility functions
  const refetch = useCallback(() => {
    loadInitialData()
  }, [loadInitialData])

  const findById = useCallback((id: string) => {
    return data.find(item => item.id === id)
  }, [data])

  const optimisticUpdate = useCallback((id: string, updates: Partial<any>) => {
    setData(prevData => 
      prevData.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    )
  }, [])

  const optimisticInsert = useCallback((record: any) => {
    setData(prevData => [...prevData, record])
  }, [])

  const optimisticDelete = useCallback((id: string) => {
    setData(prevData => prevData.filter(item => item.id !== id))
  }, [])

  return {
    // Data and state
    data,
    loading,
    error,
    isConnected,
    
    // Utility functions
    refetch,
    findById,
    
    // Optimistic updates (use before making API calls for better UX)
    optimisticUpdate,
    optimisticInsert,
    optimisticDelete,
    
    // Stats
    count: data.length,
    isEmpty: data.length === 0,
  }
} 