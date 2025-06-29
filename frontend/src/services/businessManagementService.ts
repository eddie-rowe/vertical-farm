import { squareService } from './squareService';

// Types for transformed business data
export interface BusinessCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  type: string;
  status: string;
  totalOrders: number;
  totalSpent: number;
  lastOrder?: string;
  preferredProducts: string[];
  notes?: string;
}

export interface BusinessOrder {
  id: string;
  invoiceId?: string;
  customer: string;
  date: string;
  dueDate?: string;
  status: string;
  paymentStatus: string;
  amount: number;
  items: Array<{
    product: string;
    quantity: number;
    unit: string;
    price: number;
  }>;
  squareOrderId?: string;
  createdAt: string;
}

export interface BusinessPayment {
  id: string;
  invoiceId?: string;
  orderId?: string;
  customer: string;
  amount: number;
  method: string;
  status: string;
  date: string;
  squarePaymentId: string;
  processingFee?: number;
  netAmount?: number;
  cardType?: string;
  lastFour?: string;
  failureReason?: string;
  refundAmount?: number;
  hasRefunds?: boolean;
}

export interface BusinessInventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unit: string;
  cost: number;
  price: number;
  category: string;
  location: string;
  status: string;
  lastUpdated: string;
}

// New business data types for additional Square endpoints
export interface BusinessRefund {
  id: string;
  paymentId: string;
  orderId?: string;
  customer: string;
  amount: number;
  reason: string;
  status: string;
  date: string;
  squareRefundId: string;
}

export interface BusinessDispute {
  id: string;
  amount: number;
  reason: string;
  status: string;
  dueDate?: string;
  paymentId: string;
  customer: string;
  cardBrand?: string;
  createdAt: string;
}

export interface BusinessSubscription {
  id: string;
  customer: string;
  planName: string;
  status: string;
  startDate: string;
  amount?: number;
  frequency: string;
  location: string;
}

export interface BusinessInvoice {
  id: string;
  invoiceNumber?: string;
  customer: string;
  title?: string;
  description?: string;
  amount: number;
  status: string;
  dueDate?: string;
  createdAt: string;
  paymentMethods: string[];
}

export interface BusinessTeamMember {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  status: string;
  locations: string[];
  isOwner: boolean;
  joinedAt: string;
}

export interface BusinessLaborEntry {
  id: string;
  employeeName: string;
  location: string;
  startTime: string;
  endTime?: string;
  duration?: string;
  hourlyRate?: number;
  totalPay?: number;
  status: string;
  breaks: number;
}

export interface BusinessPayout {
  id: string;
  amount: number;
  status: string;
  location: string;
  date: string;
  destination: string;
  fees?: number;
  arrivalDate?: string;
  type?: string;
}

class BusinessManagementService {
  private async getActiveSquareConfig() {
    try {
      const activeConfig = await squareService.getActiveConfig();
      if (!activeConfig?.id) {
        throw new Error('No active Square configuration found');
      }
      return activeConfig;
    } catch (error) {
      console.error('Failed to get active Square config:', error);
      throw new Error('Square integration not configured');
    }
  }

  async getCustomers(limit: number = 20): Promise<BusinessCustomer[]> {
    try {
      const config = await this.getActiveSquareConfig();
      const [squareCustomers, orders, payments] = await Promise.all([
        squareService.getCustomers(config.id!),
        squareService.getOrders(config.id!),
        squareService.getPayments(config.id!)
      ]);
      
      // Create customer maps for calculating totals
      const customerOrderCounts = new Map<string, number>();
      const customerSpending = new Map<string, number>();
      const customerLastOrders = new Map<string, string>();
      
      // Calculate customer metrics from orders and payments
      orders.forEach(order => {
        const customerId = order.location_id; // Placeholder - Square orders don't always have customer_id
        const amount = order.total_money?.amount || 0;
        
        customerOrderCounts.set(customerId, (customerOrderCounts.get(customerId) || 0) + 1);
        customerSpending.set(customerId, (customerSpending.get(customerId) || 0) + amount / 100);
        
        if (order.created_at) {
          customerLastOrders.set(customerId, order.created_at);
        }
      });
      
      // Transform Square customers to business customer format
      return squareCustomers.slice(0, limit).map(customer => ({
        id: customer.id,
        name: customer.company_name || `${customer.given_name || ''} ${customer.family_name || ''}`.trim() || 'Unknown Customer',
        email: customer.email_address,
        phone: customer.phone_number,
        address: '', // Square customers don't have address in basic API
        type: customer.company_name ? 'Business' : 'Individual',
        status: 'Active', // Square doesn't have customer status
        totalOrders: customerOrderCounts.get(customer.id) || 0,
        totalSpent: customerSpending.get(customer.id) || 0,
        lastOrder: customerLastOrders.get(customer.id) ? new Date(customerLastOrders.get(customer.id)!).toISOString().split('T')[0] : undefined,
        preferredProducts: [], // Would need to derive from order history
        notes: ''
      }));
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      return [];
    }
  }

  async getOrders(limit: number = 15): Promise<BusinessOrder[]> {
    try {
      const config = await this.getActiveSquareConfig();
      const [squareOrders, invoices, payments] = await Promise.all([
        squareService.getOrders(config.id!),
        squareService.getInvoices(config.id!),
        squareService.getPayments(config.id!)
      ]);
      
      // Create maps for enhanced data
      const customers = await squareService.getCustomers(config.id!);
      const customerMap = new Map(customers.map(c => [c.id, c]));
      const invoiceMap = new Map(invoices.map(i => [i.order_id, i]));
      const paymentMap = new Map(payments.map(p => [p.order_id, p]));
      
      return squareOrders.slice(0, limit).map(order => {
        const invoice = invoiceMap.get(order.id);
        const payment = paymentMap.get(order.id);
        
        return {
          id: `ORD-${order.id.slice(-6)}`,
          invoiceId: invoice?.invoice_number || invoice?.id,
          customer: this.getCustomerName(order, customerMap),
          date: order.created_at ? new Date(order.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          dueDate: invoice?.scheduled_at ? new Date(invoice.scheduled_at).toISOString().split('T')[0] : undefined,
          status: this.mapOrderStatus(order.state),
          paymentStatus: payment ? this.mapPaymentStatus(payment.status) : 'Pending',
          amount: this.getOrderTotal(order),
          items: this.mapOrderItems(order.line_items || []),
          squareOrderId: order.id,
          createdAt: order.created_at ? new Date(order.created_at).toISOString() : new Date().toISOString()
        };
      });
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      return [];
    }
  }

  async getPayments(limit: number = 50): Promise<BusinessPayment[]> {
    try {
      const config = await this.getActiveSquareConfig();
      const [squarePayments, refunds, orders] = await Promise.all([
        squareService.getPayments(config.id!),
        squareService.getRefunds(config.id!),
        squareService.getOrders(config.id!)
      ]);
      
      // Create maps for enhanced data
      const customers = await squareService.getCustomers(config.id!);
      const customerMap = new Map(customers.map(c => [c.id, c]));
      const orderMap = new Map(orders.map(o => [o.id, o]));
      const refundMap = new Map<string, { amount: number; count: number }>();
      
      // Calculate refund totals per payment
      refunds.forEach(refund => {
        const existing = refundMap.get(refund.payment_id) || { amount: 0, count: 0 };
        refundMap.set(refund.payment_id, {
          amount: existing.amount + (refund.amount_money.amount / 100),
          count: existing.count + 1
        });
      });
      
      return squarePayments.slice(0, limit).map(payment => {
        const refundInfo = refundMap.get(payment.id);
        
        return {
          id: `PAY-${payment.id.slice(-6)}`,
          orderId: payment.order_id,
          customer: this.getPaymentCustomerName(payment, orderMap, customerMap),
          amount: this.getPaymentAmount(payment),
          method: this.getPaymentMethod(payment),
          status: this.mapPaymentStatus(payment.status),
          date: payment.created_at ? new Date(payment.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          squarePaymentId: payment.id,
          processingFee: this.calculateProcessingFee(payment),
          netAmount: this.getPaymentAmount(payment) - (this.calculateProcessingFee(payment) || 0),
          cardType: payment.card_details?.card?.card_brand,
          lastFour: payment.card_details?.card?.last_4,
          refundAmount: refundInfo?.amount || 0,
          hasRefunds: (refundInfo?.count || 0) > 0
        };
      });
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      return [];
    }
  }

  async getInventory(limit: number = 25): Promise<BusinessInventoryItem[]> {
    try {
      const config = await this.getActiveSquareConfig();
      if (!config) {
        throw new Error('No active Square configuration found');
      }

      // Get real inventory data from Square
      const [inventoryData, productsData] = await Promise.all([
        squareService.getInventory(config.id!),
        squareService.getProducts(config.id!)
      ]);

      // Create a map of product data for easy lookup
      const productMap = new Map(productsData.map(product => [product.id, product]));

      // Convert Square inventory data to business inventory items
      const inventoryItems: BusinessInventoryItem[] = inventoryData.slice(0, limit).map(item => {
        const product = productMap.get(item.catalog_object_id);
        return {
          id: item.catalog_object_id,
          name: product?.name || 'Unknown Product',
          sku: item.catalog_object_id,
          quantity: parseInt(item.quantity || '0'),
          unit: 'units',
          cost: 0, // Square doesn't provide cost in inventory API
          price: product?.price_money?.amount || 0,
          category: product?.category_id || 'Uncategorized',
          location: item.location_id || 'Unknown',
          status: parseInt(item.quantity || '0') > 0 ? 'Active' : 'Out of Stock',
          lastUpdated: item.calculated_at ? new Date(item.calculated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        };
      });

      return inventoryItems;
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      // Return empty array instead of mock data on error
      return [];
    }
  }

  // New methods for additional Square data
  async getRefunds(limit: number = 20): Promise<BusinessRefund[]> {
    try {
      const config = await this.getActiveSquareConfig();
      const [refunds, payments, orders] = await Promise.all([
        squareService.getRefunds(config.id!),
        squareService.getPayments(config.id!),
        squareService.getOrders(config.id!)
      ]);
      
      const customers = await squareService.getCustomers(config.id!);
      const customerMap = new Map(customers.map(c => [c.id, c]));
      const paymentMap = new Map(payments.map(p => [p.id, p]));
      const orderMap = new Map(orders.map(o => [o.id, o]));
      
      return refunds.slice(0, limit).map(refund => ({
        id: `REF-${refund.id.slice(-6)}`,
        paymentId: refund.payment_id,
        orderId: refund.order_id,
        customer: this.getRefundCustomerName(refund, paymentMap, orderMap, customerMap),
        amount: refund.amount_money.amount / 100,
        reason: refund.reason || 'Customer request',
        status: refund.status,
        date: new Date(refund.created_at).toISOString().split('T')[0],
        squareRefundId: refund.id
      }));
    } catch (error) {
      console.error('Failed to fetch refunds:', error);
      return [];
    }
  }

  async getDisputes(limit: number = 10): Promise<BusinessDispute[]> {
    try {
      const config = await this.getActiveSquareConfig();
      const [disputes, payments] = await Promise.all([
        squareService.getDisputes(config.id!),
        squareService.getPayments(config.id!)
      ]);
      
      const paymentMap = new Map(payments.map(p => [p.id, p]));
      
      return disputes.slice(0, limit).map(dispute => ({
        id: `DIS-${dispute.id.slice(-6)}`,
        amount: dispute.amount_money.amount / 100,
        reason: dispute.reason,
        status: dispute.state,
        dueDate: dispute.due_at ? new Date(dispute.due_at).toISOString().split('T')[0] : undefined,
        paymentId: dispute.disputed_payment_id,
        customer: 'Unknown Customer', // Would need to trace through payment to customer
        cardBrand: dispute.card_brand,
        createdAt: new Date(dispute.created_at).toISOString().split('T')[0]
      }));
    } catch (error) {
      console.error('Failed to fetch disputes:', error);
      return [];
    }
  }

  async getSubscriptions(limit: number = 15): Promise<BusinessSubscription[]> {
    try {
      const config = await this.getActiveSquareConfig();
      const [subscriptions, customers, locations] = await Promise.all([
        squareService.getSubscriptions(config.id!),
        squareService.getCustomers(config.id!),
        squareService.getLocations(config.id!)
      ]);
      
      const customerMap = new Map(customers.map(c => [c.id, c]));
      const locationMap = new Map(locations.map(l => [l.id, l]));
      
      return subscriptions.slice(0, limit).map(subscription => ({
        id: `SUB-${subscription.id.slice(-6)}`,
        customer: customerMap.get(subscription.customer_id || '')?.company_name || 
                 `${customerMap.get(subscription.customer_id || '')?.given_name || ''} ${customerMap.get(subscription.customer_id || '')?.family_name || ''}`.trim() || 
                 'Unknown Customer',
        planName: subscription.source?.name || 'Custom Plan',
        status: subscription.status,
        startDate: new Date(subscription.start_date).toISOString().split('T')[0],
        amount: 0, // Would need to get from plan details
        frequency: 'Monthly', // Would need to get from plan details
        location: locationMap.get(subscription.location_id)?.name || 'Unknown Location'
      }));
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
      return [];
    }
  }

  async getInvoices(limit: number = 20): Promise<BusinessInvoice[]> {
    try {
      const config = await this.getActiveSquareConfig();
      const [invoices, customers] = await Promise.all([
        squareService.getInvoices(config.id!),
        squareService.getCustomers(config.id!)
      ]);
      
      const customerMap = new Map(customers.map(c => [c.id, c]));
      
      return invoices.slice(0, limit).map(invoice => ({
        id: `INV-${invoice.id.slice(-6)}`,
        invoiceNumber: invoice.invoice_number,
        customer: customerMap.get(invoice.primary_recipient.customer_id || '')?.company_name || 
                 `${customerMap.get(invoice.primary_recipient.customer_id || '')?.given_name || ''} ${customerMap.get(invoice.primary_recipient.customer_id || '')?.family_name || ''}`.trim() || 
                 'Unknown Customer',
        title: invoice.title,
        description: invoice.description,
        amount: 0, // Would need to calculate from payment requests
        status: invoice.status,
        dueDate: invoice.scheduled_at ? new Date(invoice.scheduled_at).toISOString().split('T')[0] : undefined,
        createdAt: new Date(invoice.created_at).toISOString().split('T')[0],
        paymentMethods: this.getInvoicePaymentMethods(invoice.accepted_payment_methods)
      }));
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      return [];
    }
  }

  async getTeamMembers(limit: number = 10): Promise<BusinessTeamMember[]> {
    try {
      const config = await this.getActiveSquareConfig();
      const [teamMembers, locations] = await Promise.all([
        squareService.getTeamMembers(config.id!),
        squareService.getLocations(config.id!)
      ]);
      
      const locationMap = new Map(locations.map(l => [l.id, l]));
      
      return teamMembers.slice(0, limit).map(member => ({
        id: member.id,
        name: `${member.given_name || ''} ${member.family_name || ''}`.trim() || 'Unknown Member',
        email: member.email_address,
        phone: member.phone_number,
        role: member.is_owner ? 'Owner' : 'Employee',
        status: member.status,
        locations: member.assigned_locations?.location_ids?.map(id => locationMap.get(id)?.name || id) || [],
        isOwner: member.is_owner,
        joinedAt: new Date(member.created_at).toISOString().split('T')[0]
      }));
    } catch (error) {
      console.error('Failed to fetch team members:', error);
      return [];
    }
  }

  async getLabor(limit: number = 25): Promise<BusinessLaborEntry[]> {
    try {
      const config = await this.getActiveSquareConfig();
      const [laborEntries, teamMembers, locations] = await Promise.all([
        squareService.getLabor(config.id!),
        squareService.getTeamMembers(config.id!),
        squareService.getLocations(config.id!)
      ]);
      
      const memberMap = new Map(teamMembers.map(m => [m.id, m]));
      const locationMap = new Map(locations.map(l => [l.id, l]));
      
      return laborEntries.slice(0, limit).map(entry => {
        const member = memberMap.get(entry.employee_id);
        const startTime = new Date(entry.start_at);
        const endTime = entry.end_at ? new Date(entry.end_at) : null;
        const duration = endTime ? ((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)).toFixed(1) : null;
        const hourlyRate = entry.wage?.hourly_rate?.amount ? entry.wage.hourly_rate.amount / 100 : 0;
        
        return {
          id: entry.id,
          employeeName: member ? `${member.given_name || ''} ${member.family_name || ''}`.trim() : 'Unknown Employee',
          location: locationMap.get(entry.location_id)?.name || 'Unknown Location',
          startTime: startTime.toLocaleString(),
          endTime: endTime?.toLocaleString(),
          duration: duration ? `${duration} hours` : 'In progress',
          hourlyRate,
          totalPay: duration && hourlyRate ? parseFloat(duration) * hourlyRate : 0,
          status: entry.status,
          breaks: entry.breaks?.length || 0
        };
      });
    } catch (error) {
      console.error('Failed to fetch labor data:', error);
      return [];
    }
  }

  async getPayouts(limit: number = 15): Promise<BusinessPayout[]> {
    try {
      const config = await this.getActiveSquareConfig();
      const [payouts, locations] = await Promise.all([
        squareService.getPayouts(config.id!),
        squareService.getLocations(config.id!)
      ]);
      
      const locationMap = new Map(locations.map(l => [l.id, l]));
      
      return payouts.slice(0, limit).map(payout => ({
        id: `OUT-${payout.id.slice(-6)}`,
        amount: payout.amount_money ? payout.amount_money.amount / 100 : 0,
        status: payout.status,
        location: locationMap.get(payout.location_id)?.name || 'Unknown Location',
        date: new Date(payout.created_at).toISOString().split('T')[0],
        destination: payout.destination?.type || 'Bank Account'
      }));
    } catch (error) {
      console.error('Failed to fetch payouts:', error);
      return [];
    }
  }

  // Helper methods for data transformation
  private getCustomerName(order: any, customerMap: Map<string, any>): string {
    // Try to get customer from order or use fallback
    const customer = customerMap.get(''); // Square orders don't always have customer_id
    return customer?.company_name || 
           `${customer?.given_name || ''} ${customer?.family_name || ''}`.trim() || 
           'Walk-in Customer';
  }

  private getPaymentCustomerName(payment: any, orderMap: Map<string, any>, customerMap: Map<string, any>): string {
    const order = orderMap.get(payment.order_id);
    return this.getCustomerName(order, customerMap);
  }

  private getRefundCustomerName(refund: any, paymentMap: Map<string, any>, orderMap: Map<string, any>, customerMap: Map<string, any>): string {
    const payment = paymentMap.get(refund.payment_id);
    return this.getPaymentCustomerName(payment, orderMap, customerMap);
  }

  private mapOrderStatus(squareStatus: string): string {
    switch (squareStatus?.toUpperCase()) {
      case 'OPEN': return 'Processing';
      case 'COMPLETED': return 'Delivered';
      case 'CANCELED': return 'Cancelled';
      default: return 'Processing';
    }
  }

  private mapPaymentStatus(squareStatus: string): string {
    switch (squareStatus?.toUpperCase()) {
      case 'COMPLETED': return 'Paid';
      case 'PENDING': return 'Pending';
      case 'FAILED': return 'Failed';
      default: return 'Pending';
    }
  }

  private getOrderTotal(order: any): number {
    return order.total_money?.amount ? order.total_money.amount / 100 : 0;
  }

  private getPaymentAmount(payment: any): number {
    return payment.amount_money?.amount ? payment.amount_money.amount / 100 : 0;
  }

  private getPaymentMethod(payment: any): string {
    if (payment.card_details) return 'Credit Card';
    if (payment.source_type === 'BANK_ACCOUNT') return 'ACH Transfer';
    return 'Other';
  }

  private calculateProcessingFee(payment: any): number {
    // Estimate Square processing fee (2.9% + $0.30 for card payments)
    const amount = this.getPaymentAmount(payment);
    if (payment.card_details) {
      return Math.round((amount * 0.029 + 0.30) * 100) / 100;
    }
    return 0;
  }

  private mapOrderItems(lineItems: any[]): Array<{ product: string; quantity: number; unit: string; price: number }> {
    return lineItems.map(item => ({
      product: item.name || 'Unknown Product',
      quantity: parseInt(item.quantity) || 1,
      unit: 'units',
      price: item.base_price_money?.amount ? item.base_price_money.amount / 100 : 0
    }));
  }

  private getProductPrice(product: any): number {
    return product.price_money?.amount ? product.price_money.amount / 100 : 0;
  }

  private getInvoicePaymentMethods(methods: any): string[] {
    const paymentMethods: string[] = [];
    if (methods?.card) paymentMethods.push('Card');
    if (methods?.square_gift_card) paymentMethods.push('Gift Card');
    if (methods?.bank_account) paymentMethods.push('Bank Transfer');
    if (methods?.buy_now_pay_later) paymentMethods.push('Buy Now Pay Later');
    return paymentMethods.length > 0 ? paymentMethods : ['Card'];
  }

  async getRevenueAnalytics() {
    try {
      const config = await this.getActiveSquareConfig();
      const [payments, refunds, disputes] = await Promise.all([
        this.getPayments(100),
        this.getRefunds(50),
        this.getDisputes(20)
      ]);

      const totalRevenue = payments.reduce((sum, payment) => 
        payment.status === 'Paid' ? sum + payment.amount : sum, 0
      );
      
      const totalRefunds = refunds.reduce((sum, refund) => sum + refund.amount, 0);
      const totalDisputes = disputes.reduce((sum, dispute) => sum + dispute.amount, 0);
      const netRevenue = totalRevenue - totalRefunds - totalDisputes;
      
      const processingFees = payments.reduce((sum, payment) => 
        payment.status === 'Paid' && payment.processingFee ? sum + payment.processingFee : sum, 0
      );

      return {
        totalRevenue,
        totalRefunds,
        totalDisputes,
        netRevenue,
        processingFees,
        monthlyRevenue: this.calculateMonthlyRevenue(payments),
        paymentSuccessRate: payments.length > 0 ? 
          (payments.filter(p => p.status === 'Paid').length / payments.length * 100) : 0,
        averageOrderValue: payments.length > 0 ? totalRevenue / payments.length : 0,
        refundRate: totalRevenue > 0 ? (totalRefunds / totalRevenue * 100) : 0,
        disputeRate: totalRevenue > 0 ? (totalDisputes / totalRevenue * 100) : 0
      };
    } catch (error) {
      console.error('Failed to get revenue analytics:', error);
      return {
        totalRevenue: 0,
        totalRefunds: 0,
        totalDisputes: 0,
        netRevenue: 0,
        processingFees: 0,
        monthlyRevenue: [],
        paymentSuccessRate: 0,
        averageOrderValue: 0,
        refundRate: 0,
        disputeRate: 0
      };
    }
  }

  private calculateMonthlyRevenue(payments: BusinessPayment[]) {
    const monthlyData = new Map<string, number>();
    
    payments.forEach(payment => {
      if (payment.status === 'Paid') {
        const month = payment.date.substring(0, 7); // YYYY-MM
        monthlyData.set(month, (monthlyData.get(month) || 0) + payment.amount);
      }
    });

    return Array.from(monthlyData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({ month, revenue }));
  }
}

export const businessManagementService = new BusinessManagementService(); 