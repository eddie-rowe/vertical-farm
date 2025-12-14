"use client";

import { BaseEntity } from "../../core/base/BaseCRUDService";

export interface Farm extends BaseEntity {
  name: string;
  location?: string | null;
  user_id?: string | null;
  farm_image_url?: string | null;
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

export interface CreateFarmData {
  name: string;
  location?: string;
  farm_image_url?: string;
}

export interface FarmStatistics {
  totalRows: number;
  totalRacks: number;
  totalShelves: number;
  totalDevices?: number;
  lastUpdated: string;
}

export interface FarmCapacity {
  used: number;
  total: number;
  percentage: number;
}

export enum FarmStatus {
  ONLINE = "online",
  OFFLINE = "offline", 
  MAINTENANCE = "maintenance",
  PARTIAL = "partial"
}

export interface FarmWithCapacity extends Farm {
  status: FarmStatus;
  capacity: FarmCapacity;
  image?: string;
}

export interface YieldEstimate {
  min: number;
  max: number;
  unit: string;
  confidence: number;
}

export interface ProfitEstimate {
  min: number;
  max: number;
  currency: string;
  timeframe: string;
}
