"use client"

import React, { createContext, useContext, useReducer, useCallback } from 'react'
import {
  FarmAreaState,
  FarmAreaAction,
  FarmAreaContextValue,
  FarmAreaActions,
  UseFarmAreaReturn,
  AreaConfiguration,
  FarmElement
} from '../configurations/types'
import { Row, Rack, Shelf } from '@/types/farm'

// ===== Initial State =====

const initialState: FarmAreaState = {
  selectedRow: null,
  selectedRack: null,
  selectedShelf: null,
  selectedElement: null,
  visibleOverlays: [],
  activeModal: null,
  editMode: false,
  dragMode: false
}

// ===== Reducer =====

function farmAreaReducer(state: FarmAreaState, action: FarmAreaAction): FarmAreaState {
  switch (action.type) {
    case 'SELECT_ROW':
      return {
        ...state,
        selectedRow: action.payload,
        selectedRack: null,
        selectedShelf: null,
        selectedElement: action.payload ? {
          type: 'row',
          id: action.payload.id,
          data: action.payload
        } : null
      }
    
    case 'SELECT_RACK':
      return {
        ...state,
        selectedRack: action.payload,
        selectedShelf: null,
        selectedElement: action.payload ? {
          type: 'rack',
          id: action.payload.id,
          data: action.payload
        } : null
      }
    
    case 'SELECT_SHELF':
      return {
        ...state,
        selectedShelf: action.payload,
        selectedElement: action.payload ? {
          type: 'shelf',
          id: action.payload.id,
          data: action.payload
        } : null
      }
    
    case 'SELECT_ELEMENT':
      return {
        ...state,
        selectedElement: action.payload,
        // Update specific selections based on element type
        selectedRow: action.payload?.type === 'row' ? action.payload.data as Row : state.selectedRow,
        selectedRack: action.payload?.type === 'rack' ? action.payload.data as Rack : state.selectedRack,
        selectedShelf: action.payload?.type === 'shelf' ? action.payload.data as Shelf : state.selectedShelf
      }
    
    case 'TOGGLE_OVERLAY':
      return {
        ...state,
        visibleOverlays: state.visibleOverlays.includes(action.payload)
          ? state.visibleOverlays.filter(id => id !== action.payload)
          : [...state.visibleOverlays, action.payload]
      }
    
    case 'SHOW_MODAL':
      return {
        ...state,
        activeModal: action.payload
      }
    
    case 'HIDE_MODAL':
      return {
        ...state,
        activeModal: null
      }
    
    case 'SET_EDIT_MODE':
      return {
        ...state,
        editMode: action.payload
      }
    
    case 'SET_DRAG_MODE':
      return {
        ...state,
        dragMode: action.payload
      }
    
    case 'RESET_STATE':
      return {
        ...initialState,
        // Keep configuration-specific default overlays
        visibleOverlays: state.visibleOverlays.filter(id => 
          // This will be populated from configuration
          false
        )
      }
    
    default:
      return state
  }
}

// ===== Context =====

const FarmAreaContext = createContext<FarmAreaContextValue | null>(null)

// ===== Provider Component =====

interface FarmAreaProviderProps {
  configuration: AreaConfiguration
  children: React.ReactNode
  initialOverlays?: string[]
}

export function FarmAreaProvider({ 
  configuration, 
  children, 
  initialOverlays = [] 
}: FarmAreaProviderProps) {
  // Initialize state with configuration-specific defaults
  const configuredInitialState: FarmAreaState = {
    ...initialState,
    visibleOverlays: [
      ...initialOverlays,
      ...configuration.overlays
        .filter(overlay => overlay.defaultVisible)
        .map(overlay => overlay.id)
    ]
  }

  const [state, dispatch] = useReducer(farmAreaReducer, configuredInitialState)

  const contextValue: FarmAreaContextValue = {
    state,
    dispatch,
    configuration
  }

  return (
    <FarmAreaContext.Provider value={contextValue}>
      {children}
    </FarmAreaContext.Provider>
  )
}

// ===== Custom Hook =====

export function useFarmArea(): UseFarmAreaReturn {
  const context = useContext(FarmAreaContext)
  
  if (!context) {
    throw new Error('useFarmArea must be used within a FarmAreaProvider')
  }

  const { state, dispatch, configuration } = context

  // Create memoized action creators
  const actions: FarmAreaActions = {
    selectRow: useCallback((row: Row | null) => {
      dispatch({ type: 'SELECT_ROW', payload: row })
    }, [dispatch]),

    selectRack: useCallback((rack: Rack | null) => {
      dispatch({ type: 'SELECT_RACK', payload: rack })
    }, [dispatch]),

    selectShelf: useCallback((shelf: Shelf | null) => {
      dispatch({ type: 'SELECT_SHELF', payload: shelf })
    }, [dispatch]),

    selectElement: useCallback((element: FarmElement | null) => {
      dispatch({ type: 'SELECT_ELEMENT', payload: element })
    }, [dispatch]),

    toggleOverlay: useCallback((overlayId: string) => {
      dispatch({ type: 'TOGGLE_OVERLAY', payload: overlayId })
    }, [dispatch]),

    showModal: useCallback((modalId: string) => {
      dispatch({ type: 'SHOW_MODAL', payload: modalId })
    }, [dispatch]),

    hideModal: useCallback(() => {
      dispatch({ type: 'HIDE_MODAL' })
    }, [dispatch]),

    setEditMode: useCallback((enabled: boolean) => {
      dispatch({ type: 'SET_EDIT_MODE', payload: enabled })
    }, [dispatch]),

    setDragMode: useCallback((enabled: boolean) => {
      dispatch({ type: 'SET_DRAG_MODE', payload: enabled })
    }, [dispatch]),

    resetState: useCallback(() => {
      dispatch({ type: 'RESET_STATE' })
    }, [dispatch])
  }

  return {
    state,
    actions,
    configuration
  }
}

// ===== Convenience Hooks =====

export function useAreaConfiguration() {
  const { configuration } = useFarmArea()
  return configuration
}

export function useAreaState() {
  const { state } = useFarmArea()
  return state
}

export function useAreaActions() {
  const { actions } = useFarmArea()
  return actions
}

export function useAreaInteractions() {
  const { configuration, actions } = useFarmArea()
  
  return {
    isDoubleClickEnabled: configuration.interactions.enableDoubleClick,
    isContextMenuEnabled: configuration.interactions.enableContextMenu,
    isSelectionEnabled: configuration.interactions.enableSelection,
    selectionMode: configuration.interactions.selectionMode,
    actions
  }
} 