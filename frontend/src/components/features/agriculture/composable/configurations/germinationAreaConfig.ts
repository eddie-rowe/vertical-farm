import { AreaConfiguration } from "./types";

// ===== Germination Area Configuration =====

export const germinationAreaConfig: AreaConfiguration = {
  areaType: "germination_tent",
  name: "Germination Tent",
  description:
    "Specialized configuration for germination tents with seed tracking, transplant readiness, and compact layout",

  // ===== Layout Configuration =====
  layout: {
    enableRackGrid: true,
    showShelfDetails: true,
    responsive: {
      gridCols: {
        sm: 1,
        md: 2,
        lg: 3,
        xl: 4,
        "2xl": 5,
      },
      adaptiveLayout: true,
      showDetailsBreakpoint: "sm",
    },
    spacing: {
      areaGap: "gap-4",
      rackGap: "gap-3",
      shelfGap: "gap-1",
      containerPadding: "p-4",
    },
    sizing: {
      minRackHeight: "min-h-[200px]",
      maxRackHeight: "max-h-[400px]",
      shelfAspectRatio: "4:3",
      deviceIconSize: "sm",
    },
  },

  // ===== Interaction Configuration =====
  interactions: {
    enableDoubleClick: true,
    enableContextMenu: true,
    enableDragDrop: false, // Usually fixed positioning for germination
    enableSelection: true,
    selectionMode: "single",
    enableKeyboardNav: true,
    enableTooltips: true,
    clickActions: [
      {
        target: "shelf",
        action: "select",
        enabled: true,
      },
      {
        target: "shelf",
        action: "edit",
        enabled: true,
      },
      {
        target: "rack",
        action: "select",
        enabled: true,
      },
    ],
  },

  // ===== Content Configuration =====
  content: {
    showDevices: true,
    showStatus: true,
    showMetrics: true,
    enableDensityView: true,
    contentStyle: "detailed",
    customRenderers: [],
  },

  // ===== Overlay Configuration =====
  overlays: [
    {
      id: "seeds",
      name: "Seed Information",
      enabled: true,
      defaultVisible: true,
      layer: "devices",
      opacity: 1.0,
      zIndex: 10,
    },
    {
      id: "germination_progress",
      name: "Germination Progress",
      enabled: true,
      defaultVisible: true,
      layer: "monitoring",
      opacity: 0.9,
      zIndex: 15,
    },
    {
      id: "transplant_ready",
      name: "Transplant Ready",
      enabled: true,
      defaultVisible: true,
      layer: "alerts",
      opacity: 1.0,
      zIndex: 20,
    },
    {
      id: "environment",
      name: "Environmental Conditions",
      enabled: true,
      defaultVisible: false,
      layer: "monitoring",
      opacity: 0.7,
      zIndex: 5,
    },
  ],

  // ===== Modal Configuration =====
  modals: [
    {
      id: "seedDetail",
      name: "Seed Detail Editor",
      enabled: true,
      trigger: "double-click",
      target: "shelf",
      component: "ElementDetailModal",
      size: "md",
    },
    {
      id: "plantingWizard",
      name: "Planting Wizard",
      enabled: true,
      trigger: "context-menu",
      target: "shelf",
      component: "GrowWizardModal",
      size: "lg",
    },
    {
      id: "transplantPlanner",
      name: "Transplant Planner",
      enabled: true,
      trigger: "context-menu",
      target: "rack",
      component: "ElementDetailModal",
      size: "xl",
    },
    {
      id: "germinationMonitoring",
      name: "Germination Monitoring",
      enabled: true,
      trigger: "hotkey",
      target: "area",
      component: "LayerOverlayModal",
      size: "xl",
    },
  ],
};

// ===== Germination Area Presets =====

export const germinationAreaPresets: Record<string, AreaConfiguration> = {
  // Standard germination configuration
  standard: germinationAreaConfig,

  // Compact configuration for smaller operations
  compact: {
    ...germinationAreaConfig,
    name: "Compact Germination Tent",
    layout: {
      ...germinationAreaConfig.layout,
      responsive: {
        ...germinationAreaConfig.layout.responsive,
        gridCols: {
          sm: 1,
          md: 1,
          lg: 2,
          xl: 2,
          "2xl": 3,
        },
      },
      spacing: {
        ...germinationAreaConfig.layout.spacing,
        areaGap: "gap-2",
        rackGap: "gap-2",
        containerPadding: "p-2",
      },
    },
    content: {
      ...germinationAreaConfig.content,
      contentStyle: "standard" as const,
    },
    overlays: germinationAreaConfig.overlays.filter((overlay) =>
      ["seeds", "transplant_ready"].includes(overlay.id),
    ),
    modals: germinationAreaConfig.modals.filter((modal) =>
      ["seedDetail", "plantingWizard"].includes(modal.id),
    ),
  },

  // Research configuration with detailed tracking
  research: {
    ...germinationAreaConfig,
    name: "Research Germination Tent",
    content: {
      ...germinationAreaConfig.content,
      contentStyle: "detailed" as const,
      showMetrics: true,
    },
    overlays: [
      ...germinationAreaConfig.overlays,
      {
        id: "research_tracking",
        name: "Research Tracking",
        enabled: true,
        defaultVisible: true,
        layer: "custom",
        opacity: 0.8,
        zIndex: 25,
      },
    ],
    modals: [
      ...germinationAreaConfig.modals,
      {
        id: "researchDataCollection",
        name: "Research Data Collection",
        enabled: true,
        trigger: "context-menu",
        target: "shelf",
        component: "ElementDetailModal",
        size: "xl",
      },
    ],
  },

  // Production configuration for commercial operations
  production: {
    ...germinationAreaConfig,
    name: "Production Germination Tent",
    layout: {
      ...germinationAreaConfig.layout,
      responsive: {
        ...germinationAreaConfig.layout.responsive,
        gridCols: {
          sm: 2,
          md: 3,
          lg: 4,
          xl: 6,
          "2xl": 8,
        },
      },
    },
    interactions: {
      ...germinationAreaConfig.interactions,
      selectionMode: "multiple" as const,
    },
    content: {
      ...germinationAreaConfig.content,
      contentStyle: "minimal" as const,
      showMetrics: true,
    },
    overlays: [
      ...germinationAreaConfig.overlays,
      {
        id: "batch_tracking",
        name: "Batch Tracking",
        enabled: true,
        defaultVisible: true,
        layer: "custom",
        opacity: 0.9,
        zIndex: 30,
      },
    ],
  },

  // Hobby configuration for small-scale operations
  hobby: {
    ...germinationAreaConfig,
    name: "Hobby Germination Tent",
    layout: {
      ...germinationAreaConfig.layout,
      responsive: {
        ...germinationAreaConfig.layout.responsive,
        gridCols: {
          sm: 1,
          md: 1,
          lg: 1,
          xl: 2,
          "2xl": 2,
        },
      },
    },
    interactions: {
      ...germinationAreaConfig.interactions,
      enableContextMenu: false,
      enableKeyboardNav: false,
    },
    content: {
      ...germinationAreaConfig.content,
      contentStyle: "standard" as const,
      enableDensityView: false,
    },
    overlays: germinationAreaConfig.overlays.filter((overlay) =>
      ["seeds", "germination_progress"].includes(overlay.id),
    ),
    modals: germinationAreaConfig.modals.filter((modal) =>
      ["seedDetail"].includes(modal.id),
    ),
  },
};

// ===== Export helpers =====

export function getGerminationAreaConfig(
  preset: string = "standard",
): AreaConfiguration {
  return germinationAreaPresets[preset] || germinationAreaPresets.standard;
}

export function getAvailableGerminationAreaPresets(): string[] {
  return Object.keys(germinationAreaPresets);
}
