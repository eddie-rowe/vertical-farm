"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

import { FarmService } from "@/services/domain/farm/FarmService";
import { RowService } from "@/services/domain/farm/RowService";
import { RackService } from "@/services/domain/farm/RackService";
import { ShelfService } from "@/services/domain/farm/ShelfService";
import type { Farm, Row, Rack, Shelf } from "@/services/domain/farm/types";

export interface UseFarmHierarchyResult {
  farms: Farm[];
  rows: Row[];
  racks: Rack[];
  shelves: Shelf[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  getRowsByFarm: (farmId: string) => Row[];
  getRacksByRow: (rowId: string) => Rack[];
  getShelvesByRack: (rackId: string) => Shelf[];
  getFarmById: (farmId: string) => Farm | undefined;
  getRowById: (rowId: string) => Row | undefined;
  getRackById: (rackId: string) => Rack | undefined;
  getShelfById: (shelfId: string) => Shelf | undefined;
  getLocationBreadcrumb: (params: {
    farmId?: string;
    rowId?: string;
    rackId?: string;
    shelfId?: string;
  }) => string;
}

export function useFarmHierarchy(): UseFarmHierarchyResult {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [racks, setRacks] = useState<Rack[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHierarchy = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const farmService = FarmService.getInstance();
      const rowService = RowService.getInstance();
      const rackService = RackService.getInstance();
      const shelfService = ShelfService.getInstance();

      // Fetch all farms first
      const farmsData = await farmService.getAll();
      setFarms(farmsData);

      if (farmsData.length === 0) {
        setRows([]);
        setRacks([]);
        setShelves([]);
        return;
      }

      // Fetch all rows for all farms (filter out farms without IDs)
      const farmsWithIds = farmsData.filter((farm): farm is Farm & { id: string } => !!farm.id);
      const rowPromises = farmsWithIds.map((farm) =>
        rowService.getRowsByFarm(farm.id)
      );
      const rowsArrays = await Promise.all(rowPromises);
      const allRows = rowsArrays.flat();
      setRows(allRows);

      if (allRows.length === 0) {
        setRacks([]);
        setShelves([]);
        return;
      }

      // Fetch all racks for all rows (filter out rows without IDs)
      const rowsWithIds = allRows.filter((row): row is Row & { id: string } => !!row.id);
      const rackPromises = rowsWithIds.map((row) =>
        rackService.getRacksByRow(row.id)
      );
      const racksArrays = await Promise.all(rackPromises);
      const allRacks = racksArrays.flat();
      setRacks(allRacks);

      if (allRacks.length === 0) {
        setShelves([]);
        return;
      }

      // Fetch all shelves for all racks (filter out racks without IDs)
      const racksWithIds = allRacks.filter((rack): rack is Rack & { id: string } => !!rack.id);
      const shelfPromises = racksWithIds.map((rack) =>
        shelfService.getShelvesByRack(rack.id)
      );
      const shelvesArrays = await Promise.all(shelfPromises);
      const allShelves = shelvesArrays.flat();
      setShelves(allShelves);
    } catch (err) {
      console.error("Error fetching farm hierarchy:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch farm hierarchy"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHierarchy();
  }, [fetchHierarchy]);

  // Memoized lookup maps for efficient access
  const farmMap = useMemo(
    () => new Map(farms.map((f) => [f.id, f])),
    [farms]
  );

  const rowMap = useMemo(
    () => new Map(rows.map((r) => [r.id, r])),
    [rows]
  );

  const rackMap = useMemo(
    () => new Map(racks.map((r) => [r.id, r])),
    [racks]
  );

  const shelfMap = useMemo(
    () => new Map(shelves.map((s) => [s.id, s])),
    [shelves]
  );

  // Filter functions
  const getRowsByFarm = useCallback(
    (farmId: string): Row[] => rows.filter((row) => row.farm_id === farmId),
    [rows]
  );

  const getRacksByRow = useCallback(
    (rowId: string): Rack[] => racks.filter((rack) => rack.row_id === rowId),
    [racks]
  );

  const getShelvesByRack = useCallback(
    (rackId: string): Shelf[] => shelves.filter((shelf) => shelf.rack_id === rackId),
    [shelves]
  );

  // Lookup functions
  const getFarmById = useCallback(
    (farmId: string): Farm | undefined => farmMap.get(farmId),
    [farmMap]
  );

  const getRowById = useCallback(
    (rowId: string): Row | undefined => rowMap.get(rowId),
    [rowMap]
  );

  const getRackById = useCallback(
    (rackId: string): Rack | undefined => rackMap.get(rackId),
    [rackMap]
  );

  const getShelfById = useCallback(
    (shelfId: string): Shelf | undefined => shelfMap.get(shelfId),
    [shelfMap]
  );

  // Build location breadcrumb string
  const getLocationBreadcrumb = useCallback(
    (params: {
      farmId?: string;
      rowId?: string;
      rackId?: string;
      shelfId?: string;
    }): string => {
      const parts: string[] = [];

      if (params.farmId) {
        const farm = farmMap.get(params.farmId);
        if (farm) parts.push(farm.name);
      }

      if (params.rowId) {
        const row = rowMap.get(params.rowId);
        if (row) parts.push(row.name);
      }

      if (params.rackId) {
        const rack = rackMap.get(params.rackId);
        if (rack) parts.push(rack.name);
      }

      if (params.shelfId) {
        const shelf = shelfMap.get(params.shelfId);
        if (shelf) parts.push(shelf.name);
      }

      return parts.join(" > ") || "No location assigned";
    },
    [farmMap, rowMap, rackMap, shelfMap]
  );

  return {
    farms,
    rows,
    racks,
    shelves,
    isLoading,
    error,
    refresh: fetchHierarchy,
    getRowsByFarm,
    getRacksByRow,
    getShelvesByRack,
    getFarmById,
    getRowById,
    getRackById,
    getShelfById,
    getLocationBreadcrumb,
  };
}
