/**
 * Home Assistant device types
 * Types specific to Home Assistant integration
 */

import { DeviceState, DeviceAttributes } from './core';

/**
 * Home Assistant device entity
 * Raw device data from Home Assistant
 */
export interface HADevice {
  /** Home Assistant entity ID */
  entity_id: string;
  /** User-friendly display name */
  friendly_name?: string;
  /** Current state of the device */
  state: string;
  /** Device attributes and metadata */
  attributes: Record<string, unknown>;
  /** When the state last changed */
  last_changed?: string;
  /** When the state was last updated */
  last_updated?: string;
  /** Home Assistant domain (e.g., 'light', 'switch', 'sensor') */
  domain: string;
  /** Device class classification */
  device_class?: string;
  /** Unit of measurement for sensor values */
  unit_of_measurement?: string;
  /** Area assignment in Home Assistant */
  area?: string;
  /** Icon identifier */
  icon?: string;
  /** Supported features bitmask */
  supported_features?: number;
}

/**
 * Home Assistant device state data
 * Cached state information from Home Assistant
 */
export interface HADeviceStateData {
  /** Home Assistant entity ID */
  entity_id: string;
  /** Current device state */
  state: DeviceState;
  /** Device attributes */
  attributes: DeviceAttributes;
  /** When the state was last updated */
  last_updated: string;
  /** When the state last changed */
  last_changed: string;
  /** Whether the device is currently online */
  is_online: boolean;
}

/**
 * Home Assistant service call
 * Structure for calling Home Assistant services
 */
export interface HAServiceCall {
  /** Domain of the service (e.g., 'light', 'switch') */
  domain: string;
  /** Service name (e.g., 'turn_on', 'turn_off') */
  service: string;
  /** Target entity ID(s) */
  entity_id: string | string[];
  /** Service call data/parameters */
  data?: Record<string, unknown>;
}

/**
 * Home Assistant configuration
 * Configuration for connecting to Home Assistant
 */
export interface HAConfig {
  /** Home Assistant server URL */
  url: string;
  /** Access token for authentication */
  access_token: string;
  /** Whether to use SSL */
  ssl?: boolean;
  /** Connection timeout in milliseconds */
  timeout?: number;
  /** Whether to verify SSL certificates */
  verify_ssl?: boolean;
}

/**
 * Home Assistant connection status
 */
export interface HAConnectionStatus {
  /** Whether connected to Home Assistant */
  connected: boolean;
  /** Connection error message if any */
  error?: string;
  /** Last successful connection time */
  last_connected?: string;
  /** Home Assistant version */
  version?: string;
}

/**
 * Home Assistant entity discovery
 * Results from discovering available entities
 */
export interface HAEntityDiscovery {
  /** List of discovered entities */
  entities: HADevice[];
  /** Total number of entities found */
  total: number;
  /** Entities by domain */
  by_domain: Record<string, HADevice[]>;
  /** Entities by area */
  by_area: Record<string, HADevice[]>;
  /** Discovery timestamp */
  discovered_at: string;
}

/**
 * Home Assistant WebSocket message
 * Messages received from Home Assistant WebSocket
 */
export interface HAWebSocketMessage {
  /** Message type */
  type: 'event' | 'result' | 'pong';
  /** Message ID */
  id?: number;
  /** Event data */
  event?: {
    event_type: string;
    data: unknown;
  };
  /** Result data */
  result?: unknown;
  /** Success flag */
  success?: boolean;
  /** Error information */
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Home Assistant automation
 * Automation configuration in Home Assistant
 */
export interface HAAutomation {
  /** Automation ID */
  id: string;
  /** Automation alias/name */
  alias: string;
  /** Automation description */
  description?: string;
  /** Automation trigger */
  trigger: unknown[];
  /** Automation condition */
  condition?: unknown[];
  /** Automation action */
  action: unknown[];
  /** Whether automation is enabled */
  enabled: boolean;
  /** Last triggered time */
  last_triggered?: string;
}

/**
 * Home Assistant scene
 * Scene configuration in Home Assistant
 */
export interface HAScene {
  /** Scene ID */
  id: string;
  /** Scene name */
  name: string;
  /** Scene entities and their states */
  entities: Record<string, unknown>;
  /** Scene icon */
  icon?: string;
} 