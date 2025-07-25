// Composable Farm Area System - Configurable farm visualization components
// Flexible, composable architecture for rendering farm areas

// Main renderer component
export {
  FarmAreaRenderer,
  createFarmAreaConfig,
  getAvailablePresets,
} from "./FarmAreaRenderer";

// Configuration system
export type { AreaConfiguration } from "./configurations/types";
export {
  getGrowingAreaConfig,
  getAvailableGrowingAreaPresets,
} from "./configurations/growingAreaConfig";
export {
  getGerminationAreaConfig,
  getAvailableGerminationAreaPresets,
} from "./configurations/germinationAreaConfig";

// Providers and state management
export {
  FarmAreaProvider,
  useFarmArea,
  useAreaConfiguration,
} from "./providers/FarmAreaProvider";

// Layer components
export { LayoutLayer, RackLayout, ShelfLayout } from "./layers/LayoutLayer";
export {
  InteractionLayer,
  RowInteraction,
  RackInteraction,
  ShelfInteraction,
} from "./layers/InteractionLayer";
export {
  ContentLayer,
  RowContent,
  RackContent,
  ShelfContent,
} from "./layers/ContentLayer";

// Test components
export { FarmAreaTest, FarmAreaTestPage } from "./test/FarmAreaTest";
