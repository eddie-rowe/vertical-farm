import { BaseService } from "@/services/core/base/BaseService";

export interface BusinessMetrics {
  totalRevenue: number;
  totalCustomers: number;
  totalOrders: number;
  averageOrderValue: number;
  totalRefunds: number;
  totalDisputes: number;
  totalPayouts: number;
  revenueGrowth: number;
  customerGrowth: number;
  orderGrowth: number;
}

export interface RevenueTimeSeriesData {
  date: string;
  revenue: number;
  orders: number;
  avgOrderValue: number;
}

export interface RecentOrder {
  id: string;
  customerName: string;
  productName: string;
  amount: number;
  status: string;
  createdAt: string;
}

export interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
}

// Define proper database record interfaces
interface SquarePaymentRecord {
  amount: number;
  status: string;
  created_at_square: string;
}

interface SquareOrderRecord {
  square_order_id: string;
  total_amount: number;
  currency: string;
  state: string;
  customer_id: string;
  line_items: any[];
  created_at_square: string;
}

interface SquareCustomerRecord {
  square_customer_id: string;
  given_name: string;
  family_name: string;
  email_address: string;
  phone_number?: string;
}

class BusinessDataService extends BaseService {
  private static instance: BusinessDataService;

  static getInstance(): BusinessDataService {
    if (!BusinessDataService.instance) {
      BusinessDataService.instance = new BusinessDataService();
    }
    return BusinessDataService.instance;
  }

  private constructor() {
    super();
  }

  // =====================================================
  // AGGREGATED METRICS
  // =====================================================

  async getBusinessMetrics(): Promise<BusinessMetrics> {
    this.logOperation("getBusinessMetrics");
    
    return this.executeWithAuth(async () => {
      const [
        revenueData,
        customerCount,
        orderCount,
        refundData,
        disputeData,
        payoutData,
      ] = await Promise.all([
        this.getTotalRevenue(),
        this.getTotalCustomers(),
        this.getTotalOrders(),
        this.getTotalRefunds(),
        this.getTotalDisputes(),
        this.getTotalPayouts(),
      ]);

      const averageOrderValue = orderCount > 0 ? revenueData.total / orderCount : 0;

      return {
        totalRevenue: revenueData.total,
        totalCustomers: customerCount,
        totalOrders: orderCount,
        averageOrderValue,
        totalRefunds: refundData.total,
        totalDisputes: disputeData.total,
        totalPayouts: payoutData.total,
        revenueGrowth: revenueData.growth,
        customerGrowth: 0, // TODO: Calculate growth
        orderGrowth: 0, // TODO: Calculate growth
      };
    }, "Get business metrics");
  }

  private async getTotalRevenue(): Promise<{ total: number; growth: number }> {
    this.logOperation("getTotalRevenue");
    
    try {
      const payments = await this.executeQuery(async () => {
        return await this.getSupabaseClient()
          .from("square_cache_payments")
          .select("amount, status, created_at_square")
          .eq("status", "COMPLETED");
      }, "Get total revenue from payments");

      const total = (payments || []).reduce((sum: number, payment: SquarePaymentRecord) => {
        return sum + (payment.amount || 0);
      }, 0);

      // Convert from cents to dollars
      const totalDollars = total / 100;

      return {
        total: totalDollars,
        growth: 0, // TODO: Calculate growth vs previous period
      };
    } catch (error) {
      console.error("Failed to get total revenue:", error);
      return { total: 0, growth: 0 };
    }
  }

  private async getTotalCustomers(): Promise<number> {
    this.logOperation("getTotalCustomers");
    
    try {
      return await this.executeQuery(async () => {
        const { count, error } = await this.getSupabaseClient()
          .from("square_cache_customers")
          .select("*", { count: "exact", head: true });

        return { data: count || 0, error };
      }, "Get total customer count");
    } catch (error) {
      console.error("Failed to get total customers:", error);
      return 0;
    }
  }

  private async getTotalOrders(): Promise<number> {
    this.logOperation("getTotalOrders");
    
    try {
      return await this.executeQuery(async () => {
        const { count, error } = await this.getSupabaseClient()
          .from("square_cache_orders")
          .select("*", { count: "exact", head: true })
          .in("state", ["COMPLETED", "OPEN"]);

        return { data: count || 0, error };
      }, "Get total order count");
    } catch (error) {
      console.error("Failed to get total orders:", error);
      return 0;
    }
  }

  private async getTotalRefunds(): Promise<{ total: number }> {
    this.logOperation("getTotalRefunds");
    
    try {
      const refunds = await this.executeQuery(async () => {
        return await this.getSupabaseClient()
          .from("square_cache_refunds")
          .select("amount")
          .eq("status", "COMPLETED");
      }, "Get total refunds");

      const total = (refunds || []).reduce((sum: number, refund: { amount: number }) => {
        return sum + (refund.amount || 0);
      }, 0);

      return { total: total / 100 }; // Convert from cents to dollars
    } catch (error) {
      console.error("Failed to get total refunds:", error);
      return { total: 0 };
    }
  }

  private async getTotalDisputes(): Promise<{ total: number }> {
    this.logOperation("getTotalDisputes");
    
    try {
      const disputes = await this.executeQuery(async () => {
        return await this.getSupabaseClient()
          .from("square_cache_disputes")
          .select("amount");
      }, "Get total disputes");

      const total = (disputes || []).reduce((sum: number, dispute: { amount: number }) => {
        return sum + (dispute.amount || 0);
      }, 0);

      return { total: total / 100 }; // Convert from cents to dollars
    } catch (error) {
      console.error("Failed to get total disputes:", error);
      return { total: 0 };
    }
  }

  private async getTotalPayouts(): Promise<{ total: number }> {
    this.logOperation("getTotalPayouts");
    
    try {
      const payouts = await this.executeQuery(async () => {
        return await this.getSupabaseClient()
          .from("square_cache_payouts")
          .select("amount")
          .eq("status", "SENT");
      }, "Get total payouts");

      const total = (payouts || []).reduce((sum: number, payout: { amount: number }) => {
        return sum + (payout.amount || 0);
      }, 0);

      return { total: total / 100 }; // Convert from cents to dollars
    } catch (error) {
      console.error("Failed to get total payouts:", error);
      return { total: 0 };
    }
  }

  // =====================================================
  // TIME SERIES DATA
  // =====================================================

  async getRevenueTimeSeries(days: number = 30): Promise<RevenueTimeSeriesData[]> {
    this.logOperation("getRevenueTimeSeries", { days });
    
    return this.executeWithAuth(async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const payments = await this.executeQuery(async () => {
        return await this.getSupabaseClient()
          .from("square_cache_payments")
          .select("amount, created_at_square")
          .eq("status", "COMPLETED")
          .gte("created_at_square", startDate.toISOString())
          .order("created_at_square", { ascending: true });
      }, "Get revenue time series data");

      // Group payments by date
      const dailyData = new Map<string, { revenue: number; orders: number }>();

      (payments || []).forEach((payment: { amount: number; created_at_square: string }) => {
        if (payment.created_at_square) {
          const date = new Date(payment.created_at_square).toISOString().split("T")[0];
          const existing = dailyData.get(date) || { revenue: 0, orders: 0 };
          dailyData.set(date, {
            revenue: existing.revenue + (payment.amount || 0) / 100,
            orders: existing.orders + 1,
          });
        }
      });

      // Convert to array and calculate average order value
      return Array.from(dailyData.entries()).map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders,
        avgOrderValue: data.orders > 0 ? data.revenue / data.orders : 0,
      }));
    }, "Get revenue time series");
  }

  // =====================================================
  // RECENT DATA
  // =====================================================

  async getRecentOrders(limit: number = 10): Promise<RecentOrder[]> {
    this.logOperation("getRecentOrders", { limit });
    
    return this.executeWithAuth(async () => {
      const orders = await this.executeQuery(async () => {
        return await this.getSupabaseClient()
          .from("square_cache_orders")
          .select(`
            square_order_id,
            total_amount,
            currency,
            state,
            customer_id,
            line_items,
            created_at_square
          `)
          .order("created_at_square", { ascending: false })
          .limit(limit);
      }, "Get recent orders");

      return (orders || []).map((order: SquareOrderRecord) => {
        // Extract product name from line items (simplified)
        const firstLineItem = Array.isArray(order.line_items) && order.line_items.length > 0
          ? order.line_items[0]
          : null;
        
        const productName = firstLineItem?.name || "Unknown Product";
        const customerName = `Customer ${order.customer_id?.slice(-4) || "Unknown"}`;

        return {
          id: order.square_order_id,
          customerName,
          productName,
          amount: (order.total_amount || 0) / 100, // Convert from cents
          status: order.state || "Unknown",
          createdAt: order.created_at_square || "",
        };
      });
    }, "Get recent orders");
  }

  // =====================================================
  // CUSTOMER DATA
  // =====================================================

  async getCustomers(limit: number = 50): Promise<CustomerData[]> {
    this.logOperation("getCustomers", { limit });
    
    return this.executeWithAuth(async () => {
      // Use a single query with aggregation to avoid N+1 problem
      const customersWithStats = await this.executeQuery(async () => {
        return await this.getSupabaseClient()
          .from("square_cache_customers")
          .select(`
            square_customer_id,
            given_name,
            family_name,
            email_address,
            phone_number,
            orders:square_cache_orders(
              total_amount,
              created_at_square
            )
          `)
          .order("given_name", { ascending: true })
          .limit(limit);
      }, "Get customers with order data");

      return (customersWithStats || []).map((customer: any) => {
        const orders = customer.orders || [];
        const totalOrders = orders.length;
        const totalSpent = orders.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0);
        const lastOrderDate = orders.length > 0 
          ? orders.sort((a: any, b: any) => new Date(b.created_at_square || "").getTime() - new Date(a.created_at_square || "").getTime())[0]?.created_at_square
          : undefined;

        return {
          id: customer.square_customer_id,
          name: [customer.given_name, customer.family_name].filter(Boolean).join(" ") || "Unknown",
          email: customer.email_address || "",
          phone: customer.phone_number || undefined,
          totalOrders,
          totalSpent: totalSpent / 100, // Convert from cents
          lastOrderDate,
        };
      });
    }, "Get customers");
  }

  // =====================================================
  // CACHE STATUS
  // =====================================================

  async getCacheStatus(): Promise<{
    lastSyncAt: string | null;
    isStale: boolean;
    tables: Record<string, { count: number; lastUpdated: string | null }>;
  }> {
    try {
      const tables = [
        "square_cache_customers",
        "square_cache_orders", 
        "square_cache_payments",
        "square_cache_products",
        "square_cache_refunds",
        "square_cache_disputes",
        "square_cache_payouts",
        "square_cache_team_members",
      ];

      const tableStats: Record<string, { count: number; lastUpdated: string | null }> = {};

      for (const table of tables) {
        try {
          const { count, error: countError } = await this.getSupabaseClient()
            .from(table)
            .select("*", { count: "exact", head: true });

          if (countError) throw countError;

          const { data: lastRecord, error: recordError } = await this.getSupabaseClient()
            .from(table)
            .select("updated_at")
            .order("updated_at", { ascending: false })
            .limit(1)
            .single();

          tableStats[table] = {
            count: count || 0,
            lastUpdated: lastRecord?.updated_at || null,
          };
        } catch (tableError) {
          console.warn(`Failed to get stats for ${table}:`, tableError);
          tableStats[table] = { count: 0, lastUpdated: null };
        }
      }

      // Find the most recent update across all tables
      const lastSyncAt = Object.values(tableStats)
        .map(stat => stat.lastUpdated)
        .filter(Boolean)
        .sort()
        .pop() || null;

      // Consider cache stale if older than 1 hour
      const isStale = lastSyncAt 
        ? new Date().getTime() - new Date(lastSyncAt).getTime() > 60 * 60 * 1000
        : true;

      return {
        lastSyncAt,
        isStale,
        tables: tableStats,
      };
    } catch (error) {
      console.error("Failed to get cache status:", error);
      return {
        lastSyncAt: null,
        isStale: true,
        tables: {},
      };
    }
  }
}

export const businessDataService = BusinessDataService.getInstance();