import request from "@/lib/apiClient";

// Re-export all types from canonical location for consumers
export type {
  SquareMoney,
  SquareConfig,
  SquareConfigCreate,
  SquareConfigUpdate,
  SquareConnectionStatus,
  SquareLocation,
  SquareProduct,
  SquareProductVariation,
  SquareCustomer,
  SquareOrder,
  SquareOrderLineItem,
  SquarePayment,
  SquarePaymentCardDetails,
  SquareRefund,
  SquareDispute,
  SquareSubscription,
  SquareInvoice,
  SquareTeamMember,
  SquareLabor,
  SquarePayout,
  SquareInventoryCount,
  SquareInventoryChange,
  SquareMerchant,
  SquareWebhook,
} from "@/types/integrations/square";

// Import types for internal use
import type {
  SquareConfig,
  SquareConfigCreate,
  SquareConfigUpdate,
  SquareConnectionStatus,
  SquareLocation,
  SquareProduct,
  SquareCustomer,
  SquareOrder,
  SquarePayment,
  SquareRefund,
  SquareDispute,
  SquareSubscription,
  SquareInvoice,
  SquareTeamMember,
  SquareLabor,
  SquareMerchant,
  SquarePayout,
  SquareInventoryCount,
} from "@/types/integrations/square";

class SquareService {
  private baseUrl = "/api/v1/square";

  // Configuration Management
  async getConfigs(): Promise<SquareConfig[]> {
    try {
      return await request<SquareConfig[]>(`${this.baseUrl}/configs`);
    } catch (error) {
      // Error logged
      return [];
    }
  }

  async getConfig(configId: string): Promise<SquareConfig | null> {
    try {
      return await request<SquareConfig>(`${this.baseUrl}/configs/${configId}`);
    } catch (error) {
      // Error logged
      return null;
    }
  }

  async createConfig(config: SquareConfigCreate): Promise<SquareConfig> {
    return await request<SquareConfig>(`${this.baseUrl}/configs`, {
      method: "POST",
      body: JSON.stringify(config),
    });
  }

  async updateConfig(
    configId: string,
    config: SquareConfigUpdate,
  ): Promise<SquareConfig> {
    return await request<SquareConfig>(`${this.baseUrl}/configs/${configId}`, {
      method: "PUT",
      body: JSON.stringify(config),
    });
  }

  async deleteConfig(configId: string): Promise<void> {
    await request<void>(`${this.baseUrl}/configs/${configId}`, {
      method: "DELETE",
    });
  }

  // Connection Testing
  async testConnection(configId: string): Promise<SquareConnectionStatus> {
    return await request<SquareConnectionStatus>(
      `${this.baseUrl}/test-connection?config_id=${configId}`,
      {
        method: "POST",
      },
    );
  }

  // Square Data Fetching (requires configId)
  async getLocations(configId: string): Promise<SquareLocation[]> {
    try {
      return await request<SquareLocation[]>(
        `${this.baseUrl}/locations?config_id=${configId}`,
      );
    } catch (error) {
      // Error logged
      return [];
    }
  }

  async getProducts(configId: string): Promise<SquareProduct[]> {
    try {
      return await request<SquareProduct[]>(
        `${this.baseUrl}/products?config_id=${configId}`,
      );
    } catch (error) {
      // Error logged
      return [];
    }
  }

  async getCustomers(configId: string): Promise<SquareCustomer[]> {
    try {
      return await request<SquareCustomer[]>(
        `${this.baseUrl}/customers?config_id=${configId}`,
      );
    } catch (error) {
      // Error logged
      return [];
    }
  }

  async getOrders(
    configId: string,
    locationId?: string,
  ): Promise<SquareOrder[]> {
    try {
      const params = new URLSearchParams({ config_id: configId });
      if (locationId) params.append("location_id", locationId);

      return await request<SquareOrder[]>(
        `${this.baseUrl}/orders?${params.toString()}`,
      );
    } catch (error) {
      // Error logged
      return [];
    }
  }

  async getPayments(
    configId: string,
    locationId?: string,
  ): Promise<SquarePayment[]> {
    try {
      const params = new URLSearchParams({ config_id: configId });
      if (locationId) params.append("location_id", locationId);

      return await request<SquarePayment[]>(
        `${this.baseUrl}/payments?${params.toString()}`,
      );
    } catch (error) {
      // Error logged
      return [];
    }
  }

  // New methods for additional Square endpoints
  async getRefunds(
    configId: string,
    locationId?: string,
  ): Promise<SquareRefund[]> {
    try {
      const params = new URLSearchParams({ config_id: configId });
      if (locationId) params.append("location_id", locationId);

      return await request<SquareRefund[]>(
        `${this.baseUrl}/refunds?${params.toString()}`,
      );
    } catch (error) {
      // Error logged
      return [];
    }
  }

  async getDisputes(configId: string): Promise<SquareDispute[]> {
    try {
      return await request<SquareDispute[]>(
        `${this.baseUrl}/disputes?config_id=${configId}`,
      );
    } catch (error) {
      // Error logged
      return [];
    }
  }

  async getSubscriptions(
    configId: string,
    locationId?: string,
  ): Promise<SquareSubscription[]> {
    try {
      const params = new URLSearchParams({ config_id: configId });
      if (locationId) params.append("location_id", locationId);

      return await request<SquareSubscription[]>(
        `${this.baseUrl}/subscriptions?${params.toString()}`,
      );
    } catch (error) {
      // Error logged
      return [];
    }
  }

  async getInvoices(
    configId: string,
    locationId?: string,
  ): Promise<SquareInvoice[]> {
    try {
      const params = new URLSearchParams({ config_id: configId });
      if (locationId) params.append("location_id", locationId);

      return await request<SquareInvoice[]>(
        `${this.baseUrl}/invoices?${params.toString()}`,
      );
    } catch (error) {
      // Error logged
      return [];
    }
  }

  async getTeamMembers(
    configId: string,
    locationId?: string,
  ): Promise<SquareTeamMember[]> {
    try {
      const params = new URLSearchParams({ config_id: configId });
      if (locationId) params.append("location_id", locationId);

      return await request<SquareTeamMember[]>(
        `${this.baseUrl}/team-members?${params.toString()}`,
      );
    } catch (error) {
      // Error logged
      return [];
    }
  }

  async getLabor(
    configId: string,
    locationId?: string,
  ): Promise<SquareLabor[]> {
    try {
      const params = new URLSearchParams({ config_id: configId });
      if (locationId) params.append("location_id", locationId);

      return await request<SquareLabor[]>(
        `${this.baseUrl}/labor?${params.toString()}`,
      );
    } catch (error) {
      // Error logged
      return [];
    }
  }

  async getMerchants(configId: string): Promise<SquareMerchant[]> {
    try {
      return await request<SquareMerchant[]>(
        `${this.baseUrl}/merchants?config_id=${configId}`,
      );
    } catch (error) {
      // Error logged
      return [];
    }
  }

  async getPayouts(
    configId: string,
    locationId?: string,
  ): Promise<SquarePayout[]> {
    try {
      const params = new URLSearchParams({ config_id: configId });
      if (locationId) params.append("location_id", locationId);

      return await request<SquarePayout[]>(
        `${this.baseUrl}/payouts?${params.toString()}`,
      );
    } catch (error) {
      // Error logged
      return [];
    }
  }

  async getInventory(
    configId: string,
    locationId?: string,
  ): Promise<SquareInventoryCount[]> {
    try {
      const params = new URLSearchParams({ config_id: configId });
      if (locationId) params.append("location_id", locationId);

      return await request<SquareInventoryCount[]>(
        `${this.baseUrl}/inventory?${params.toString()}`,
      );
    } catch (error) {
      // Error logged
      return [];
    }
  }

  async getStatus(configId?: string): Promise<SquareConnectionStatus> {
    try {
      const params = configId ? `?config_id=${configId}` : "";
      return await request<SquareConnectionStatus>(
        `${this.baseUrl}/status${params}`,
      );
    } catch (error) {
      // Error logged
      return {
        connected: false,
        environment: "sandbox",
        error_message: "Connection failed",
      };
    }
  }

  async getActiveConfig(): Promise<SquareConfig | null> {
    try {
      const configs = await this.getConfigs();
      return configs.find((config) => config.is_active) || null;
    } catch (error) {
      // Error logged
      return null;
    }
  }

  async setActiveConfig(configId: string): Promise<SquareConfig> {
    try {
      const response = await request<SquareConfig>(
        `${this.baseUrl}/configs/${configId}/activate`,
        {
          method: "PUT",
        },
      );
      return response;
    } catch (error) {
      // Error logged
      throw error;
    }
  }

  // =====================================================
  // CACHE SYNC METHODS
  // =====================================================

  async syncAllData(configId?: string): Promise<void> {
    const config = configId 
      ? await this.getConfig(configId)
      : await this.getActiveConfig();
    
    if (!config?.id) {
      throw new Error("No active Square configuration found");
    }

    // Sync all data types in parallel for better performance
    await Promise.all([
      this.syncCustomers(config.id),
      this.syncOrders(config.id),
      this.syncPayments(config.id),
      this.syncProducts(config.id),
      this.syncRefunds(config.id),
      this.syncDisputes(config.id),
      this.syncPayouts(config.id),
      this.syncTeamMembers(config.id),
    ]);
  }

  async syncCustomers(configId: string): Promise<void> {
    try {
      await request(`${this.baseUrl}/sync/customers/${configId}`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to sync Square customers:", error);
      throw error;
    }
  }

  async syncOrders(configId: string): Promise<void> {
    try {
      await request(`${this.baseUrl}/sync/orders/${configId}`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to sync Square orders:", error);
      throw error;
    }
  }

  async syncPayments(configId: string): Promise<void> {
    try {
      await request(`${this.baseUrl}/sync/payments/${configId}`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to sync Square payments:", error);
      throw error;
    }
  }

  async syncProducts(configId: string): Promise<void> {
    try {
      await request(`${this.baseUrl}/sync/products/${configId}`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to sync Square products:", error);
      throw error;
    }
  }

  async syncRefunds(configId: string): Promise<void> {
    try {
      await request(`${this.baseUrl}/sync/refunds/${configId}`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to sync Square refunds:", error);
      throw error;
    }
  }

  async syncDisputes(configId: string): Promise<void> {
    try {
      await request(`${this.baseUrl}/sync/disputes/${configId}`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to sync Square disputes:", error);
      throw error;
    }
  }

  async syncPayouts(configId: string): Promise<void> {
    try {
      await request(`${this.baseUrl}/sync/payouts/${configId}`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to sync Square payouts:", error);
      throw error;
    }
  }

  async syncTeamMembers(configId: string): Promise<void> {
    try {
      await request(`${this.baseUrl}/sync/team-members/${configId}`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to sync Square team members:", error);
      throw error;
    }
  }

  async getSyncStatus(configId?: string): Promise<{
    last_sync_at: string | null;
    sync_status: string;
    sync_error?: string;
  }> {
    const config = configId 
      ? await this.getConfig(configId)
      : await this.getActiveConfig();
    
    if (!config?.id) {
      throw new Error("No Square configuration found");
    }

    try {
      return await request(`${this.baseUrl}/sync/status/${config.id}`);
    } catch (error) {
      console.error("Failed to get sync status:", error);
      throw error;
    }
  }
}

export const squareService = new SquareService();
