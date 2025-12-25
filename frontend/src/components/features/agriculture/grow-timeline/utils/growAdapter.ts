import type { GrowWithDetails } from "@/services/domain/farm/GrowService";
import type { GrowTimelineItem } from "../types";

/**
 * Converts a GrowWithDetails from the service layer to a GrowTimelineItem
 * for use in the timeline visualization components.
 */
export function adaptGrowToTimelineItem(grow: GrowWithDetails): GrowTimelineItem {
  const startDate = new Date(grow.start_date);
  const today = new Date();

  // Calculate end date from recipe duration or estimated harvest date
  const totalDays = grow.grow_recipe?.total_grow_days || 30;
  const endDate = grow.estimated_harvest_date
    ? new Date(grow.estimated_harvest_date)
    : new Date(startDate.getTime() + totalDays * 24 * 60 * 60 * 1000);

  // Calculate days elapsed and remaining
  const daysElapsed = Math.max(0, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.max(0, Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  // Calculate progress percentage
  let progress: number;
  if (grow.status === "harvested") {
    progress = 100;
  } else if (grow.status === "planned" || startDate > today) {
    progress = 0;
  } else {
    progress = grow.progress_percentage ?? Math.min(100, Math.floor((daysElapsed / totalDays) * 100));
  }

  // Map service status to timeline status
  const status = mapGrowStatus(grow.status);

  // Extract location hierarchy
  const shelfName = grow.shelf?.name || "Unknown Shelf";
  const rackName = grow.shelf?.rack?.name || "Unknown Rack";
  const rowName = grow.shelf?.rack?.row?.name || "Unknown Row";
  const farmName = grow.shelf?.rack?.row?.farm?.name || "Unknown Farm";

  return {
    id: grow.id || "",
    shelfId: grow.shelf_id || "",
    shelfName,
    rackName,
    rowName,
    farmName,
    recipeName: grow.grow_recipe?.name || grow.name,
    speciesName: grow.grow_recipe?.species?.name || "Unknown Species",
    startDate: grow.start_date,
    endDate: endDate.toISOString(),
    status,
    progress,
    daysElapsed,
    daysRemaining,
    totalDays,
    yield: grow.yield_actual,
    automationEnabled: grow.automation_enabled ?? false,
    criticalAlerts: 0, // TODO: Integrate with alerts system when available
    environmentalScore: 85, // TODO: Calculate from sensor data when available
  };
}

/**
 * Maps GrowService status values to timeline status values.
 *
 * Service statuses: planned, active, harvested, failed, paused
 * Timeline statuses: planned, active, completed, aborted
 */
function mapGrowStatus(status: string): "planned" | "active" | "completed" | "aborted" {
  switch (status) {
    case "planned":
      return "planned";
    case "active":
    case "paused":
      return "active";
    case "harvested":
      return "completed";
    case "failed":
      return "aborted";
    default:
      return "planned";
  }
}

/**
 * Batch convert an array of grows to timeline items.
 */
export function adaptGrowsToTimelineItems(grows: GrowWithDetails[]): GrowTimelineItem[] {
  return grows.map(adaptGrowToTimelineItem);
}
