/**
 * Square Integration Types
 *
 * Type definitions for Square POS integration data.
 * These types represent the structure of data returned from Square's API
 * via our backend proxy.
 */

// =====================================================
// COMMON TYPES
// =====================================================

export interface SquareMoney {
  amount: number; // Amount in cents (e.g., 1000 = $10.00)
  currency: string; // ISO 4217 currency code (e.g., "USD")
}

// =====================================================
// CONFIGURATION TYPES
// =====================================================

export interface SquareConfig {
  id?: string;
  name: string;
  application_id: string;
  access_token: string;
  environment: "sandbox" | "production";
  webhook_signature_key?: string;
  webhook_url?: string;
  is_active: boolean;
  last_sync_at?: string;
  sync_status?: "pending" | "syncing" | "success" | "error";
  sync_error?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SquareConfigCreate {
  name: string;
  application_id: string;
  access_token: string;
  environment: "sandbox" | "production";
  webhook_signature_key?: string;
  webhook_url?: string;
}

export interface SquareConfigUpdate {
  name?: string;
  application_id?: string;
  access_token?: string;
  environment?: "sandbox" | "production";
  webhook_signature_key?: string;
  webhook_url?: string;
  is_active?: boolean;
}

export interface SquareConnectionStatus {
  connected: boolean;
  environment: string;
  application_id?: string;
  last_test_at?: string;
  error_message?: string;
}

// =====================================================
// LOCATION TYPES
// =====================================================

export interface SquareLocation {
  id: string;
  name: string;
  address?: string;
  phone_number?: string;
  business_name?: string;
  type?: string;
  website_url?: string;
  status: string;
}

// =====================================================
// PRODUCT TYPES
// =====================================================

export interface SquareProductVariation {
  id: string;
  name: string;
  sku?: string;
  ordinal?: number;
  pricing_type: "FIXED_PRICING" | "VARIABLE_PRICING";
  price_money?: SquareMoney;
  item_option_values?: Array<{
    item_option_id: string;
    item_option_value_id: string;
  }>;
}

export interface SquareProduct {
  id: string;
  name: string;
  description?: string;
  category_id?: string;
  price_money?: SquareMoney;
  variations: SquareProductVariation[];
  image_url?: string;
  is_deleted: boolean;
}

// =====================================================
// CUSTOMER TYPES
// =====================================================

export interface SquareCustomer {
  id: string;
  given_name?: string;
  family_name?: string;
  email_address?: string;
  phone_number?: string;
  company_name?: string;
  created_at?: string;
  updated_at?: string;
}

// =====================================================
// ORDER TYPES
// =====================================================

export interface SquareOrderLineItem {
  uid?: string;
  name: string;
  quantity: string; // Square uses string for quantity
  catalog_object_id?: string;
  variation_name?: string;
  base_price_money?: SquareMoney;
  total_money?: SquareMoney;
  total_tax_money?: SquareMoney;
  total_discount_money?: SquareMoney;
  note?: string;
}

export interface SquareOrder {
  id: string;
  location_id: string;
  state: string; // OPEN, COMPLETED, CANCELED
  total_money?: SquareMoney;
  total_tax_money?: SquareMoney;
  total_discount_money?: SquareMoney;
  total_tip_money?: SquareMoney;
  total_service_charge_money?: SquareMoney;
  created_at?: string;
  updated_at?: string;
  closed_at?: string;
  line_items: SquareOrderLineItem[];
  customer_id?: string;
  reference_id?: string;
  source?: {
    name?: string;
  };
}

// =====================================================
// PAYMENT TYPES
// =====================================================

export interface SquarePaymentCardDetails {
  status: string;
  card?: {
    card_brand?: string; // VISA, MASTERCARD, AMERICAN_EXPRESS, etc.
    last_4?: string;
    exp_month?: number;
    exp_year?: number;
    cardholder_name?: string;
    card_type?: string; // CREDIT, DEBIT
    prepaid_type?: string;
    bin?: string;
  };
  entry_method?: string; // KEYED, SWIPED, EMV, CONTACTLESS, ON_FILE
  cvv_status?: string;
  avs_status?: string;
  auth_result_code?: string;
}

export interface SquarePayment {
  id: string;
  order_id?: string;
  amount_money: SquareMoney;
  tip_money?: SquareMoney;
  processing_fee?: Array<{
    effective_at?: string;
    type?: string;
    amount_money?: SquareMoney;
  }>;
  status: string; // APPROVED, PENDING, COMPLETED, CANCELED, FAILED
  source_type?: string; // CARD, CASH, EXTERNAL, WALLET, BANK_ACCOUNT
  card_details?: SquarePaymentCardDetails;
  location_id?: string;
  created_at?: string;
  updated_at?: string;
  receipt_number?: string;
  receipt_url?: string;
  delay_action?: string;
  delay_duration?: string;
  delayed_until?: string;
}

// =====================================================
// REFUND TYPES
// =====================================================

export interface SquareRefund {
  id: string;
  payment_id: string;
  order_id?: string;
  location_id: string;
  amount_money: SquareMoney;
  status: string; // PENDING, APPROVED, REJECTED, FAILED
  reason: string;
  created_at: string;
  updated_at?: string;
}

// =====================================================
// DISPUTE TYPES
// =====================================================

export interface SquareDispute {
  id: string;
  dispute_id: string;
  amount_money: SquareMoney;
  reason: string;
  state: string; // INQUIRY_EVIDENCE_REQUIRED, INQUIRY_PROCESSING, INQUIRY_CLOSED, etc.
  due_at?: string;
  disputed_payment_id: string;
  evidence_ids: string[];
  card_brand?: string;
  created_at: string;
  updated_at?: string;
}

// =====================================================
// SUBSCRIPTION TYPES
// =====================================================

export interface SquareSubscription {
  id: string;
  location_id: string;
  plan_id: string;
  customer_id?: string;
  start_date: string;
  charged_through_date?: string;
  status: string; // PENDING, ACTIVE, CANCELED, DEACTIVATED, PAUSED
  source?: {
    name: string;
  };
  actions?: Array<{
    id: string;
    type: string;
    effective_date: string;
  }>;
  created_at: string;
}

// =====================================================
// INVOICE TYPES
// =====================================================

export interface SquareInvoice {
  id: string;
  version: number;
  location_id: string;
  order_id?: string;
  primary_recipient: {
    customer_id?: string;
    given_name?: string;
    family_name?: string;
    email_address?: string;
  };
  payment_requests: Array<{
    uid?: string;
    request_type?: string;
    due_date?: string;
    computed_amount_money?: SquareMoney;
    total_completed_amount_money?: SquareMoney;
    automatic_payment_source?: string;
  }>;
  delivery_method: string;
  invoice_number?: string;
  title?: string;
  description?: string;
  scheduled_at?: string;
  accepted_payment_methods?: {
    card: boolean;
    square_gift_card: boolean;
    bank_account: boolean;
    buy_now_pay_later: boolean;
  };
  status: string; // DRAFT, UNPAID, SCHEDULED, PARTIALLY_PAID, PAID, CANCELED, REFUNDED
  timezone?: string;
  created_at: string;
  updated_at?: string;
}

// =====================================================
// TEAM MEMBER TYPES
// =====================================================

export interface SquareTeamMember {
  id: string;
  reference_id?: string;
  is_owner: boolean;
  status: string; // ACTIVE, INACTIVE
  given_name?: string;
  family_name?: string;
  email_address?: string;
  phone_number?: string;
  created_at: string;
  updated_at?: string;
  assigned_locations?: {
    assignment_type: string; // ALL_CURRENT_AND_FUTURE_LOCATIONS, EXPLICIT_LOCATIONS
    location_ids?: string[];
  };
}

// =====================================================
// LABOR TYPES
// =====================================================

export interface SquareLabor {
  id: string;
  employee_id: string;
  location_id: string;
  start_at: string;
  end_at?: string;
  wage?: {
    title?: string;
    hourly_rate?: SquareMoney;
  };
  breaks?: Array<{
    id: string;
    start_at: string;
    end_at?: string;
    break_type_id: string;
    name: string;
    expected_duration: string;
    is_paid: boolean;
  }>;
  status: string;
  created_at: string;
  updated_at?: string;
}

// =====================================================
// PAYOUT TYPES
// =====================================================

export interface SquarePayout {
  id: string;
  status: string; // SENT, FAILED, PAID
  location_id: string;
  amount_money: SquareMoney;
  destination?: {
    type: string; // BANK_ACCOUNT
    id?: string;
  };
  created_at: string;
  updated_at?: string;
  arrival_date?: string;
  end_to_end_id?: string;
  type?: string; // BATCH, SIMPLE
}

// =====================================================
// INVENTORY TYPES
// =====================================================

export interface SquareInventoryCount {
  catalog_object_id: string;
  catalog_object_type: string;
  state: string; // IN_STOCK, SOLD, RETURNED_BY_CUSTOMER, etc.
  location_id: string;
  quantity: string;
  calculated_at: string;
}

export interface SquareInventoryChange {
  type: string; // PHYSICAL_COUNT, ADJUSTMENT, TRANSFER
  physical_count?: {
    catalog_object_id: string;
    state: string;
    location_id: string;
    quantity: string;
    occurred_at: string;
  };
  adjustment?: {
    catalog_object_id: string;
    from_state: string;
    to_state: string;
    location_id: string;
    quantity: string;
    occurred_at: string;
  };
}

// =====================================================
// MERCHANT TYPES
// =====================================================

export interface SquareMerchant {
  id: string;
  business_name?: string;
  country: string;
  language_code?: string;
  currency?: string;
  status?: string;
  main_location_id?: string;
  created_at?: string;
}

// =====================================================
// WEBHOOK TYPES
// =====================================================

export interface SquareWebhook {
  id: string;
  name: string;
  event_types: string[];
  notification_url: string;
  api_version: string;
  signature_key: string;
  enabled: boolean;
  created_at?: string;
}
