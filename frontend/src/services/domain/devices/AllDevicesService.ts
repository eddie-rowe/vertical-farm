import { BaseService } from "@/services/core/base/BaseService";
import { ErrorHandler } from "@/services/core/utils/errorHandler";

// Unified device interface for all integrations
export interface UnifiedDevice {
  // Core identification
  entity_id: string;
  friendly_name?: string;
  device_name?: string;

  // Device classification
  domain: string;
  device_class?: string;
  device_type?: string;

  // State and capabilities
  state: string;
  attributes?: Record<string, any>;
  unit_of_measurement?: string;
  supported_features?: number;

  // Integration source
  integration_type:
    | "home_assistant"
    | "smartthings"
    | "arduino"
    | "aws_iot"
    | "raspberry_pi";
  integration_name: string;

  // Timestamps
  last_updated?: string;
  last_changed?: string;

  // Assignment status
  is_assigned?: boolean;
  assignment_location?: string;

  // Connectivity
  is_online?: boolean;

  // UI metadata
  icon?: string;
  area?: string;
}

export interface AllDevicesFilter {
  integration_type?: string;
  device_type?: string;
  domain?: string;
  status?: "online" | "offline" | "unavailable" | "all";
  assignment_status?: "assigned" | "unassigned" | "all";
  search_term?: string;
}

export interface DeviceStats {
  total: number;
  online: number;
  offline: number;
  assigned: number;
  unassigned: number;
  by_integration: Record<string, number>;
  by_type: Record<string, number>;
}

export class AllDevicesService extends BaseService {
  private static instance: AllDevicesService;
  private homeAssistantService: any = null;

  private constructor() {
    super();
  }

  static getInstance(): AllDevicesService {
    if (!AllDevicesService.instance) {
      AllDevicesService.instance = new AllDevicesService();
    }
    return AllDevicesService.instance;
  }

  private async getHomeAssistantService() {
    if (!this.homeAssistantService) {
      const { default: homeAssistantService } = await import(
        "@/services/homeAssistantService"
      );
      this.homeAssistantService = homeAssistantService;
    }
    return this.homeAssistantService;
  }

  /**
   * Get all devices from all connected integrations
   */
  async getAllDevices(): Promise<UnifiedDevice[]> {
    this.logOperation("getAllDevices");

    return ErrorHandler.withErrorHandling(async () => {
      const allDevices: UnifiedDevice[] = [];

      // Get Home Assistant devices
      const haDevices = await this.getHomeAssistantDevices();
      allDevices.push(...haDevices);

      // Future integrations can be added here:
      // const smartThingsDevices = await this.getSmartThingsDevices();
      // allDevices.push(...smartThingsDevices);

      return allDevices;
    }, "Get all devices").catch(() => []);
  }

  /**
   * Get devices with filtering
   */
  async getFilteredDevices(
    filters: AllDevicesFilter = {},
  ): Promise<UnifiedDevice[]> {
    this.logOperation("getFilteredDevices", filters);

    return ErrorHandler.withErrorHandling(async () => {
      let devices = await this.getAllDevices();

      // Apply filters
      if (filters.integration_type && filters.integration_type !== "all") {
        devices = devices.filter(
          (device) => device.integration_type === filters.integration_type,
        );
      }

      if (filters.device_type && filters.device_type !== "all") {
        devices = devices.filter(
          (device) =>
            device.domain === filters.device_type ||
            device.device_class === filters.device_type,
        );
      }

      if (filters.status && filters.status !== "all") {
        devices = devices.filter((device) => {
          switch (filters.status) {
            case "online":
              return (
                device.is_online !== false && device.state !== "unavailable"
              );
            case "offline":
              return device.is_online === false || device.state === "offline";
            case "unavailable":
              return device.state === "unavailable";
            default:
              return true;
          }
        });
      }

      if (filters.assignment_status && filters.assignment_status !== "all") {
        devices = devices.filter((device) => {
          switch (filters.assignment_status) {
            case "assigned":
              return device.is_assigned === true;
            case "unassigned":
              return device.is_assigned !== true;
            default:
              return true;
          }
        });
      }

      if (filters.search_term) {
        const searchLower = filters.search_term.toLowerCase();
        devices = devices.filter(
          (device) =>
            device.friendly_name?.toLowerCase().includes(searchLower) ||
            device.device_name?.toLowerCase().includes(searchLower) ||
            device.entity_id.toLowerCase().includes(searchLower) ||
            device.domain.toLowerCase().includes(searchLower) ||
            device.area?.toLowerCase().includes(searchLower),
        );
      }

      return devices;
    }, "Filter devices").catch(() => []);
  }

  /**
   * Get device statistics
   */
  async getDeviceStats(): Promise<DeviceStats> {
    this.logOperation("getDeviceStats");

    return ErrorHandler.withErrorHandling(async () => {
      const devices = await this.getAllDevices();

      const stats: DeviceStats = {
        total: devices.length,
        online: 0,
        offline: 0,
        assigned: 0,
        unassigned: 0,
        by_integration: {},
        by_type: {},
      };

      devices.forEach((device) => {
        // Count online/offline
        if (device.is_online !== false && device.state !== "unavailable") {
          stats.online++;
        } else {
          stats.offline++;
        }

        // Count assigned/unassigned
        if (device.is_assigned) {
          stats.assigned++;
        } else {
          stats.unassigned++;
        }

        // Count by integration
        const integrationName = device.integration_name;
        stats.by_integration[integrationName] =
          (stats.by_integration[integrationName] || 0) + 1;

        // Count by type
        const deviceType = device.domain || device.device_type || "unknown";
        stats.by_type[deviceType] = (stats.by_type[deviceType] || 0) + 1;
      });

      return stats;
    }, "Get device stats").catch(() => ({
      total: 0,
      online: 0,
      offline: 0,
      assigned: 0,
      unassigned: 0,
      by_integration: {},
      by_type: {},
    }));
  }

  /**
   * Control a device (delegates to appropriate integration service)
   */
  async controlDevice(
    device: UnifiedDevice,
    action: "turn_on" | "turn_off" | "toggle",
  ): Promise<void> {
    this.logOperation("controlDevice", { entity_id: device.entity_id, action });

    return ErrorHandler.withErrorHandling(async () => {
      switch (device.integration_type) {
        case "home_assistant":
          const haService = await this.getHomeAssistantService();
          await haService.controlDevice(device.entity_id, action);
          break;

        // Future integrations:
        // case 'smartthings':
        //   const stService = await this.getSmartThingsService();
        //   await stService.controlDevice(device.entity_id, action);
        //   break;

        default:
          throw new Error(
            `Device control not supported for integration: ${device.integration_type}`,
          );
      }
    }, `Control device ${device.entity_id}`);
  }

  /**
   * Import a device (delegates to appropriate integration service)
   */
  async importDevice(device: UnifiedDevice): Promise<void> {
    this.logOperation("importDevice", { entity_id: device.entity_id });

    return ErrorHandler.withErrorHandling(async () => {
      switch (device.integration_type) {
        case "home_assistant":
          const haService = await this.getHomeAssistantService();
          // Convert to Home Assistant device format
          const haDevice = {
            entity_id: device.entity_id,
            friendly_name: device.friendly_name,
            state: device.state,
            domain: device.domain,
            device_class: device.device_class,
            attributes: device.attributes || {},
          };
          await haService.importDevices({ devices: [haDevice] });
          break;

        default:
          throw new Error(
            `Device import not supported for integration: ${device.integration_type}`,
          );
      }
    }, `Import device ${device.entity_id}`);
  }

  /**
   * Get Home Assistant devices in unified format
   */
  private async getHomeAssistantDevices(): Promise<UnifiedDevice[]> {
    try {
      const haService = await this.getHomeAssistantService();
      const haDevices = await haService.getDevices();
      const assignmentService = (
        await import("@/services/domain/devices/DeviceAssignmentService")
      ).default;
      const assignedEntityIds = await this.getAssignedEntityIds();

      return haDevices.map((device: any) => ({
        entity_id: device.entity_id,
        friendly_name: device.friendly_name,
        device_name: device.friendly_name,
        domain: device.domain,
        device_class: device.device_class,
        device_type: device.domain,
        state: device.state,
        attributes: device.attributes,
        unit_of_measurement: device.unit_of_measurement,
        supported_features: device.supported_features,
        integration_type: "home_assistant" as const,
        integration_name: "Home Assistant",
        last_updated: device.last_updated,
        last_changed: device.last_changed,
        is_assigned: assignedEntityIds.includes(device.entity_id),
        is_online: device.state !== "unavailable" && device.state !== "unknown",
        icon: device.icon,
        area: device.area,
      }));
    } catch (error) {
      // Warning logged
      return [];
    }
  }

  /**
   * Get assigned entity IDs from the database
   */
  private async getAssignedEntityIds(): Promise<string[]> {
    try {
      const supabase = await this.getSupabaseClient();
      const { data: user } = await supabase.auth.getUser();

      if (!user?.user) {
        return [];
      }

      const { data, error } = await supabase
        .from("device_assignments")
        .select("entity_id")
        .eq("user_id", user.user.id);

      if (error) {
        // Warning logged
        return [];
      }

      return data?.map((item) => item.entity_id) || [];
    } catch (error) {
      // Warning logged
      return [];
    }
  }

  /**
   * Bulk import devices
   */
  async bulkImportDevices(devices: UnifiedDevice[]): Promise<void> {
    this.logOperation("bulkImportDevices", { count: devices.length });

    return ErrorHandler.withErrorHandling(async () => {
      // Group devices by integration type
      const devicesByIntegration = devices.reduce(
        (acc, device) => {
          if (!acc[device.integration_type]) {
            acc[device.integration_type] = [];
          }
          acc[device.integration_type].push(device);
          return acc;
        },
        {} as Record<string, UnifiedDevice[]>,
      );

      // Import devices for each integration
      for (const [integrationType, integrationDevices] of Object.entries(
        devicesByIntegration,
      )) {
        switch (integrationType) {
          case "home_assistant":
            const haService = await this.getHomeAssistantService();
            const haDevices = integrationDevices.map((device) => ({
              entity_id: device.entity_id,
              friendly_name: device.friendly_name,
              state: device.state,
              domain: device.domain,
              device_class: device.device_class,
              attributes: device.attributes || {},
            }));
            await haService.importDevices({ devices: haDevices });
            break;

          default:
            // Bulk import not supported for this integration
        }
      }
    }, "Bulk import devices");
  }

  /**
   * Bulk control devices
   */
  async bulkControlDevices(
    devices: UnifiedDevice[],
    action: "turn_on" | "turn_off",
  ): Promise<void> {
    this.logOperation("bulkControlDevices", { count: devices.length, action });

    return ErrorHandler.withErrorHandling(async () => {
      // Group devices by integration type
      const devicesByIntegration = devices.reduce(
        (acc, device) => {
          if (!acc[device.integration_type]) {
            acc[device.integration_type] = [];
          }
          acc[device.integration_type].push(device);
          return acc;
        },
        {} as Record<string, UnifiedDevice[]>,
      );

      // Control devices for each integration
      const promises = [];
      for (const [integrationType, integrationDevices] of Object.entries(
        devicesByIntegration,
      )) {
        switch (integrationType) {
          case "home_assistant":
            const haService = await this.getHomeAssistantService();
            for (const device of integrationDevices) {
              promises.push(haService.controlDevice(device.entity_id, action));
            }
            break;

          default:
            // Bulk control not supported for this integration
        }
      }

      await Promise.all(promises);
    }, "Bulk control devices");
  }
}
