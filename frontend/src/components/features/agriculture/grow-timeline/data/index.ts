import { GrowTimelineItem, StatusGroups, FarmGroups } from "../types";

export const STATUS_COLORS = {
  planned: "#94a3b8", // slate-400
  active: "#22c55e", // green-500
  completed: "#3b82f6", // blue-500
  aborted: "#ef4444", // red-500
} as const;

export const STATUS_LABELS = {
  planned: "Planned",
  active: "Active",
  completed: "Completed",
  aborted: "Aborted",
} as const;

export const SORT_OPTIONS = [
  { value: "startDate", label: "Start Date" },
  { value: "progress", label: "Progress" },
  { value: "daysRemaining", label: "Days Remaining" },
  { value: "environmentalScore", label: "Environmental Score" },
  { value: "shelfName", label: "Shelf Name" },
] as const;

export const ZOOM_LEVELS = [
  { value: 0.5, label: "6 months" },
  { value: 1, label: "3 months" },
  { value: 2, label: "6 weeks" },
  { value: 4, label: "3 weeks" },
] as const;

// Utility functions
export const groupGrowsByStatus = (grows: GrowTimelineItem[]): StatusGroups => {
  return grows.reduce((groups, grow) => {
    const status = grow.status;
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(grow);
    return groups;
  }, {} as StatusGroups);
};

export const groupGrowsByFarm = (grows: GrowTimelineItem[]): FarmGroups => {
  return grows.reduce((groups, grow) => {
    const { farmName, rowName, rackName } = grow;

    if (!groups[farmName]) {
      groups[farmName] = {};
    }
    if (!groups[farmName][rowName]) {
      groups[farmName][rowName] = {};
    }
    if (!groups[farmName][rowName][rackName]) {
      groups[farmName][rowName][rackName] = [];
    }

    groups[farmName][rowName][rackName].push(grow);
    return groups;
  }, {} as FarmGroups);
};

export const filterGrows = (
  grows: GrowTimelineItem[],
  searchTerm: string,
  statusFilter: string,
): GrowTimelineItem[] => {
  return grows.filter((grow) => {
    const matchesSearch =
      !searchTerm ||
      grow.shelfName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grow.recipeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grow.speciesName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grow.farmName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      !statusFilter || statusFilter === "all" || grow.status === statusFilter;

    return matchesSearch && matchesStatus;
  });
};
