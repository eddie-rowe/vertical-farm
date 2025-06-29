'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize, 
  Minimize, 
  Map, 
  Grid3X3,
  Move,
  MousePointer2,
  Hand
} from 'lucide-react';

export interface ViewState {
  zoom: number;
  panX: number;
  panY: number;
  rotation: number;
}

export interface EnhancedControlsProps {
  viewState: ViewState;
  onViewStateChange: (newState: ViewState) => void;
  isFullscreen?: boolean;
  onFullscreenToggle?: () => void;
  showMinimap?: boolean;
  onMinimapToggle?: () => void;
  containerRef?: React.RefObject<HTMLDivElement>;
  farmDimensions?: { width: number; height: number };
  className?: string;
}

const EnhancedControls: React.FC<EnhancedControlsProps> = ({
  viewState,
  onViewStateChange,
  isFullscreen = false,
  onFullscreenToggle,
  showMinimap = false,
  onMinimapToggle,
  containerRef,
  farmDimensions = { width: 1000, height: 800 },
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [interactionMode, setInteractionMode] = useState<'select' | 'pan'>('select');
  const lastTouchDistance = useRef<number>(0);

  // Zoom limits
  const MIN_ZOOM = 0.1;
  const MAX_ZOOM = 5.0;
  const ZOOM_STEP = 0.1;

  // Handle zoom in
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(viewState.zoom + ZOOM_STEP, MAX_ZOOM);
    onViewStateChange({ ...viewState, zoom: newZoom });
  }, [viewState, onViewStateChange]);

  // Handle zoom out
  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(viewState.zoom - ZOOM_STEP, MIN_ZOOM);
    onViewStateChange({ ...viewState, zoom: newZoom });
  }, [viewState, onViewStateChange]);

  // Reset view to default
  const handleResetView = useCallback(() => {
    onViewStateChange({
      zoom: 1,
      panX: 0,
      panY: 0,
      rotation: 0
    });
  }, [onViewStateChange]);

  // Handle wheel zoom
  const handleWheel = useCallback((event: WheelEvent) => {
    if (!containerRef?.current?.contains(event.target as Node)) return;
    
    event.preventDefault();
    const delta = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, viewState.zoom + delta));
    
    // Zoom towards mouse position
    const rect = containerRef.current!.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    const zoomFactor = newZoom / viewState.zoom;
    const newPanX = viewState.panX - (mouseX - rect.width / 2) * (zoomFactor - 1);
    const newPanY = viewState.panY - (mouseY - rect.height / 2) * (zoomFactor - 1);
    
    onViewStateChange({
      ...viewState,
      zoom: newZoom,
      panX: newPanX,
      panY: newPanY
    });
  }, [viewState, onViewStateChange, containerRef]);

  // Handle mouse down for panning
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (interactionMode !== 'pan') return;
    
    setIsDragging(true);
    setDragStart({ x: event.clientX, y: event.clientY });
    event.preventDefault();
  }, [interactionMode]);

  // Handle mouse move for panning
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging || interactionMode !== 'pan') return;
    
    const deltaX = event.clientX - dragStart.x;
    const deltaY = event.clientY - dragStart.y;
    
    onViewStateChange({
      ...viewState,
      panX: viewState.panX + deltaX,
      panY: viewState.panY + deltaY
    });
    
    setDragStart({ x: event.clientX, y: event.clientY });
  }, [isDragging, dragStart, viewState, onViewStateChange, interactionMode]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle touch events for mobile
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (event.touches.length === 1 && interactionMode === 'pan') {
      const touch = event.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX, y: touch.clientY });
    } else if (event.touches.length === 2) {
      // Pinch zoom
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      lastTouchDistance.current = distance;
    }
  }, [interactionMode]);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    event.preventDefault();
    
    if (event.touches.length === 1 && isDragging && interactionMode === 'pan') {
      const touch = event.touches[0];
      const deltaX = touch.clientX - dragStart.x;
      const deltaY = touch.clientY - dragStart.y;
      
      onViewStateChange({
        ...viewState,
        panX: viewState.panX + deltaX,
        panY: viewState.panY + deltaY
      });
      
      setDragStart({ x: touch.clientX, y: touch.clientY });
    } else if (event.touches.length === 2) {
      // Pinch zoom
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      if (lastTouchDistance.current > 0) {
        const scale = distance / lastTouchDistance.current;
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, viewState.zoom * scale));
        onViewStateChange({ ...viewState, zoom: newZoom });
      }
      
      lastTouchDistance.current = distance;
    }
  }, [isDragging, dragStart, viewState, onViewStateChange, interactionMode]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    lastTouchDistance.current = 0;
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case '0':
          handleResetView();
          break;
        case ' ':
          event.preventDefault();
          setInteractionMode(prev => prev === 'select' ? 'pan' : 'select');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomIn, handleZoomOut, handleResetView]);

  // Mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Wheel event listener
  useEffect(() => {
    const container = containerRef?.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel, containerRef]);

  return (
    <div className={`${className}`}>
      {/* Main Control Panel */}
      <div className="fixed top-4 right-4 z-30 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 space-y-2">
        {/* Zoom Controls */}
        <div className="flex flex-col space-y-1">
          <button
            onClick={handleZoomIn}
            disabled={viewState.zoom >= MAX_ZOOM}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          
          <div className="px-2 py-1 text-xs text-center text-gray-600 dark:text-gray-400 min-w-[3rem]">
            {Math.round(viewState.zoom * 100)}%
          </div>
          
          <button
            onClick={handleZoomOut}
            disabled={viewState.zoom <= MIN_ZOOM}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700"></div>

        {/* View Controls */}
        <div className="flex flex-col space-y-1">
          <button
            onClick={handleResetView}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="Reset View (0)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {onFullscreenToggle && (
            <button
              onClick={onFullscreenToggle}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          )}

          {onMinimapToggle && (
            <button
              onClick={onMinimapToggle}
              className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors ${
                showMinimap 
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
              title="Toggle Minimap"
            >
              <Map className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700"></div>

        {/* Interaction Mode */}
        <div className="flex flex-col space-y-1">
          <button
            onClick={() => setInteractionMode('select')}
            className={`p-2 rounded transition-colors ${
              interactionMode === 'select'
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Select Mode"
          >
            <MousePointer2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setInteractionMode('pan')}
            className={`p-2 rounded transition-colors ${
              interactionMode === 'pan'
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Pan Mode (Space)"
          >
            <Hand className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Minimap */}
      {showMinimap && (
        <div className="fixed bottom-4 right-4 z-30 w-48 h-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300">Farm Overview</h3>
          </div>
          
          <div className="relative w-full h-full bg-gray-50 dark:bg-gray-900">
            {/* Minimap content would go here */}
            <div className="absolute inset-2 border border-gray-300 dark:border-gray-600 rounded">
              {/* Viewport indicator */}
              <div 
                className="absolute border-2 border-blue-500 bg-blue-500/20 rounded"
                style={{
                  left: `${Math.max(0, Math.min(80, 40 - viewState.panX / 10))}%`,
                  top: `${Math.max(0, Math.min(80, 40 - viewState.panY / 10))}%`,
                  width: `${Math.max(10, Math.min(100, 100 / viewState.zoom))}%`,
                  height: `${Math.max(10, Math.min(100, 100 / viewState.zoom))}%`
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Interaction overlay for pan mode */}
      {interactionMode === 'pan' && (
        <div
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ zIndex: 20 }}
        />
      )}

      {/* Status Bar */}
      <div className="fixed bottom-4 left-4 z-30 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-3 py-2">
        <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
          <span>Zoom: {Math.round(viewState.zoom * 100)}%</span>
          <span>Pan: {Math.round(viewState.panX)}, {Math.round(viewState.panY)}</span>
          <span className="capitalize">{interactionMode} Mode</span>
        </div>
      </div>
    </div>
  );
};

export default EnhancedControls; 