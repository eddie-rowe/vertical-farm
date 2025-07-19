export interface GrowTimelineItem {
  id: string;
  shelfId: string;
  shelfName: string;
  rackName: string;
  rowName: string;
  farmName: string;
  recipeName: string;
  speciesName: string;
  startDate: string;
  endDate: string;
  status: "planned" | "active" | "completed" | "aborted";
  progress: number;
  daysElapsed: number;
  daysRemaining: number;
  totalDays: number;
  yield?: number;
  automationEnabled: boolean;
  criticalAlerts: number;
  environmentalScore: number;
}

export interface InteractiveGrowTimelineProps {
  selectedGrowId?: string;
  onGrowSelect?: (growId: string) => void;
  onGrowAction?: (growId: string, action: string) => void;
  viewMode?: ViewMode;
  timeRange?: number; // days
}

export type ViewMode = "timeline" | "spatial" | "status" | "management";

export type SortField =
  | "startDate"
  | "progress"
  | "daysRemaining"
  | "environmentalScore"
  | "shelfName";

export type SortOrder = "asc" | "desc";

export interface TimelineState {
  grows: GrowTimelineItem[];
  filteredGrows: GrowTimelineItem[];
  isLoading: boolean;
  zoomLevel: number;
  currentDate: Date;
  hoveredGrow: string | null;
  isFullscreen: boolean;
  searchTerm: string;
  statusFilter: string;
  selectedGrows: string[];
  sortBy: SortField;
  sortOrder: SortOrder;
}

export interface TimelinePosition {
  left: string;
  width: string;
}

export interface GroupedGrows {
  [key: string]: GrowTimelineItem[];
}

export interface StatusGroups {
  [status: string]: GrowTimelineItem[];
}

export interface FarmGroups {
  [farmName: string]: {
    [rowName: string]: {
      [rackName: string]: GrowTimelineItem[];
    };
  };
}
