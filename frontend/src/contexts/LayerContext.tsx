"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type LayerType = 'devices' | 'automation' | 'monitoring' | 'grows';

interface LayerState {
  isActive: boolean;
  alertCount: number;
}

interface LayerContextType {
  layers: Record<LayerType, LayerState>;
  toggleLayer: (layer: LayerType) => void;
  setLayerAlertCount: (layer: LayerType, count: number) => void;
  getActiveLayerCount: () => number;
  isLayerActive: (layer: LayerType) => boolean;
  activateExclusiveLayer: (layer: LayerType) => void;
  getActiveLayer: () => LayerType | null;
  clearAllLayers: () => void;
}

const LayerContext = createContext<LayerContextType | undefined>(undefined);

interface LayerProviderProps {
  children: ReactNode;
  defaultActiveLayers?: LayerType[];
  exclusiveMode?: boolean;
}

export function LayerProvider({ 
  children, 
  defaultActiveLayers = [], 
  exclusiveMode = true 
}: LayerProviderProps) {
  const [layers, setLayers] = useState<Record<LayerType, LayerState>>({
    devices: {
      isActive: defaultActiveLayers.includes('devices'),
      alertCount: 0,
    },
    automation: {
      isActive: defaultActiveLayers.includes('automation'),
      alertCount: 0,
    },
    monitoring: {
      isActive: defaultActiveLayers.includes('monitoring'),
      alertCount: 3, // Demo alert count
    },
    grows: {
      isActive: defaultActiveLayers.includes('grows'),
      alertCount: 0,
    },
  });

  const toggleLayer = (layer: LayerType) => {
    if (exclusiveMode) {
      activateExclusiveLayer(layer);
    } else {
      setLayers(prev => ({
        ...prev,
        [layer]: {
          ...prev[layer],
          isActive: !prev[layer].isActive
        }
      }));
    }
  };

  const activateExclusiveLayer = (layer: LayerType) => {
    setLayers(prev => {
      const newLayers = { ...prev };
      
      if (newLayers[layer].isActive) {
        newLayers[layer] = {
          ...newLayers[layer],
          isActive: false
        };
      } else {
        Object.keys(newLayers).forEach(key => {
          newLayers[key as LayerType] = {
            ...newLayers[key as LayerType],
            isActive: false
          };
        });
        
        newLayers[layer] = {
          ...newLayers[layer],
          isActive: true
        };
      }
      
      return newLayers;
    });
  };

  const clearAllLayers = () => {
    setLayers(prev => {
      const newLayers = { ...prev };
      Object.keys(newLayers).forEach(key => {
        newLayers[key as LayerType] = {
          ...newLayers[key as LayerType],
          isActive: false
        };
      });
      return newLayers;
    });
  };

  const getActiveLayer = (): LayerType | null => {
    const activeLayer = Object.entries(layers).find(([_, state]) => state.isActive);
    return activeLayer ? (activeLayer[0] as LayerType) : null;
  };

  const setLayerAlertCount = (layer: LayerType, count: number) => {
    setLayers(prev => ({
      ...prev,
      [layer]: {
        ...prev[layer],
        alertCount: count
      }
    }));
  };

  const getActiveLayerCount = () => {
    return Object.values(layers).filter(layer => layer.isActive).length;
  };

  const isLayerActive = (layer: LayerType) => {
    return layers[layer].isActive;
  };

  const value: LayerContextType = {
    layers,
    toggleLayer,
    setLayerAlertCount,
    getActiveLayerCount,
    isLayerActive,
    activateExclusiveLayer,
    getActiveLayer,
    clearAllLayers,
  };

  return (
    <LayerContext.Provider value={value}>
      {children}
    </LayerContext.Provider>
  );
}

export function useLayer() {
  const context = useContext(LayerContext);
  if (context === undefined) {
    throw new Error('useLayer must be used within a LayerProvider');
  }
  return context;
} 