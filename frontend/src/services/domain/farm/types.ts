"use client";

import { BaseEntity } from "../../core/base/BaseCRUDService";

export interface Farm extends BaseEntity {
  name: string;
  location?: string | null;
  user_id?: string | null;
}

export interface Row extends BaseEntity {
  farm_id: string;
  name: string;
  position: number;
  description?: string | null;
}

export interface Rack extends BaseEntity {
  row_id: string;
  name: string;
  position: number;
  description?: string | null;
}

export interface Shelf extends BaseEntity {
  rack_id: string;
  name: string;
  position: number;
  description?: string | null;
}

export enum PermissionLevel {
  VIEWER = "viewer",
  EDITOR = "editor",
  MANAGER = "manager",
}

export interface UserPermission extends BaseEntity {
  farm_id: string;
  user_id: string;
  permission: PermissionLevel;
}

export interface UserPermissionCreatePayload {
  farm_id: string;
  user_id: string;
  permission: PermissionLevel;
}

export interface UserPermissionUpdatePayload {
  permission: PermissionLevel;
}

export interface FarmHierarchy {
  farm: Farm;
  rows: Array<{
    row: Row;
    racks: Array<{
      rack: Rack;
      shelves: Shelf[];
    }>;
  }>;
}

export interface FarmStatistics {
  totalRows: number;
  totalRacks: number;
  totalShelves: number;
  totalDevices?: number;
  lastUpdated: string;
}
