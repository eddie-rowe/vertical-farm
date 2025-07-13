// Enhanced Core UI Components
export { Button, buttonVariants } from './button'
export { Input, inputVariants, labelVariants } from './input'
export { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectScrollDownButton, 
  SelectScrollUpButton, 
  SelectSeparator, 
  SelectTrigger, 
  SelectValue,
  selectTriggerVariants 
} from './select'

// Status Components (Standardized)
export { StatusBadge, statusBadgeVariants } from './status-badge'
export { StatusIndicator, statusIndicatorVariants } from './status-indicator'
export { DeviceStatus, deviceStatusVariants } from './device-status'
export { ConsolidatedStatusBadge } from './ConsolidatedStatusBadge'

export type { StatusBadgeProps } from './status-badge'
export type { StatusIndicatorProps } from './status-indicator'
export type { DeviceStatusProps } from './device-status'

// Legacy UI Components (maintained for compatibility)
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card'
export { Badge, badgeVariants } from './badge'
export { Progress } from './progress'
export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger, DialogClose } from './dialog'
export { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'
export { Textarea } from './textarea'
export { Label } from './label'
export { Checkbox } from './checkbox'
export { Switch } from './switch'
export { Separator } from './separator'
export { Avatar, AvatarFallback, AvatarImage } from './avatar'
export { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetOverlay, SheetPortal, SheetTitle, SheetTrigger } from './sheet'
export { Skeleton } from './skeleton'
export { Slider } from './slider'
export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from './table'
export { Toast, ToastAction, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from './toast'
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'
export { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from './dropdown-menu'

// Farm-Specific Components (Phase 1)
export { FarmControlButton } from './farm-control-button'
export { PlantCard } from './plant-card'
export { SensorPanel } from './sensor-panel'
export { FarmLayout, RackSection, ShelfRow } from './farm-layout'

// Form Components (Phase 2)
export { FarmInput } from './farm-input'
export { FarmSelect } from './farm-select'
export { FarmSearchInput } from './farm-search-input'
export { FarmFilterChips } from './farm-filter-chips'
export { FarmSearchAndFilter } from './farm-search-and-filter'

export type { FarmInputProps } from './farm-input'
export type { FarmSelectProps } from './farm-select'
export type { FarmSearchInputProps } from './farm-search-input'
export type { FarmFilterChipsProps, FilterChip } from './farm-filter-chips'
export type { FarmSearchAndFilterProps, FilterDefinition } from './farm-search-and-filter'

// Form Templates (Phase 2)
export { PlantConfigForm } from './plant-config-form'
export { SensorCalibrationForm } from './sensor-calibration-form'

// Shared Components
export { PageHeader } from './PageHeader'

// Re-export loading components for convenience
export { DashboardSkeleton, LoadingSpinner } from '../loading'; 