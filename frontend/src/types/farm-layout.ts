/**
 * @deprecated This file is deprecated. Import from the following locations instead:
 * - UUID: import { UUID } from "@/types/common"
 * - Farm types: import { Farm, Row, Rack, Shelf, SensorDevice, FarmPageData, etc. } from "@/types/farm/layout"
 *
 * This file will be removed in a future version.
 */

// Re-export from canonical locations for backward compatibility
export type { UUID } from "./common";
export type {
  AreaType,
  RowOrientation,
  SensorType,
  ParentType,
  GerminationData,
  SensorDevice,
  Shelf,
  Rack,
  Row,
  Farm,
  FarmPageData,
  FarmAreaData,
  GerminationSummary,
  TransplantCandidate,
} from "./farm/layout";
