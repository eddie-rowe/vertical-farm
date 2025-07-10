import { AreaType, Row, Rack, Shelf } from '@/types/farm'

// ===== Core Configuration Types =====

export interface AreaConfiguration {
  layout: LayoutConfig
  interactions: InteractionConfig
  content: ContentConfig
  overlays: OverlayConfig[]
  modals: ModalConfig[]
  areaType: AreaType
  name: string
  description: string
}

// ===== Layout Configuration =====

export interface LayoutConfig {
  enableRackGrid: boolean
  showShelfDetails: boolean
  responsive: ResponsiveConfig
  spacing: SpacingConfig
  sizing: SizingConfig
}

export interface ResponsiveConfig {
  gridCols: {
    sm: number
    md: number
    lg: number
    xl: number
    '2xl': number
  }
  adaptiveLayout: boolean
  showDetailsBreakpoint: 'sm' | 'md' | 'lg' | 'xl'
}

export interface SpacingConfig {
  areaGap: string
  rackGap: string
  shelfGap: string
  containerPadding: string
}

export interface SizingConfig {
  minRackHeight: string
  maxRackHeight: string
  shelfAspectRatio: string
  deviceIconSize: 'sm' | 'md' | 'lg'
}

// ===== Interaction Configuration =====

export interface InteractionConfig {
  enableDoubleClick: boolean
  enableContextMenu: boolean
  enableDragDrop: boolean
  enableSelection: boolean
  selectionMode: 'single' | 'multiple' | 'none'
  enableKeyboardNav: boolean
  enableTooltips: boolean
  clickActions: ClickActionConfig[]
}

export interface ClickActionConfig {
  target: 'row' | 'rack' | 'shelf' | 'device'
  action: 'select' | 'edit' | 'toggle' | 'navigate' | 'custom'
  enabled: boolean
  customHandler?: string
}

// ===== Content Configuration =====

export interface ContentConfig {
  showDevices: boolean
  showStatus: boolean
  showMetrics: boolean
  enableDensityView: boolean
  contentStyle: 'minimal' | 'standard' | 'detailed'
  customRenderers: CustomRendererConfig[]
}

export interface CustomRendererConfig {
  target: 'row' | 'rack' | 'shelf' | 'device'
  component: string
  props?: Record<string, any>
}

// ===== Overlay Configuration =====

export interface OverlayConfig {
  id: string
  name: string
  enabled: boolean
  defaultVisible: boolean
  layer: 'devices' | 'monitoring' | 'automation' | 'grows' | 'alerts' | 'custom'
  opacity: number
  zIndex: number
  blendMode?: 'normal' | 'multiply' | 'overlay' | 'soft-light'
  customRenderer?: string
}

// ===== Modal Configuration =====

export interface ModalConfig {
  id: string
  name: string
  enabled: boolean
  trigger: 'click' | 'double-click' | 'context-menu' | 'hotkey'
  target: 'row' | 'rack' | 'shelf' | 'device' | 'area'
  component: string
  size: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  persistent?: boolean
}

// ===== State Management Types =====

export interface FarmAreaState {
  selectedRow: Row | null
  selectedRack: Rack | null
  selectedShelf: Shelf | null
  selectedElement: FarmElement | null
  visibleOverlays: string[]
  activeModal: string | null
  editMode: boolean
  dragMode: boolean
}

export interface FarmElement {
  type: 'row' | 'rack' | 'shelf' | 'device'
  id: string
  data: Row | Rack | Shelf | any
  position?: { x: number; y: number }
}

// ===== Action Types =====

export type FarmAreaAction =
  | { type: 'SELECT_ROW'; payload: Row | null }
  | { type: 'SELECT_RACK'; payload: Rack | null }
  | { type: 'SELECT_SHELF'; payload: Shelf | null }
  | { type: 'SELECT_ELEMENT'; payload: FarmElement | null }
  | { type: 'TOGGLE_OVERLAY'; payload: string }
  | { type: 'SHOW_MODAL'; payload: string }
  | { type: 'HIDE_MODAL' }
  | { type: 'SET_EDIT_MODE'; payload: boolean }
  | { type: 'SET_DRAG_MODE'; payload: boolean }
  | { type: 'RESET_STATE' }

// ===== Hook Types =====

export interface UseFarmAreaReturn {
  state: FarmAreaState
  actions: FarmAreaActions
  configuration: AreaConfiguration
}

export interface FarmAreaActions {
  selectRow: (row: Row | null) => void
  selectRack: (rack: Rack | null) => void
  selectShelf: (shelf: Shelf | null) => void
  selectElement: (element: FarmElement | null) => void
  toggleOverlay: (overlayId: string) => void
  showModal: (modalId: string) => void
  hideModal: () => void
  setEditMode: (enabled: boolean) => void
  setDragMode: (enabled: boolean) => void
  resetState: () => void
}

// ===== Context Types =====

export interface FarmAreaContextValue {
  state: FarmAreaState
  dispatch: React.Dispatch<FarmAreaAction>
  configuration: AreaConfiguration
}

export interface ConfigurationProviderProps {
  configuration: AreaConfiguration
  children: React.ReactNode
} 