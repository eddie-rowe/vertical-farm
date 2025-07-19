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

// Mock data generation
export const generateMockGrows = (count: number = 50): GrowTimelineItem[] => {
  const farms = ["Farm A", "Farm B", "Farm C"];
  const rows = ["Row 1", "Row 2", "Row 3", "Row 4"];
  const racks = ["Rack A", "Rack B", "Rack C"];
  const recipes = [
    "Lettuce Mix",
    "Herb Garden",
    "Microgreens",
    "Spinach Blend",
    "Kale Variety",
  ];
  const species = [
    "Lettuce",
    "Basil",
    "Cilantro",
    "Spinach",
    "Kale",
    "Arugula",
  ];
  const statuses: Array<"planned" | "active" | "completed" | "aborted"> = [
    "planned",
    "active",
    "completed",
    "aborted",
  ];

  return Array.from({ length: count }, (_, i) => {
    const farmName = farms[Math.floor(Math.random() * farms.length)];
    const rowName = rows[Math.floor(Math.random() * rows.length)];
    const rackName = racks[Math.floor(Math.random() * racks.length)];
    const shelfNumber = Math.floor(Math.random() * 8) + 1;
    const shelfName = `Shelf ${shelfNumber}`;

    const totalDays = Math.floor(Math.random() * 60) + 20; // 20-80 days
    const startDate = new Date();
    startDate.setDate(
      startDate.getDate() - Math.floor(Math.random() * 120) - 30,
    ); // Started 30-150 days ago

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + totalDays);

    const today = new Date();
    const daysElapsed = Math.max(
      0,
      Math.floor(
        (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );
    const daysRemaining = Math.max(
      0,
      Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
    );
    const progress = Math.min(100, Math.floor((daysElapsed / totalDays) * 100));

    let status: "planned" | "active" | "completed" | "aborted";
    if (startDate > today) {
      status = "planned";
    } else if (endDate < today) {
      status = Math.random() > 0.1 ? "completed" : "aborted";
    } else {
      status = "active";
    }

    return {
      id: `grow-${i + 1}`,
      shelfId: `${farmName}-${rowName}-${rackName}-${shelfName}`
        .replace(/\s/g, "-")
        .toLowerCase(),
      shelfName,
      rackName,
      rowName,
      farmName,
      recipeName: recipes[Math.floor(Math.random() * recipes.length)],
      speciesName: species[Math.floor(Math.random() * species.length)],
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status,
      progress,
      daysElapsed,
      daysRemaining,
      totalDays,
      yield:
        status === "completed"
          ? Math.floor(Math.random() * 500) + 100
          : undefined,
      automationEnabled: Math.random() > 0.3,
      criticalAlerts: Math.floor(Math.random() * 3),
      environmentalScore: Math.floor(Math.random() * 40) + 60, // 60-100
    };
  });
};

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
