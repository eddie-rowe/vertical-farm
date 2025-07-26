import { AreaConfiguration } from "./types";

// ===== Growing Area Configuration =====

export const growingAreaConfig: AreaConfiguration = {
  areaType: "grow_area",
  name: "Growing Area",
  description:
    "Full-featured configuration for active growing areas with comprehensive monitoring and control capabilities",

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
      showDetailsBreakpoint: "md",
    },
    spacing: {
      areaGap: "gap-6",
      rackGap: "gap-4",
      shelfGap: "gap-2",
      containerPadding: "p-6",
    },
    sizing: {
      minRackHeight: "min-h-[300px]",
      maxRackHeight: "max-h-[600px]",
      shelfAspectRatio: "3:2",
      deviceIconSize: "md",
    },
  },

  // ===== Interaction Configuration =====
  interactions: {
    enableDoubleClick: true,
    enableContextMenu: true,
    enableDragDrop: true,
    enableSelection: true,
    selectionMode: "single",
    enableKeyboardNav: true,
    enableTooltips: true,
    clickActions: [
      {
        target: "row",
        action: "select",
        enabled: true,
      },
      {
        target: "rack",
        action: "select",
        enabled: true,
      },
      {
        target: "shelf",
        action: "select",
        enabled: true,
      },
      {
        target: "rack",
        action: "edit",
        enabled: true,
      },
      {
        target: "shelf",
        action: "edit",
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
      id: "devices",
      name: "Device Status",
      enabled: true,
      defaultVisible: true,
      layer: "devices",
      opacity: 1.0,
      zIndex: 10,
    },
    {
      id: "monitoring",
      name: "Environmental Monitoring",
      enabled: true,
      defaultVisible: false,
      layer: "monitoring",
      opacity: 0.8,
      zIndex: 20,
    },
    {
      id: "automation",
      name: "Automation Status",
      enabled: true,
      defaultVisible: false,
      layer: "automation",
      opacity: 0.9,
      zIndex: 15,
    },
    {
      id: "grows",
      name: "Grow Information",
      enabled: true,
      defaultVisible: true,
      layer: "grows",
      opacity: 1.0,
      zIndex: 5,
    },
    {
      id: "alerts",
      name: "Alert Indicators",
      enabled: true,
      defaultVisible: true,
      layer: "alerts",
      opacity: 1.0,
      zIndex: 30,
    },
  ],

  // ===== Modal Configuration =====
  modals: [
    {
      id: "elementDetail",
      name: "Element Detail Editor",
      enabled: true,
      trigger: "double-click",
      target: "rack",
      component: "ElementDetailModal",
      size: "lg",
    },
    {
      id: "shelfDetail",
      name: "Shelf Detail Editor",
      enabled: true,
      trigger: "double-click",
      target: "shelf",
      component: "ElementDetailModal",
      size: "md",
    },
    {
      id: "growWizard",
      name: "Grow Setup Wizard",
      enabled: true,
      trigger: "context-menu",
      target: "shelf",
      component: "GrowWizardModal",
      size: "xl",
    },
    {
      id: "deviceAssignment",
      name: "Device Assignment",
      enabled: true,
      trigger: "context-menu",
      target: "rack",
      component: "ElementDetailModal",
      size: "lg",
    },
    {
      id: "layerConfig",
      name: "Layer Configuration",
      enabled: true,
      trigger: "hotkey",
      target: "area",
      component: "LayerOverlayModal",
      size: "xl",
    },
  ],
};

// ===== Preset Configurations =====

export const growingAreaPresets: Record<string, AreaConfiguration> = {
  // Standard full-featured configuration
  standard: growingAreaConfig,

  // Simplified configuration for basic usage
  simple: {
    ...growingAreaConfig,
    name: "Simple Growing Area",
    layout: {
      ...growingAreaConfig.layout,
      responsive: {
        ...growingAreaConfig.layout.responsive,
        gridCols: {
          sm: 1,
          md: 1,
          lg: 2,
          xl: 3,
          "2xl": 3,
        },
      },
    },
    interactions: {
      ...growingAreaConfig.interactions,
      enableDragDrop: false,
      enableContextMenu: false,
    },
    content: {
      ...growingAreaConfig.content,
      contentStyle: "standard" as const,
      enableDensityView: false,
    },
    overlays: growingAreaConfig.overlays.filter((overlay) =>
      ["devices", "grows", "alerts"].includes(overlay.id),
    ),
    modals: growingAreaConfig.modals.filter((modal) =>
      ["elementDetail", "shelfDetail"].includes(modal.id),
    ),
  },

  // Commercial/Enterprise configuration
  commercial: {
    ...growingAreaConfig,
    name: "Commercial Growing Area",
    layout: {
      ...growingAreaConfig.layout,
      responsive: {
        ...growingAreaConfig.layout.responsive,
        gridCols: {
          sm: 2,
          md: 4,
          lg: 6,
          xl: 8,
          "2xl": 10,
        },
      },
      spacing: {
        ...growingAreaConfig.layout.spacing,
        areaGap: "gap-4",
        rackGap: "gap-3",
        containerPadding: "p-4",
      },
    },
    content: {
      ...growingAreaConfig.content,
      contentStyle: "minimal" as const,
      showMetrics: true,
    },
  },

  // Research/Lab configuration
  research: {
    ...growingAreaConfig,
    name: "Research Growing Area",
    overlays: [
      ...growingAreaConfig.overlays,
      {
        id: "research_data",
        name: "Research Data",
        enabled: true,
        defaultVisible: true,
        layer: "custom",
        opacity: 0.7,
        zIndex: 25,
      },
    ],
    modals: [
      ...growingAreaConfig.modals,
      {
        id: "dataCollection",
        name: "Data Collection",
        enabled: true,
        trigger: "context-menu",
        target: "shelf",
        component: "ElementDetailModal",
        size: "xl",
      },
    ],
  },
};

// ===== Export helpers =====

export function getGrowingAreaConfig(
  preset: string = "standard",
): AreaConfiguration {
  return growingAreaPresets[preset] || growingAreaPresets.standard;
}

export function getAvailableGrowingAreaPresets(): string[] {
  return Object.keys(growingAreaPresets);
}
