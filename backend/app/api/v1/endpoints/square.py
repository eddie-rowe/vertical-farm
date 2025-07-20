"""
Square Integration API Endpoints

This module provides REST API endpoints for managing Square payment integration
within the vertical farm system.
"""

import hashlib
import hmac
import json
import logging
import os
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field

from app.core.security import get_current_active_user as get_current_user
from app.db.supabase_client import get_async_rls_client, get_async_supabase_client
from app.models.user import User
from app.schemas.square import (
    CacheInvalidationRequest,
    CacheInvalidationResponse,
    SquareWebhookCreate,
    SquareWebhookEventCreate,
    SquareWebhookEventResponse,
    SquareWebhookPayload,
    SquareWebhookResponse,
    WebhookHealthResponse,
    WebhookRegistrationRequest,
    WebhookRegistrationResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter()


# Pydantic Models
class SquareConfig(BaseModel):
    id: Optional[str] = None
    name: str
    application_id: str
    access_token: str
    environment: str = Field(default="sandbox", description="sandbox or production")
    is_active: bool = True
    last_sync_at: Optional[datetime] = None
    sync_status: str = "pending"
    sync_error: Optional[str] = None
    webhook_status: Optional[str] = None  # "active", "inactive", "failed", "pending"
    webhook_registered_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class SquareConfigCreate(BaseModel):
    name: str
    application_id: str
    access_token: str
    environment: str = "sandbox"


class SquareConfigUpdate(BaseModel):
    name: Optional[str] = None
    application_id: Optional[str] = None
    access_token: Optional[str] = None
    environment: Optional[str] = None
    is_active: Optional[bool] = None


class SquareConnectionStatus(BaseModel):
    connected: bool
    environment: str
    application_id: Optional[str] = None
    last_test_at: Optional[datetime] = None
    error_message: Optional[str] = None
    webhook_status: Optional[str] = None
    webhook_registered: bool = False
    webhook_events_received: Optional[int] = None
    webhook_last_event: Optional[datetime] = None


class SquareLocation(BaseModel):
    id: str
    name: str
    address: Optional[str] = None
    phone_number: Optional[str] = None
    business_name: Optional[str] = None
    type: Optional[str] = None
    website_url: Optional[str] = None
    status: str


class SquareProduct(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    category_id: Optional[str] = None
    price_money: Optional[Dict[str, Any]] = None
    variations: List[Dict[str, Any]] = []
    image_url: Optional[str] = None
    is_deleted: bool = False


class SquareCustomer(BaseModel):
    id: str
    given_name: Optional[str] = None
    family_name: Optional[str] = None
    email_address: Optional[str] = None
    phone_number: Optional[str] = None
    company_name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class SquareOrder(BaseModel):
    id: str
    location_id: str
    state: str
    total_money: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    line_items: List[Dict[str, Any]] = []


class SquarePayment(BaseModel):
    id: str
    order_id: Optional[str] = None
    amount_money: Dict[str, Any]
    status: str
    source_type: Optional[str] = None
    card_details: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None


class SquareInventoryCount(BaseModel):
    catalog_object_id: str
    catalog_object_type: str
    state: str
    location_id: str
    quantity: Optional[str] = None
    calculated_at: Optional[datetime] = None


class SquareLoyaltyProgram(BaseModel):
    id: str
    status: str
    reward_tiers: List[Dict[str, Any]] = []
    expiration_policy: Optional[Dict[str, Any]] = None
    terminology: Optional[Dict[str, Any]] = None
    location_ids: List[str] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    accrual_rules: List[Dict[str, Any]] = []


class SquareGiftCard(BaseModel):
    id: str
    type: str
    gan_source: str
    state: str
    balance_money: Optional[Dict[str, Any]] = None
    gan: str
    created_at: Optional[datetime] = None
    customer_ids: List[str] = []


class SquareCategory(BaseModel):
    id: str
    name: str
    image_ids: List[str] = []
    category_data: Optional[Dict[str, Any]] = None
    is_deleted: bool = False
    present_at_all_locations: bool = True
    present_at_location_ids: List[str] = []
    absent_at_location_ids: List[str] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class SquareBusinessProfile(BaseModel):
    merchant_id: str
    business_name: Optional[str] = None
    country: str
    language_code: str
    currency: str
    business_type: Optional[str] = None
    business_hours: Optional[Dict[str, Any]] = None
    business_appointment_settings: Optional[Dict[str, Any]] = None
    support_seller_id: Optional[str] = None
    status: str


# New models for additional endpoints
class SquareRefund(BaseModel):
    id: str
    location_id: str
    amount_money: Dict[str, Any]
    reason: Optional[str] = None
    status: str
    processing_fee: Optional[List[Dict[str, Any]]] = None
    payment_id: str
    order_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class SquareDispute(BaseModel):
    id: str
    amount_money: Optional[Dict[str, Any]] = None
    reason: str
    state: str
    due_at: Optional[datetime] = None
    disputed_payment: Optional[Dict[str, Any]] = None
    evidence_ids: List[str] = []
    card_brand: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class SquareSubscription(BaseModel):
    id: str
    location_id: str
    plan_id: str
    customer_id: str
    start_date: str
    status: str
    tax_percentage: Optional[str] = None
    invoice_request_method: Optional[str] = None
    charge_through_date: Optional[str] = None
    charged_through_date: Optional[str] = None
    paid_until_date: Optional[str] = None
    created_at: Optional[datetime] = None
    timezone: Optional[str] = None


class SquareInvoice(BaseModel):
    id: str
    version: int
    location_id: str
    order_id: str
    primary_recipient: Dict[str, Any]
    payment_requests: List[Dict[str, Any]] = []
    delivery_method: str
    invoice_number: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    public_url: Optional[str] = None
    status: str
    timezone: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class SquareTeamMember(BaseModel):
    id: str
    reference_id: Optional[str] = None
    is_owner: bool
    status: str
    given_name: Optional[str] = None
    family_name: Optional[str] = None
    email_address: Optional[str] = None
    phone_number: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    assigned_locations: Optional[Dict[str, Any]] = None


class SquareWage(BaseModel):
    title: Optional[str] = None
    hourly_rate: Optional[Dict[str, Any]] = None
    job_id: Optional[str] = None


class SquareLabor(BaseModel):
    id: str
    employee_id: str
    location_id: Optional[str] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    wage: Optional[SquareWage] = None
    teamMember_id: Optional[str] = None
    declared_cash_tip_money: Optional[Dict[str, Any]] = None
    version: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class SquareMerchant(BaseModel):
    id: str
    business_name: Optional[str] = None
    country: str
    language_code: str
    currency: str
    status: str
    main_location_id: Optional[str] = None
    created_at: Optional[datetime] = None


class SquarePayout(BaseModel):
    id: str
    status: str
    location_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    amount_money: Optional[Dict[str, Any]] = None
    destination: Optional[Dict[str, Any]] = None
    version: Optional[int] = None
    type: Optional[str] = None
    payout_fee: Optional[List[Dict[str, Any]]] = None
    arrival_date: Optional[str] = None


class SquareService:
    """Service for interacting with Square API using real HTTP calls"""

    def __init__(self, config: Optional[SquareConfig] = None):
        """Initialize with optional user-specific configuration"""
        self.config = config

    # Cache Helper Methods
    async def _get_cache_entry(
        self, user_id: str, entity_type: str, cache_key: str, supabase
    ) -> Optional[Dict[str, Any]]:
        """Get a cache entry from the database"""
        try:
            table_name = f"square_cache_{entity_type}"
            response = (
                await supabase.table(table_name)
                .select("*")
                .eq("user_id", user_id)
                .eq("cache_key", cache_key)
                .single()
                .execute()
            )

            if response.data:
                # Check if cache is still valid (TTL)
                cached_at = datetime.fromisoformat(response.data["cached_at"])
                ttl_minutes = response.data.get("ttl_minutes", 60)  # Default 1 hour

                if datetime.utcnow() <= cached_at.replace(tzinfo=None) + timedelta(
                    minutes=ttl_minutes
                ):
                    return response.data
                else:
                    # Cache expired, delete it
                    await self._delete_cache_entry(
                        user_id, entity_type, cache_key, supabase
                    )

            return None
        except Exception as e:
            logger.error(
                f"Error getting cache entry for {entity_type}/{cache_key}: {e}"
            )
            return None

    async def _set_cache_entry(
        self,
        user_id: str,
        entity_type: str,
        cache_key: str,
        data: Any,
        ttl_minutes: int,
        supabase,
    ) -> bool:
        """Set a cache entry in the database"""
        try:
            table_name = f"square_cache_{entity_type}"

            # Convert data to JSON if it's not already
            if hasattr(data, "dict"):
                # Pydantic model
                json_data = (
                    [item.dict() if hasattr(item, "dict") else item for item in data]
                    if isinstance(data, list)
                    else data.dict()
                )
            elif isinstance(data, list):
                # List of dicts or Pydantic models
                json_data = [
                    item.dict() if hasattr(item, "dict") else item for item in data
                ]
            else:
                json_data = data

            cache_entry = {
                "user_id": user_id,
                "cache_key": cache_key,
                "data": json_data,
                "cached_at": datetime.utcnow().isoformat(),
                "ttl_minutes": ttl_minutes,
            }

            # Upsert the cache entry
            response = (
                await supabase.table(table_name)
                .upsert(cache_entry, on_conflict="user_id,cache_key")
                .execute()
            )

            # Log the sync operation
            await self._log_sync_operation(
                user_id, entity_type, "cache_set", f"Cached {cache_key}", supabase
            )

            return True
        except Exception as e:
            logger.error(
                f"Error setting cache entry for {entity_type}/{cache_key}: {e}"
            )
            return False

    async def _delete_cache_entry(
        self, user_id: str, entity_type: str, cache_key: str, supabase
    ) -> bool:
        """Delete a cache entry from the database"""
        try:
            table_name = f"square_cache_{entity_type}"
            await supabase.table(table_name).delete().eq("user_id", user_id).eq(
                "cache_key", cache_key
            ).execute()
            return True
        except Exception as e:
            logger.error(
                f"Error deleting cache entry for {entity_type}/{cache_key}: {e}"
            )
            return False

    async def _invalidate_cache_for_user(
        self, user_id: str, entity_type: Optional[str] = None, supabase=None
    ) -> bool:
        """Invalidate cache entries for a user (optionally for specific entity type)"""
        try:
            if entity_type:
                # Invalidate specific entity type
                table_name = f"square_cache_{entity_type}"
                await supabase.table(table_name).delete().eq(
                    "user_id", user_id
                ).execute()
            else:
                # Invalidate all cache types for user
                cache_types = [
                    "locations",
                    "products",
                    "customers",
                    "orders",
                    "payments",
                ]
                for cache_type in cache_types:
                    table_name = f"square_cache_{cache_type}"
                    await supabase.table(table_name).delete().eq(
                        "user_id", user_id
                    ).execute()

            await self._log_sync_operation(
                user_id,
                entity_type or "all",
                "cache_invalidate",
                f"Invalidated cache for {entity_type or 'all entities'}",
                supabase,
            )
            return True
        except Exception as e:
            logger.error(f"Error invalidating cache for user {user_id}: {e}")
            return False

    async def _log_sync_operation(
        self, user_id: str, entity_type: str, operation: str, details: str, supabase
    ) -> None:
        """Log sync operations to the sync_logs table"""
        try:
            log_entry = {
                "user_id": user_id,
                "entity_type": entity_type,
                "operation": operation,
                "details": details,
                "timestamp": datetime.utcnow().isoformat(),
                "status": "success",
            }
            await supabase.table("square_sync_logs").insert(log_entry).execute()
        except Exception as e:
            logger.error(f"Error logging sync operation: {e}")

    async def _get_cache_key(
        self, config: SquareConfig, additional_params: Optional[str] = None
    ) -> str:
        """Generate a cache key based on config and additional parameters"""
        base_key = f"{config.application_id}_{config.environment}"
        if additional_params:
            base_key += f"_{additional_params}"
        return base_key

    # Webhook-related methods
    async def verify_webhook_signature(
        self, payload: str, signature: str, signature_key: str
    ) -> bool:
        """Verify Square webhook signature for security."""
        try:
            # Square uses HMAC-SHA256 with the signature key
            expected_signature = hmac.new(
                signature_key.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256
            ).hexdigest()

            # Square signature format: "sha256=<hash>"
            if signature.startswith("sha256="):
                signature = signature[7:]

            return hmac.compare_digest(expected_signature, signature)
        except Exception as e:
            logger.error(f"Error verifying webhook signature: {e}")
            return False

    async def process_webhook_event(
        self,
        user_id: str,
        payload: SquareWebhookPayload,
        signature_header: str,
        supabase,
    ) -> bool:
        """Process incoming Square webhook event and invalidate relevant cache."""
        try:
            # Log the webhook event
            event_data = SquareWebhookEventCreate(
                user_id=user_id,
                event_id=payload.event_id,
                event_type=payload.type,
                merchant_id=payload.merchant_id,
                payload=payload.data,
                signature_header=signature_header,
            )

            # Store webhook event in database
            await self._store_webhook_event(event_data, supabase)

            # Determine which caches to invalidate based on event type
            cache_types_to_invalidate = self._get_cache_types_for_event(payload.type)

            # Invalidate relevant caches
            for cache_type in cache_types_to_invalidate:
                await self._invalidate_cache_for_user(user_id, cache_type, supabase)

            # Update event status to processed
            await self._update_webhook_event_status(
                event_data.event_id,
                "processed",
                cache_invalidated=True,
                supabase=supabase,
            )

            logger.info(
                f"Successfully processed webhook event {payload.event_id} for user {user_id}"
            )
            return True

        except Exception as e:
            logger.error(f"Error processing webhook event {payload.event_id}: {e}")
            # Update event status to failed
            await self._update_webhook_event_status(
                payload.event_id, "failed", error_message=str(e), supabase=supabase
            )
            return False

    def _get_cache_types_for_event(self, event_type: str) -> List[str]:
        """Map Square webhook event types to cache types that should be invalidated."""
        event_cache_mapping = {
            "catalog.version.updated": ["products"],
            "order.created": ["orders"],
            "order.updated": ["orders"],
            "order.fulfilled": ["orders"],
            "payment.created": ["payments"],
            "payment.updated": ["payments"],
            "customer.created": ["customers"],
            "customer.updated": ["customers"],
            "inventory.count.updated": [
                "products"
            ],  # Inventory affects product availability
        }

        return event_cache_mapping.get(event_type, [])

    async def _store_webhook_event(
        self, event_data: SquareWebhookEventCreate, supabase
    ) -> str:
        """Store webhook event in database."""
        try:
            result = (
                await supabase.table("square_webhook_events")
                .insert(
                    {
                        "user_id": event_data.user_id,
                        "event_id": event_data.event_id,
                        "event_type": event_data.event_type,
                        "merchant_id": event_data.merchant_id,
                        "payload": event_data.payload,
                        "signature_header": event_data.signature_header,
                        "status": "received",
                        "cache_invalidated": False,
                    }
                )
                .execute()
            )

            if result.data:
                return result.data[0]["id"]
            else:
                raise Exception("Failed to store webhook event")

        except Exception as e:
            logger.error(f"Error storing webhook event: {e}")
            raise

    async def _update_webhook_event_status(
        self,
        event_id: str,
        status: str,
        cache_invalidated: bool = False,
        error_message: Optional[str] = None,
        supabase=None,
    ) -> None:
        """Update webhook event processing status."""
        try:
            update_data = {
                "status": status,
                "processed_at": datetime.utcnow().isoformat(),
                "cache_invalidated": cache_invalidated,
            }

            if error_message:
                update_data["error_message"] = error_message

            await supabase.table("square_webhook_events").update(update_data).eq(
                "event_id", event_id
            ).execute()

        except Exception as e:
            logger.error(f"Error updating webhook event status: {e}")

    async def get_webhook_config(
        self, user_id: str, supabase
    ) -> Optional[Dict[str, Any]]:
        """Get webhook configuration for a user."""
        try:
            result = (
                await supabase.table("square_webhooks")
                .select("*")
                .eq("user_id", user_id)
                .execute()
            )

            if result.data:
                return result.data[0]
            return None

        except Exception as e:
            logger.error(f"Error getting webhook config: {e}")
            return None

    async def create_webhook_config(
        self, user_id: str, webhook_data: SquareWebhookCreate, supabase
    ) -> Dict[str, Any]:
        """Create webhook configuration for a user."""
        try:
            # Generate a signature key (in production, this would come from Square)
            signature_key = os.urandom(32).hex()

            config_data = {
                "user_id": user_id,
                "webhook_url": webhook_data.webhook_url,
                "signature_key": signature_key,
                "event_types": webhook_data.event_types,
                "status": "pending",
            }

            result = (
                await supabase.table("square_webhooks").insert(config_data).execute()
            )

            if result.data:
                return result.data[0]
            else:
                raise Exception("Failed to create webhook configuration")

        except Exception as e:
            logger.error(f"Error creating webhook config: {e}")
            raise

    async def register_webhook_with_square(
        self, config: SquareConfig, webhook_url: str, event_types: List[str]
    ) -> WebhookRegistrationResponse:
        """Register webhook with Square API."""
        try:
            base_url = self._get_base_url(config.environment)
            headers = self._get_headers(config.access_token)

            registration_data = {
                "webhook": {
                    "name": "Vertical Farm Webhook",
                    "event_types": event_types,
                    "notification_url": webhook_url,
                    "api_version": "2023-10-18",
                }
            }

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{base_url}/v2/webhooks/subscriptions",
                    headers=headers,
                    json=registration_data,
                    timeout=30.0,
                )

                if response.status_code == 200:
                    data = response.json()
                    webhook_data = data.get("webhook", {})

                    return WebhookRegistrationResponse(
                        webhook_id=webhook_data.get("id"),
                        notification_url=webhook_data.get("notification_url"),
                        event_types=webhook_data.get("event_types", []),
                        signature_key=webhook_data.get("signature_key"),
                        status="active",
                        created_at=datetime.utcnow(),
                    )
                else:
                    error_data = response.json()
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"Square API error: {error_data.get('errors', [])}",
                    )

        except Exception as e:
            logger.error(f"Error registering webhook with Square: {e}")
            raise

    async def invalidate_cache_manually(
        self,
        user_id: str,
        cache_types: List[str],
        reason: Optional[str] = None,
        supabase=None,
    ) -> CacheInvalidationResponse:
        """Manually invalidate specific cache types for a user."""
        try:
            invalidated_caches = []

            for cache_type in cache_types:
                if cache_type == "all":
                    # Invalidate all cache types
                    await self._invalidate_cache_for_user(user_id, None, supabase)
                    invalidated_caches = [
                        "locations",
                        "products",
                        "customers",
                        "orders",
                        "payments",
                    ]
                    break
                else:
                    # Invalidate specific cache type
                    await self._invalidate_cache_for_user(user_id, cache_type, supabase)
                    invalidated_caches.append(cache_type)

            # Log the manual invalidation
            await self._log_sync_operation(
                user_id,
                "manual_invalidation",
                "cache_invalidated",
                f"Manually invalidated caches: {', '.join(invalidated_caches)}. Reason: {reason or 'Manual request'}",
                supabase,
            )

            return CacheInvalidationResponse(
                success=True,
                invalidated_caches=invalidated_caches,
                message=f"Successfully invalidated {len(invalidated_caches)} cache types",
                timestamp=datetime.utcnow(),
            )

        except Exception as e:
            logger.error(f"Error invalidating cache manually: {e}")
            return CacheInvalidationResponse(
                success=False,
                invalidated_caches=[],
                message=f"Error invalidating cache: {str(e)}",
                timestamp=datetime.utcnow(),
            )

    def is_configured(self, config: Optional[SquareConfig] = None) -> bool:
        """Check if Square API is configured with user's credentials"""
        check_config = config or self.config
        return bool(
            check_config and check_config.access_token and check_config.application_id
        )

    def _get_base_url(self, environment: str) -> str:
        """Get the base URL for Square API based on environment"""
        if environment == "production":
            return "https://connect.squareup.com"
        else:
            return "https://connect.squareupsandbox.com"

    def _get_headers(self, access_token: str) -> Dict[str, str]:
        """Get headers for Square API requests"""
        return {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "Square-Version": "2024-12-18",  # Latest API version
        }

    async def get_user_configs(self, user_id: str, supabase) -> List[SquareConfig]:
        """Get all Square configurations for a user"""
        try:
            response = (
                await supabase.table("user_square_configs")
                .select("*")
                .eq("user_id", user_id)
                .execute()
            )

            configs = []
            for config_data in response.data:
                configs.append(SquareConfig(**config_data))

            return configs
        except Exception as e:
            logger.error(f"Error fetching user Square configs: {e}")
            raise HTTPException(
                status_code=500, detail="Failed to fetch Square configurations"
            )

    async def get_config_by_id(
        self, user_id: str, config_id: str, supabase
    ) -> Optional[SquareConfig]:
        """Get a specific Square configuration by ID"""
        try:
            response = (
                await supabase.table("user_square_configs")
                .select("*")
                .eq("user_id", user_id)
                .eq("id", config_id)
                .single()
                .execute()
            )

            if response.data:
                return SquareConfig(**response.data)
            return None
        except Exception as e:
            logger.error(f"Error fetching Square config {config_id}: {e}")
            return None

    async def create_config(
        self, user_id: str, config_data: SquareConfigCreate, supabase
    ) -> SquareConfig:
        """Create a new Square configuration for a user with automatic webhook registration"""
        try:
            # Prepare data for insertion
            insert_data = config_data.dict()
            insert_data["user_id"] = user_id

            response = (
                await supabase.table("user_square_configs")
                .insert(insert_data)
                .execute()
            )

            if response.data:
                config = SquareConfig(**response.data[0])

                # Automatically register webhook for real-time cache invalidation
                try:
                    webhook_url = f"{os.getenv('APP_BASE_URL', 'https://your-domain.com')}/api/v1/square/webhooks"
                    event_types = [
                        "catalog.version.updated",
                        "order.created",
                        "order.updated",
                        "order.fulfilled",
                        "payment.created",
                        "payment.updated",
                        "customer.created",
                        "customer.updated",
                        "inventory.count.updated",
                    ]

                    # Register webhook with Square
                    webhook_registration = await self.register_webhook_with_square(
                        config, webhook_url, event_types
                    )

                    # Store webhook config in database
                    webhook_config_data = SquareWebhookCreate(
                        webhook_url=webhook_url, event_types=event_types
                    )

                    webhook_config = await self.create_webhook_config(
                        user_id, webhook_config_data, supabase
                    )

                    # Update webhook config with Square's webhook ID and signature key
                    await supabase.table("square_webhooks").update(
                        {
                            "webhook_id": webhook_registration.webhook_id,
                            "signature_key": webhook_registration.signature_key,
                            "status": "active",
                        }
                    ).eq("user_id", user_id).execute()

                    # Update Square config with webhook status
                    await supabase.table("user_square_configs").update(
                        {
                            "webhook_status": "active",
                            "webhook_registered_at": datetime.utcnow().isoformat(),
                        }
                    ).eq("user_id", user_id).eq("id", config.id).execute()

                    logger.info(
                        f"Automatically registered webhook for user {user_id} with Square config {config.id}"
                    )

                except Exception as webhook_error:
                    # Log webhook registration failure but don't fail the config creation
                    logger.warning(
                        f"Failed to auto-register webhook for user {user_id}: {webhook_error}"
                    )

                    # Update Square config with failed webhook status
                    try:
                        await supabase.table("user_square_configs").update(
                            {
                                "webhook_status": "failed",
                                "sync_error": f"Webhook registration failed: {str(webhook_error)}",
                            }
                        ).eq("user_id", user_id).eq("id", config.id).execute()
                    except Exception as update_error:
                        logger.error(
                            f"Failed to update webhook status after error: {update_error}"
                        )

                return config
            else:
                raise HTTPException(
                    status_code=400, detail="Failed to create Square configuration"
                )

        except Exception as e:
            logger.error(f"Error creating Square config: {e}")
            if "duplicate key value violates unique constraint" in str(e):
                raise HTTPException(
                    status_code=400,
                    detail="A configuration with this name or application ID already exists",
                )
            raise HTTPException(
                status_code=500, detail="Failed to create Square configuration"
            )

    async def update_config(
        self, user_id: str, config_id: str, config_data: SquareConfigUpdate, supabase
    ) -> Optional[SquareConfig]:
        """Update an existing Square configuration"""
        try:
            # Only update non-None fields
            update_data = {k: v for k, v in config_data.dict().items() if v is not None}

            if not update_data:
                # If no fields to update, just return the existing config
                return await self.get_config_by_id(user_id, config_id, supabase)

            response = (
                await supabase.table("user_square_configs")
                .update(update_data)
                .eq("user_id", user_id)
                .eq("id", config_id)
                .execute()
            )

            if response.data:
                return SquareConfig(**response.data[0])
            return None

        except Exception as e:
            logger.error(f"Error updating Square config {config_id}: {e}")
            raise HTTPException(
                status_code=500, detail="Failed to update Square configuration"
            )

    async def delete_config(self, user_id: str, config_id: str, supabase) -> bool:
        """Delete a Square configuration"""
        try:
            response = (
                await supabase.table("user_square_configs")
                .delete()
                .eq("user_id", user_id)
                .eq("id", config_id)
                .execute()
            )

            return len(response.data) > 0

        except Exception as e:
            logger.error(f"Error deleting Square config {config_id}: {e}")
            raise HTTPException(
                status_code=500, detail="Failed to delete Square configuration"
            )

    async def test_connection(
        self, config: SquareConfig, user_id: Optional[str] = None, supabase=None
    ) -> SquareConnectionStatus:
        """Test connection to Square API with given configuration"""
        try:
            base_url = self._get_base_url(config.environment)
            headers = self._get_headers(config.access_token)

            async with httpx.AsyncClient() as client:
                # Test with a simple API call to get locations
                response = await client.get(f"{base_url}/v2/locations", headers=headers)

                if response.status_code == 200:
                    # Get webhook status if user_id and supabase are provided
                    webhook_status = None
                    webhook_registered = False
                    webhook_events_received = None
                    webhook_last_event = None

                    if user_id and supabase:
                        try:
                            # Check webhook configuration
                            webhook_result = (
                                await supabase.table("square_webhooks")
                                .select("*")
                                .eq("user_id", user_id)
                                .execute()
                            )
                            if webhook_result.data:
                                webhook_config = webhook_result.data[0]
                                webhook_status = webhook_config.get("status")
                                webhook_registered = webhook_status == "active"

                                # Get webhook event statistics
                                events_result = (
                                    await supabase.table("square_webhook_events")
                                    .select("*")
                                    .eq("user_id", user_id)
                                    .execute()
                                )
                                webhook_events_received = len(events_result.data)

                                if events_result.data:
                                    # Get last event timestamp
                                    sorted_events = sorted(
                                        events_result.data,
                                        key=lambda x: x["created_at"],
                                        reverse=True,
                                    )
                                    webhook_last_event = datetime.fromisoformat(
                                        sorted_events[0]["created_at"].replace(
                                            "Z", "+00:00"
                                        )
                                    )
                        except Exception as e:
                            logger.warning(f"Failed to get webhook status: {e}")

                    return SquareConnectionStatus(
                        connected=True,
                        environment=config.environment,
                        application_id=config.application_id,
                        last_test_at=datetime.utcnow(),
                        webhook_status=webhook_status,
                        webhook_registered=webhook_registered,
                        webhook_events_received=webhook_events_received,
                        webhook_last_event=webhook_last_event,
                    )
                else:
                    error_msg = f"API returned status {response.status_code}"
                    try:
                        error_data = response.json()
                        if "errors" in error_data:
                            error_msg = error_data["errors"][0].get("detail", error_msg)
                    except (ValueError, KeyError, IndexError):
                        pass  # JSON parsing or key access failed

                    return SquareConnectionStatus(
                        connected=False,
                        environment=config.environment,
                        application_id=config.application_id,
                        last_test_at=datetime.utcnow(),
                        error_message=error_msg,
                    )

        except Exception as e:
            logger.error(f"Error testing Square connection: {e}")
            return SquareConnectionStatus(
                connected=False,
                environment=config.environment,
                application_id=config.application_id,
                last_test_at=datetime.utcnow(),
                error_message=str(e),
            )

    async def get_locations(
        self, config: SquareConfig, user_id: Optional[str] = None, supabase=None
    ) -> List[SquareLocation]:
        """Get locations from Square API with caching"""
        # Try cache first if user_id and supabase are provided
        if user_id and supabase:
            try:
                cache_key = await self._get_cache_key(config)
                cached_data = await self._get_cache_entry(
                    user_id, "locations", cache_key, supabase
                )

                if cached_data:
                    # Convert cached data back to SquareLocation objects
                    locations = []
                    for location_data in cached_data.get("data", []):
                        location = SquareLocation(**location_data)
                        locations.append(location)

                    await self._log_sync_operation(
                        user_id,
                        "locations",
                        "cache_hit",
                        f"Retrieved {len(locations)} locations from cache",
                        supabase,
                    )
                    return locations
            except Exception as e:
                logger.warning(f"Cache retrieval failed for locations: {e}")
                # Continue to API call if cache fails

        try:
            base_url = self._get_base_url(config.environment)
            headers = self._get_headers(config.access_token)

            async with httpx.AsyncClient() as client:
                response = await client.get(f"{base_url}/v2/locations", headers=headers)

                if response.status_code == 200:
                    data = response.json()
                    locations = []

                    for location_data in data.get("locations", []):
                        location = SquareLocation(
                            id=location_data["id"],
                            name=location_data.get("name", ""),
                            address=location_data.get("address", {}).get(
                                "address_line_1"
                            ),
                            phone_number=location_data.get("phone_number"),
                            business_name=location_data.get("business_name"),
                            type=location_data.get("type"),
                            website_url=location_data.get("website_url"),
                            status=location_data.get("status", "ACTIVE"),
                        )
                        locations.append(location)

                    # Cache the results if user_id and supabase are provided
                    if user_id and supabase:
                        try:
                            cache_key = await self._get_cache_key(config)
                            # Convert to dict for caching
                            cache_data = [location.dict() for location in locations]
                            await self._set_cache_entry(
                                user_id,
                                "locations",
                                cache_key,
                                cache_data,
                                60,
                                supabase,
                            )  # 60 minutes TTL
                            await self._log_sync_operation(
                                user_id,
                                "locations",
                                "api_fetch",
                                f"Fetched and cached {len(locations)} locations",
                                supabase,
                            )
                        except Exception as e:
                            logger.warning(f"Failed to cache locations: {e}")

                    return locations
                else:
                    logger.error(
                        f"Square API error: {response.status_code} - {response.text}"
                    )
                    raise HTTPException(
                        status_code=response.status_code,
                        detail="Failed to fetch locations from Square",
                    )

        except httpx.RequestError as e:
            logger.error(f"Network error calling Square API: {e}")
            raise HTTPException(
                status_code=503, detail="Unable to connect to Square API"
            )
        except Exception as e:
            logger.error(f"Error fetching Square locations: {e}")
            raise HTTPException(status_code=500, detail="Failed to fetch locations")

    async def get_catalog_items(
        self, config: SquareConfig, user_id: Optional[str] = None, supabase=None
    ) -> List[SquareProduct]:
        """Get catalog items from Square API with caching support"""
        if not self.is_configured(config):
            logger.error("Square API not configured")
            return []

        # Try cache first if user_id and supabase are provided
        if user_id and supabase:
            cache_key = await self._get_cache_key(config, "catalog_items")
            cached_data = await self._get_cache_entry(
                user_id, "products", cache_key, supabase
            )

            if cached_data:
                logger.info(
                    f"Retrieved {len(cached_data['data'])} catalog items from cache for user {user_id}"
                )
                return [SquareProduct(**item) for item in cached_data["data"]]

        # Fetch from Square API
        try:
            base_url = self._get_base_url(config.environment)
            headers = self._get_headers(config.access_token)

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{base_url}/v2/catalog/search",
                    headers=headers,
                    json={"object_types": ["ITEM"], "include_deleted_objects": False},
                )

                if response.status_code == 200:
                    data = response.json()
                    products = []

                    for item_data in data.get("objects", []):
                        if item_data.get("type") == "ITEM":
                            item_detail = item_data.get("item_data", {})

                            # Get price from first variation if available
                            price_money = None
                            variations = item_detail.get("variations", [])
                            if variations:
                                variation_data = variations[0].get(
                                    "item_variation_data", {}
                                )
                                price_money = variation_data.get("price_money")

                            product = SquareProduct(
                                id=item_data["id"],
                                name=item_detail.get("name", ""),
                                description=item_detail.get("description"),
                                category_id=item_detail.get("category_id"),
                                price_money=price_money,
                                variations=variations,
                                is_deleted=item_data.get("is_deleted", False),
                            )
                            products.append(product)

                    # Cache the results if user_id and supabase are provided
                    if user_id and supabase and products:
                        try:
                            # Convert to dict for caching
                            cache_data = [product.dict() for product in products]
                            await self._set_cache_entry(
                                user_id, "products", cache_key, cache_data, 60, supabase
                            )  # 1 hour TTL
                            await self._log_sync_operation(
                                user_id,
                                "products",
                                "api_fetch",
                                f"Fetched and cached {len(products)} catalog items",
                                supabase,
                            )
                        except Exception as e:
                            logger.warning(f"Failed to cache products: {e}")

                    return products
                else:
                    logger.error(
                        f"Square API error: {response.status_code} - {response.text}"
                    )
                    raise HTTPException(
                        status_code=response.status_code,
                        detail="Failed to fetch products from Square",
                    )

        except httpx.RequestError as e:
            logger.error(f"Network error calling Square API: {e}")
            raise HTTPException(
                status_code=503, detail="Unable to connect to Square API"
            )
        except Exception as e:
            logger.error(f"Error fetching Square products: {e}")
            raise HTTPException(status_code=500, detail="Failed to fetch products")

    async def get_customers(
        self, config: SquareConfig, user_id: Optional[str] = None, supabase=None
    ) -> List[SquareCustomer]:
        """Get customers from Square API with caching support"""
        if not self.is_configured(config):
            logger.error("Square API not configured")
            return []

        # Try cache first if user_id and supabase are provided
        if user_id and supabase:
            cache_key = await self._get_cache_key(config, "customers")
            cached_data = await self._get_cache_entry(
                user_id, "customers", cache_key, supabase
            )

            if cached_data:
                logger.info(
                    f"Retrieved {len(cached_data['data'])} customers from cache for user {user_id}"
                )
                return [SquareCustomer(**item) for item in cached_data["data"]]

        # Fetch from Square API
        try:
            base_url = self._get_base_url(config.environment)
            headers = self._get_headers(config.access_token)

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{base_url}/v2/customers/search",
                    headers=headers,
                    json={
                        "limit": 100,
                        "query": {"sort": {"field": "CREATED_AT", "order": "DESC"}},
                    },
                )

                if response.status_code == 200:
                    data = response.json()
                    customers = []

                    for customer_data in data.get("customers", []):
                        customer = SquareCustomer(
                            id=customer_data["id"],
                            given_name=customer_data.get("given_name"),
                            family_name=customer_data.get("family_name"),
                            email_address=customer_data.get("email_address"),
                            phone_number=customer_data.get("phone_number"),
                            company_name=customer_data.get("company_name"),
                            created_at=(
                                datetime.fromisoformat(
                                    customer_data["created_at"].replace("Z", "+00:00")
                                )
                                if customer_data.get("created_at")
                                else None
                            ),
                            updated_at=(
                                datetime.fromisoformat(
                                    customer_data["updated_at"].replace("Z", "+00:00")
                                )
                                if customer_data.get("updated_at")
                                else None
                            ),
                        )
                        customers.append(customer)

                    # Cache the results if user_id and supabase are provided
                    if user_id and supabase:
                        try:
                            cache_key = await self._get_cache_key(config, "customers")
                            # Convert to dict for caching
                            cache_data = [customer.dict() for customer in customers]
                            await self._set_cache_entry(
                                user_id,
                                "customers",
                                cache_key,
                                cache_data,
                                60,
                                supabase,
                            )  # 60 minutes TTL
                            await self._log_sync_operation(
                                user_id,
                                "customers",
                                "api_fetch",
                                f"Fetched and cached {len(customers)} customers",
                                supabase,
                            )
                        except Exception as e:
                            logger.warning(f"Failed to cache customers: {e}")

                    return customers
                else:
                    logger.error(
                        f"Square API error: {response.status_code} - {response.text}"
                    )
                    raise HTTPException(
                        status_code=response.status_code,
                        detail="Failed to fetch customers from Square",
                    )

        except httpx.RequestError as e:
            logger.error(f"Network error calling Square API: {e}")
            raise HTTPException(
                status_code=503, detail="Unable to connect to Square API"
            )
        except Exception as e:
            logger.error(f"Error fetching Square customers: {e}")
            raise HTTPException(status_code=500, detail="Failed to fetch customers")

    async def get_orders(
        self,
        config: SquareConfig,
        location_id: Optional[str] = None,
        user_id: Optional[str] = None,
        supabase=None,
    ) -> List[SquareOrder]:
        """Get orders from Square API with caching support"""
        if not self.is_configured(config):
            logger.error("Square API not configured")
            return []

        # Try cache first if user_id and supabase are provided
        if user_id and supabase:
            cache_key = await self._get_cache_key(
                config, f"orders_{location_id}" if location_id else "orders"
            )
            cached_data = await self._get_cache_entry(
                user_id, "orders", cache_key, supabase
            )

            if cached_data:
                logger.info(
                    f"Retrieved {len(cached_data['data'])} orders from cache for user {user_id}"
                )
                return [SquareOrder(**item) for item in cached_data["data"]]

        # Fetch from Square API
        try:
            base_url = self._get_base_url(config.environment)
            headers = self._get_headers(config.access_token)

            # Build search query
            search_query = {
                "limit": 100,
                "query": {"sort": {"sort_field": "CREATED_AT", "sort_order": "DESC"}},
            }

            if location_id:
                search_query["location_ids"] = [location_id]

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{base_url}/v2/orders/search", headers=headers, json=search_query
                )

                if response.status_code == 200:
                    data = response.json()
                    orders = []

                    for order_data in data.get("orders", []):
                        order = SquareOrder(
                            id=order_data["id"],
                            location_id=order_data["location_id"],
                            state=order_data.get("state", "UNKNOWN"),
                            total_money=order_data.get("total_money"),
                            created_at=(
                                datetime.fromisoformat(
                                    order_data["created_at"].replace("Z", "+00:00")
                                )
                                if order_data.get("created_at")
                                else None
                            ),
                            updated_at=(
                                datetime.fromisoformat(
                                    order_data["updated_at"].replace("Z", "+00:00")
                                )
                                if order_data.get("updated_at")
                                else None
                            ),
                            line_items=order_data.get("line_items", []),
                        )
                        orders.append(order)

                    # Cache the results if user_id and supabase are provided
                    if user_id and supabase:
                        try:
                            cache_key = await self._get_cache_key(
                                config,
                                f"orders_{location_id}" if location_id else "orders",
                            )
                            # Convert to dict for caching
                            cache_data = [order.dict() for order in orders]
                            await self._set_cache_entry(
                                user_id, "orders", cache_key, cache_data, 30, supabase
                            )  # 30 minutes TTL for orders
                            await self._log_sync_operation(
                                user_id,
                                "orders",
                                "api_fetch",
                                f"Fetched and cached {len(orders)} orders",
                                supabase,
                            )
                        except Exception as e:
                            logger.warning(f"Failed to cache orders: {e}")

                    return orders
                else:
                    logger.error(
                        f"Square API error: {response.status_code} - {response.text}"
                    )
                    raise HTTPException(
                        status_code=response.status_code,
                        detail="Failed to fetch orders from Square",
                    )

        except httpx.RequestError as e:
            logger.error(f"Network error calling Square API: {e}")
            raise HTTPException(
                status_code=503, detail="Unable to connect to Square API"
            )
        except Exception as e:
            logger.error(f"Error fetching Square orders: {e}")
            raise HTTPException(status_code=500, detail="Failed to fetch orders")

    async def get_payments(
        self,
        config: SquareConfig,
        location_id: Optional[str] = None,
        user_id: Optional[str] = None,
        supabase=None,
    ) -> List[SquarePayment]:
        """Get payments from Square API with caching support"""
        if not self.is_configured(config):
            logger.error("Square API not configured")
            return []

        # Try cache first if user_id and supabase are provided
        if user_id and supabase:
            cache_key = await self._get_cache_key(
                config, f"payments_{location_id}" if location_id else "payments"
            )
            cached_data = await self._get_cache_entry(
                user_id, "payments", cache_key, supabase
            )

            if cached_data:
                logger.info(
                    f"Retrieved {len(cached_data['data'])} payments from cache for user {user_id}"
                )
                return [SquarePayment(**item) for item in cached_data["data"]]

        # Fetch from Square API
        try:
            base_url = self._get_base_url(config.environment)
            headers = self._get_headers(config.access_token)

            # Build query parameters
            params = {"sort_order": "DESC", "limit": 100}

            if location_id:
                params["location_id"] = location_id

            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{base_url}/v2/payments", headers=headers, params=params
                )

                if response.status_code == 200:
                    data = response.json()
                    payments = []

                    for payment_data in data.get("payments", []):
                        payment = SquarePayment(
                            id=payment_data["id"],
                            order_id=payment_data.get("order_id"),
                            amount_money=payment_data["amount_money"],
                            status=payment_data.get("status", "UNKNOWN"),
                            source_type=payment_data.get("source_type"),
                            card_details=payment_data.get("card_details"),
                            created_at=(
                                datetime.fromisoformat(
                                    payment_data["created_at"].replace("Z", "+00:00")
                                )
                                if payment_data.get("created_at")
                                else None
                            ),
                        )
                        payments.append(payment)

                    # Cache the results if user_id and supabase are provided
                    if user_id and supabase:
                        try:
                            cache_key = await self._get_cache_key(
                                config,
                                (
                                    f"payments_{location_id}"
                                    if location_id
                                    else "payments"
                                ),
                            )
                            # Convert to dict for caching
                            cache_data = [payment.dict() for payment in payments]
                            await self._set_cache_entry(
                                user_id, "payments", cache_key, cache_data, 30, supabase
                            )  # 30 minutes TTL for payments
                            await self._log_sync_operation(
                                user_id,
                                "payments",
                                "api_fetch",
                                f"Fetched and cached {len(payments)} payments",
                                supabase,
                            )
                        except Exception as e:
                            logger.warning(f"Failed to cache payments: {e}")

                    return payments
                else:
                    logger.error(
                        f"Square API error: {response.status_code} - {response.text}"
                    )
                    raise HTTPException(
                        status_code=response.status_code,
                        detail="Failed to fetch payments from Square",
                    )

        except httpx.RequestError as e:
            logger.error(f"Network error calling Square API: {e}")
            raise HTTPException(
                status_code=503, detail="Unable to connect to Square API"
            )
        except Exception as e:
            logger.error(f"Error fetching Square payments: {e}")
            raise HTTPException(status_code=500, detail="Failed to fetch payments")

    async def get_inventory_counts(
        self, config: SquareConfig, location_ids: Optional[List[str]] = None
    ) -> List[SquareInventoryCount]:
        """Get inventory counts from Square API"""
        try:
            base_url = self._get_base_url(config.environment)
            headers = self._get_headers(config.access_token)

            # Build query parameters
            params = {}
            if location_ids:
                params["location_ids"] = ",".join(location_ids)

            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{base_url}/v2/inventory/counts/batch-retrieve",
                    headers=headers,
                    params=params,
                )

                if response.status_code == 200:
                    data = response.json()
                    inventory_counts = []

                    for count_data in data.get("counts", []):
                        inventory_count = SquareInventoryCount(
                            catalog_object_id=count_data.get("catalog_object_id", ""),
                            catalog_object_type=count_data.get(
                                "catalog_object_type", ""
                            ),
                            state=count_data.get("state", ""),
                            location_id=count_data.get("location_id", ""),
                            quantity=count_data.get("quantity"),
                            calculated_at=(
                                datetime.fromisoformat(
                                    count_data["calculated_at"].replace("Z", "+00:00")
                                )
                                if count_data.get("calculated_at")
                                else None
                            ),
                        )
                        inventory_counts.append(inventory_count)

                    return inventory_counts
                else:
                    logger.error(
                        f"Square API error: {response.status_code} - {response.text}"
                    )
                    raise HTTPException(
                        status_code=response.status_code,
                        detail="Failed to fetch inventory from Square",
                    )

        except httpx.RequestError as e:
            logger.error(f"Network error calling Square API: {e}")
            raise HTTPException(
                status_code=503, detail="Unable to connect to Square API"
            )
        except Exception as e:
            logger.error(f"Error fetching Square inventory: {e}")
            raise HTTPException(status_code=500, detail="Failed to fetch inventory")

    async def get_refunds(
        self, config: SquareConfig, location_id: Optional[str] = None
    ) -> List[SquareRefund]:
        """Get refunds from Square API"""
        try:
            base_url = self._get_base_url(config.environment)
            headers = self._get_headers(config.access_token)

            # Build query parameters
            params = {"sort_order": "DESC", "limit": 100}

            if location_id:
                params["location_id"] = location_id

            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{base_url}/v2/refunds", headers=headers, params=params
                )

                if response.status_code == 200:
                    data = response.json()
                    refunds = []

                    for refund_data in data.get("refunds", []):
                        refund = SquareRefund(
                            id=refund_data["id"],
                            location_id=refund_data["location_id"],
                            amount_money=refund_data["amount_money"],
                            reason=refund_data.get("reason"),
                            status=refund_data.get("status", "UNKNOWN"),
                            processing_fee=refund_data.get("processing_fee"),
                            payment_id=refund_data["payment_id"],
                            order_id=refund_data.get("order_id"),
                            created_at=(
                                datetime.fromisoformat(
                                    refund_data["created_at"].replace("Z", "+00:00")
                                )
                                if refund_data.get("created_at")
                                else None
                            ),
                            updated_at=(
                                datetime.fromisoformat(
                                    refund_data["updated_at"].replace("Z", "+00:00")
                                )
                                if refund_data.get("updated_at")
                                else None
                            ),
                        )
                        refunds.append(refund)

                    return refunds
                else:
                    logger.error(
                        f"Square API error: {response.status_code} - {response.text}"
                    )
                    raise HTTPException(
                        status_code=response.status_code,
                        detail="Failed to fetch refunds from Square",
                    )

        except httpx.RequestError as e:
            logger.error(f"Network error calling Square API: {e}")
            raise HTTPException(
                status_code=503, detail="Unable to connect to Square API"
            )
        except Exception as e:
            logger.error(f"Error fetching Square refunds: {e}")
            raise HTTPException(status_code=500, detail="Failed to fetch refunds")

    async def get_disputes(self, config: SquareConfig) -> List[SquareDispute]:
        """Get disputes from Square API"""
        try:
            base_url = self._get_base_url(config.environment)
            headers = self._get_headers(config.access_token)

            async with httpx.AsyncClient() as client:
                response = await client.get(f"{base_url}/v2/disputes", headers=headers)

                if response.status_code == 200:
                    data = response.json()
                    disputes = []

                    for dispute_data in data.get("disputes", []):
                        dispute = SquareDispute(
                            id=dispute_data["id"],
                            amount_money=dispute_data.get("amount_money"),
                            reason=dispute_data.get("reason", "UNKNOWN"),
                            state=dispute_data.get("state", "UNKNOWN"),
                            due_at=(
                                datetime.fromisoformat(
                                    dispute_data["due_at"].replace("Z", "+00:00")
                                )
                                if dispute_data.get("due_at")
                                else None
                            ),
                            disputed_payment=dispute_data.get("disputed_payment"),
                            evidence_ids=dispute_data.get("evidence_ids", []),
                            card_brand=dispute_data.get("card_brand"),
                            created_at=(
                                datetime.fromisoformat(
                                    dispute_data["created_at"].replace("Z", "+00:00")
                                )
                                if dispute_data.get("created_at")
                                else None
                            ),
                            updated_at=(
                                datetime.fromisoformat(
                                    dispute_data["updated_at"].replace("Z", "+00:00")
                                )
                                if dispute_data.get("updated_at")
                                else None
                            ),
                        )
                        disputes.append(dispute)

                    return disputes
                else:
                    logger.error(
                        f"Square API error: {response.status_code} - {response.text}"
                    )
                    raise HTTPException(
                        status_code=response.status_code,
                        detail="Failed to fetch disputes from Square",
                    )

        except httpx.RequestError as e:
            logger.error(f"Network error calling Square API: {e}")
            raise HTTPException(
                status_code=503, detail="Unable to connect to Square API"
            )
        except Exception as e:
            logger.error(f"Error fetching Square disputes: {e}")
            raise HTTPException(status_code=500, detail="Failed to fetch disputes")

    async def get_subscriptions(
        self, config: SquareConfig, location_id: Optional[str] = None
    ) -> List[SquareSubscription]:
        """Get subscriptions from Square API"""
        try:
            base_url = self._get_base_url(config.environment)
            headers = self._get_headers(config.access_token)

            # Build query parameters
            params = {}
            if location_id:
                params["location_id"] = location_id

            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{base_url}/v2/subscriptions", headers=headers, params=params
                )

                if response.status_code == 200:
                    data = response.json()
                    subscriptions = []

                    for subscription_data in data.get("subscriptions", []):
                        subscription = SquareSubscription(
                            id=subscription_data["id"],
                            location_id=subscription_data["location_id"],
                            plan_id=subscription_data["plan_id"],
                            customer_id=subscription_data["customer_id"],
                            start_date=subscription_data["start_date"],
                            status=subscription_data.get("status", "UNKNOWN"),
                            tax_percentage=subscription_data.get("tax_percentage"),
                            invoice_request_method=subscription_data.get(
                                "invoice_request_method"
                            ),
                            charge_through_date=subscription_data.get(
                                "charge_through_date"
                            ),
                            charged_through_date=subscription_data.get(
                                "charged_through_date"
                            ),
                            paid_until_date=subscription_data.get("paid_until_date"),
                            created_at=(
                                datetime.fromisoformat(
                                    subscription_data["created_at"].replace(
                                        "Z", "+00:00"
                                    )
                                )
                                if subscription_data.get("created_at")
                                else None
                            ),
                            timezone=subscription_data.get("timezone"),
                        )
                        subscriptions.append(subscription)

                    return subscriptions
                else:
                    logger.error(
                        f"Square API error: {response.status_code} - {response.text}"
                    )
                    raise HTTPException(
                        status_code=response.status_code,
                        detail="Failed to fetch subscriptions from Square",
                    )

        except httpx.RequestError as e:
            logger.error(f"Network error calling Square API: {e}")
            raise HTTPException(
                status_code=503, detail="Unable to connect to Square API"
            )
        except Exception as e:
            logger.error(f"Error fetching Square subscriptions: {e}")
            raise HTTPException(status_code=500, detail="Failed to fetch subscriptions")

    async def get_invoices(
        self, config: SquareConfig, location_id: Optional[str] = None
    ) -> List[SquareInvoice]:
        """Get invoices from Square API"""
        try:
            base_url = self._get_base_url(config.environment)
            headers = self._get_headers(config.access_token)

            # Build search query
            search_query = {"limit": 100}

            if location_id:
                search_query["location_ids"] = [location_id]

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{base_url}/v2/invoices/search",
                    headers=headers,
                    json={"query": search_query},
                )

                if response.status_code == 200:
                    data = response.json()
                    invoices = []

                    for invoice_data in data.get("invoices", []):
                        invoice = SquareInvoice(
                            id=invoice_data["id"],
                            version=invoice_data["version"],
                            location_id=invoice_data["location_id"],
                            order_id=invoice_data["order_id"],
                            primary_recipient=invoice_data["primary_recipient"],
                            payment_requests=invoice_data.get("payment_requests", []),
                            delivery_method=invoice_data["delivery_method"],
                            invoice_number=invoice_data.get("invoice_number"),
                            title=invoice_data.get("title"),
                            description=invoice_data.get("description"),
                            scheduled_at=(
                                datetime.fromisoformat(
                                    invoice_data["scheduled_at"].replace("Z", "+00:00")
                                )
                                if invoice_data.get("scheduled_at")
                                else None
                            ),
                            public_url=invoice_data.get("public_url"),
                            status=invoice_data.get("status", "UNKNOWN"),
                            timezone=invoice_data.get("timezone"),
                            created_at=(
                                datetime.fromisoformat(
                                    invoice_data["created_at"].replace("Z", "+00:00")
                                )
                                if invoice_data.get("created_at")
                                else None
                            ),
                            updated_at=(
                                datetime.fromisoformat(
                                    invoice_data["updated_at"].replace("Z", "+00:00")
                                )
                                if invoice_data.get("updated_at")
                                else None
                            ),
                        )
                        invoices.append(invoice)

                    return invoices
                else:
                    logger.error(
                        f"Square API error: {response.status_code} - {response.text}"
                    )
                    raise HTTPException(
                        status_code=response.status_code,
                        detail="Failed to fetch invoices from Square",
                    )

        except httpx.RequestError as e:
            logger.error(f"Network error calling Square API: {e}")
            raise HTTPException(
                status_code=503, detail="Unable to connect to Square API"
            )
        except Exception as e:
            logger.error(f"Error fetching Square invoices: {e}")
            raise HTTPException(status_code=500, detail="Failed to fetch invoices")

    async def get_team_members(self, config: SquareConfig) -> List[SquareTeamMember]:
        """Get team members from Square API"""
        try:
            base_url = self._get_base_url(config.environment)
            headers = self._get_headers(config.access_token)

            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{base_url}/v2/team-members", headers=headers
                )

                if response.status_code == 200:
                    data = response.json()
                    team_members = []

                    for member_data in data.get("team_members", []):
                        team_member = SquareTeamMember(
                            id=member_data["id"],
                            reference_id=member_data.get("reference_id"),
                            is_owner=member_data.get("is_owner", False),
                            status=member_data.get("status", "UNKNOWN"),
                            given_name=member_data.get("given_name"),
                            family_name=member_data.get("family_name"),
                            email_address=member_data.get("email_address"),
                            phone_number=member_data.get("phone_number"),
                            created_at=(
                                datetime.fromisoformat(
                                    member_data["created_at"].replace("Z", "+00:00")
                                )
                                if member_data.get("created_at")
                                else None
                            ),
                            updated_at=(
                                datetime.fromisoformat(
                                    member_data["updated_at"].replace("Z", "+00:00")
                                )
                                if member_data.get("updated_at")
                                else None
                            ),
                            assigned_locations=member_data.get("assigned_locations"),
                        )
                        team_members.append(team_member)

                    return team_members
                else:
                    logger.error(
                        f"Square API error: {response.status_code} - {response.text}"
                    )
                    raise HTTPException(
                        status_code=response.status_code,
                        detail="Failed to fetch team members from Square",
                    )

        except httpx.RequestError as e:
            logger.error(f"Network error calling Square API: {e}")
            raise HTTPException(
                status_code=503, detail="Unable to connect to Square API"
            )
        except Exception as e:
            logger.error(f"Error fetching Square team members: {e}")
            raise HTTPException(status_code=500, detail="Failed to fetch team members")

    async def get_labor(
        self, config: SquareConfig, location_id: Optional[str] = None
    ) -> List[SquareLabor]:
        """Get labor/timecard data from Square API"""
        try:
            base_url = self._get_base_url(config.environment)
            headers = self._get_headers(config.access_token)

            # Build search query
            search_query = {"limit": 100, "query": {"filter": {}}}

            if location_id:
                search_query["query"]["filter"]["location_ids"] = [location_id]

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{base_url}/v2/labor/shifts/search",
                    headers=headers,
                    json=search_query,
                )

                if response.status_code == 200:
                    data = response.json()
                    labor_shifts = []

                    for shift_data in data.get("shifts", []):
                        labor = SquareLabor(
                            id=shift_data["id"],
                            employee_id=shift_data["employee_id"],
                            location_id=shift_data.get("location_id"),
                            start_at=(
                                datetime.fromisoformat(
                                    shift_data["start_at"].replace("Z", "+00:00")
                                )
                                if shift_data.get("start_at")
                                else None
                            ),
                            end_at=(
                                datetime.fromisoformat(
                                    shift_data["end_at"].replace("Z", "+00:00")
                                )
                                if shift_data.get("end_at")
                                else None
                            ),
                            wage=(
                                SquareWage(**shift_data["wage"])
                                if shift_data.get("wage")
                                else None
                            ),
                            teamMember_id=shift_data.get("team_member_id"),
                            declared_cash_tip_money=shift_data.get(
                                "declared_cash_tip_money"
                            ),
                            version=shift_data.get("version"),
                            created_at=(
                                datetime.fromisoformat(
                                    shift_data["created_at"].replace("Z", "+00:00")
                                )
                                if shift_data.get("created_at")
                                else None
                            ),
                            updated_at=(
                                datetime.fromisoformat(
                                    shift_data["updated_at"].replace("Z", "+00:00")
                                )
                                if shift_data.get("updated_at")
                                else None
                            ),
                        )
                        labor_shifts.append(labor)

                    return labor_shifts
                else:
                    logger.error(
                        f"Square API error: {response.status_code} - {response.text}"
                    )
                    raise HTTPException(
                        status_code=response.status_code,
                        detail="Failed to fetch labor data from Square",
                    )

        except httpx.RequestError as e:
            logger.error(f"Network error calling Square API: {e}")
            raise HTTPException(
                status_code=503, detail="Unable to connect to Square API"
            )
        except Exception as e:
            logger.error(f"Error fetching Square labor data: {e}")
            raise HTTPException(status_code=500, detail="Failed to fetch labor data")

    async def get_merchants(self, config: SquareConfig) -> List[SquareMerchant]:
        """Get merchant information from Square API"""
        try:
            base_url = self._get_base_url(config.environment)
            headers = self._get_headers(config.access_token)

            async with httpx.AsyncClient() as client:
                response = await client.get(f"{base_url}/v2/merchants", headers=headers)

                if response.status_code == 200:
                    data = response.json()
                    merchants = []

                    for merchant_data in data.get("merchant", []):
                        merchant = SquareMerchant(
                            id=merchant_data["id"],
                            business_name=merchant_data.get("business_name"),
                            country=merchant_data["country"],
                            language_code=merchant_data["language_code"],
                            currency=merchant_data["currency"],
                            status=merchant_data.get("status", "UNKNOWN"),
                            main_location_id=merchant_data.get("main_location_id"),
                            created_at=(
                                datetime.fromisoformat(
                                    merchant_data["created_at"].replace("Z", "+00:00")
                                )
                                if merchant_data.get("created_at")
                                else None
                            ),
                        )
                        merchants.append(merchant)

                    return merchants
                else:
                    logger.error(
                        f"Square API error: {response.status_code} - {response.text}"
                    )
                    raise HTTPException(
                        status_code=response.status_code,
                        detail="Failed to fetch merchants from Square",
                    )

        except httpx.RequestError as e:
            logger.error(f"Network error calling Square API: {e}")
            raise HTTPException(
                status_code=503, detail="Unable to connect to Square API"
            )
        except Exception as e:
            logger.error(f"Error fetching Square merchants: {e}")
            raise HTTPException(status_code=500, detail="Failed to fetch merchants")

    async def get_payouts(
        self, config: SquareConfig, location_id: Optional[str] = None
    ) -> List[SquarePayout]:
        """Get payout information from Square API"""
        try:
            base_url = self._get_base_url(config.environment)
            headers = self._get_headers(config.access_token)

            # Build query parameters
            params = {"sort_order": "DESC", "limit": 100}

            if location_id:
                params["location_id"] = location_id

            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{base_url}/v2/payouts", headers=headers, params=params
                )

                if response.status_code == 200:
                    data = response.json()
                    payouts = []

                    for payout_data in data.get("payouts", []):
                        payout = SquarePayout(
                            id=payout_data["id"],
                            status=payout_data.get("status", "UNKNOWN"),
                            location_id=payout_data["location_id"],
                            created_at=(
                                datetime.fromisoformat(
                                    payout_data["created_at"].replace("Z", "+00:00")
                                )
                                if payout_data.get("created_at")
                                else None
                            ),
                            updated_at=(
                                datetime.fromisoformat(
                                    payout_data["updated_at"].replace("Z", "+00:00")
                                )
                                if payout_data.get("updated_at")
                                else None
                            ),
                            amount_money=payout_data.get("amount_money"),
                            destination=payout_data.get("destination"),
                            version=payout_data.get("version"),
                            type=payout_data.get("type"),
                            payout_fee=payout_data.get("payout_fee"),
                            arrival_date=payout_data.get("arrival_date"),
                        )
                        payouts.append(payout)

                    return payouts
                else:
                    logger.error(
                        f"Square API error: {response.status_code} - {response.text}"
                    )
                    raise HTTPException(
                        status_code=response.status_code,
                        detail="Failed to fetch payouts from Square",
                    )

        except httpx.RequestError as e:
            logger.error(f"Network error calling Square API: {e}")
            raise HTTPException(
                status_code=503, detail="Unable to connect to Square API"
            )
        except Exception as e:
            logger.error(f"Error fetching Square payouts: {e}")
            raise HTTPException(status_code=500, detail="Failed to fetch payouts")


# Create service instance
square_service = SquareService()

# API Endpoints


# Webhook endpoints
@router.post("/webhooks", status_code=200)
async def receive_square_webhook(
    request: Request, db=Depends(get_async_supabase_client)
):
    """Receive and process Square webhook events."""
    try:
        # Get raw body and signature header
        body = await request.body()
        signature = request.headers.get("x-square-signature", "")

        if not signature:
            raise HTTPException(status_code=400, detail="Missing webhook signature")

        # Parse payload
        payload_str = body.decode("utf-8")
        payload_data = json.loads(payload_str)
        payload = SquareWebhookPayload(**payload_data)

        # Find user by merchant_id (you may need to adjust this logic)
        # For now, we'll need to look up the user based on their Square config
        user_result = (
            await db.table("user_square_configs")
            .select("user_id")
            .eq("merchant_id", payload.merchant_id)
            .execute()
        )

        if not user_result.data:
            logger.warning(f"No user found for merchant_id: {payload.merchant_id}")
            return {"status": "ignored", "reason": "merchant not found"}

        user_id = user_result.data[0]["user_id"]

        # Get webhook config for signature verification
        service = SquareService()
        webhook_config = await service.get_webhook_config(user_id, db)

        if not webhook_config:
            logger.warning(f"No webhook config found for user: {user_id}")
            return {"status": "ignored", "reason": "webhook not configured"}

        # Verify signature
        signature_valid = await service.verify_webhook_signature(
            payload_str, signature, webhook_config["signature_key"]
        )

        if not signature_valid:
            logger.error(f"Invalid webhook signature for user: {user_id}")
            raise HTTPException(status_code=401, detail="Invalid webhook signature")

        # Process the webhook event
        success = await service.process_webhook_event(user_id, payload, signature, db)

        if success:
            return {"status": "processed"}
        else:
            return {"status": "failed"}

    except Exception as e:
        logger.error(f"Error processing webhook: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/webhooks/register", response_model=WebhookRegistrationResponse)
async def register_webhook(
    webhook_data: WebhookRegistrationRequest,
    config_id: str = Query(..., description="Square configuration ID"),
    current_user: User = Depends(get_current_user),
    db=Depends(get_async_rls_client),
):
    """Register a webhook with Square and store configuration."""
    try:
        service = SquareService()

        # Get user's Square config
        config = await service.get_config_by_id(current_user.id, config_id, db)
        if not config:
            raise HTTPException(
                status_code=404, detail="Square configuration not found"
            )

        # Register webhook with Square
        registration_response = await service.register_webhook_with_square(
            config, webhook_data.notification_url, webhook_data.event_types
        )

        # Store webhook config in database
        webhook_config_data = SquareWebhookCreate(
            webhook_url=webhook_data.notification_url,
            event_types=webhook_data.event_types,
        )

        webhook_config = await service.create_webhook_config(
            current_user.id, webhook_config_data, db
        )

        # Update webhook config with Square's webhook ID and signature key
        await db.table("square_webhooks").update(
            {
                "webhook_id": registration_response.webhook_id,
                "signature_key": registration_response.signature_key,
                "status": "active",
            }
        ).eq("user_id", current_user.id).execute()

        return registration_response

    except Exception as e:
        logger.error(f"Error registering webhook: {e}")
        raise HTTPException(status_code=500, detail="Failed to register webhook")


@router.get("/webhooks/config", response_model=SquareWebhookResponse)
async def get_webhook_config(
    current_user: User = Depends(get_current_user), db=Depends(get_async_rls_client)
):
    """Get current webhook configuration for the user."""
    try:
        service = SquareService()
        webhook_config = await service.get_webhook_config(current_user.id, db)

        if not webhook_config:
            raise HTTPException(
                status_code=404, detail="Webhook configuration not found"
            )

        return SquareWebhookResponse(**webhook_config)

    except Exception as e:
        logger.error(f"Error getting webhook config: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to get webhook configuration"
        )


@router.post("/webhooks/test")
async def test_webhook(
    current_user: User = Depends(get_current_user), db=Depends(get_async_rls_client)
):
    """Test webhook endpoint by sending a test event."""
    try:
        # This would typically trigger a test webhook from Square
        # For now, we'll just return a success message
        return {"status": "test webhook functionality not implemented yet"}

    except Exception as e:
        logger.error(f"Error testing webhook: {e}")
        raise HTTPException(status_code=500, detail="Failed to test webhook")


@router.post("/cache/invalidate", response_model=CacheInvalidationResponse)
async def invalidate_cache(
    request: CacheInvalidationRequest,
    current_user: User = Depends(get_current_user),
    db=Depends(get_async_rls_client),
):
    """Manually invalidate cache for specific data types."""
    try:
        service = SquareService()
        result = await service.invalidate_cache_manually(
            current_user.id, request.cache_types, request.reason, db
        )

        return result

    except Exception as e:
        logger.error(f"Error invalidating cache: {e}")
        raise HTTPException(status_code=500, detail="Failed to invalidate cache")


@router.get("/webhooks/events", response_model=List[SquareWebhookEventResponse])
async def get_webhook_events(
    limit: int = Query(50, ge=1, le=100, description="Number of events to retrieve"),
    offset: int = Query(0, ge=0, description="Number of events to skip"),
    current_user: User = Depends(get_current_user),
    db=Depends(get_async_rls_client),
):
    """Get recent webhook events for the user."""
    try:
        result = (
            await db.table("square_webhook_events")
            .select("*")
            .eq("user_id", current_user.id)
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )

        events = []
        for event_data in result.data:
            events.append(SquareWebhookEventResponse(**event_data))

        return events

    except Exception as e:
        logger.error(f"Error getting webhook events: {e}")
        raise HTTPException(status_code=500, detail="Failed to get webhook events")


@router.get("/webhooks/health", response_model=WebhookHealthResponse)
async def get_webhook_health(
    current_user: User = Depends(get_current_user), db=Depends(get_async_rls_client)
):
    """Get webhook health status and statistics."""
    try:
        # Get webhook config
        webhook_result = (
            await db.table("square_webhooks")
            .select("*")
            .eq("user_id", current_user.id)
            .execute()
        )

        if not webhook_result.data:
            raise HTTPException(
                status_code=404, detail="Webhook configuration not found"
            )

        webhook_config = webhook_result.data[0]

        # Get event statistics
        events_result = (
            await db.table("square_webhook_events")
            .select("*")
            .eq("user_id", current_user.id)
            .execute()
        )

        total_events = len(events_result.data)
        failed_events = len([e for e in events_result.data if e["status"] == "failed"])
        success_rate = (
            ((total_events - failed_events) / total_events * 100)
            if total_events > 0
            else 100.0
        )

        last_event = None
        last_error = None

        if events_result.data:
            # Sort by created_at descending
            sorted_events = sorted(
                events_result.data, key=lambda x: x["created_at"], reverse=True
            )
            last_event = datetime.fromisoformat(
                sorted_events[0]["created_at"].replace("Z", "+00:00")
            )

            # Find last error
            failed_events_list = [e for e in sorted_events if e["status"] == "failed"]
            if failed_events_list:
                last_error = failed_events_list[0]["error_message"]

        return WebhookHealthResponse(
            webhook_id=webhook_config["webhook_id"],
            status=webhook_config["status"],
            last_event_received=last_event,
            total_events_received=total_events,
            failed_events=failed_events,
            success_rate=success_rate,
            last_error=last_error,
        )

    except Exception as e:
        logger.error(f"Error getting webhook health: {e}")
        raise HTTPException(status_code=500, detail="Failed to get webhook health")


@router.get("/configs", response_model=List[SquareConfig])
async def get_user_square_configs(
    current_user: User = Depends(get_current_user), db=Depends(get_async_rls_client)
):
    """Get all Square configurations for the current user"""
    return await square_service.get_user_configs(str(current_user.id), db)


@router.post("/configs", response_model=SquareConfig)
async def create_square_config(
    config_data: SquareConfigCreate,
    current_user: User = Depends(get_current_user),
    db=Depends(get_async_rls_client),
):
    """Create a new Square configuration"""
    return await square_service.create_config(str(current_user.id), config_data, db)


@router.get("/configs/{config_id}", response_model=SquareConfig)
async def get_square_config(
    config_id: str,
    current_user: User = Depends(get_current_user),
    db=Depends(get_async_rls_client),
):
    """Get a specific Square configuration"""
    config = await square_service.get_config_by_id(str(current_user.id), config_id, db)
    if not config:
        raise HTTPException(status_code=404, detail="Square configuration not found")
    return config


@router.put("/configs/{config_id}", response_model=SquareConfig)
async def update_square_config(
    config_id: str,
    config_data: SquareConfigUpdate,
    current_user: User = Depends(get_current_user),
    db=Depends(get_async_rls_client),
):
    """Update a Square configuration"""
    config = await square_service.update_config(
        str(current_user.id), config_id, config_data, db
    )
    if not config:
        raise HTTPException(status_code=404, detail="Square configuration not found")
    return config


@router.delete("/configs/{config_id}")
async def delete_square_config(
    config_id: str,
    current_user: User = Depends(get_current_user),
    db=Depends(get_async_rls_client),
):
    """Delete a Square configuration"""
    success = await square_service.delete_config(str(current_user.id), config_id, db)
    if not success:
        raise HTTPException(status_code=404, detail="Square configuration not found")
    return {"message": "Square configuration deleted successfully"}


@router.post("/test-connection", response_model=SquareConnectionStatus)
async def test_square_connection(
    config_id: str = Query(..., description="Configuration ID to test"),
    current_user: User = Depends(get_current_user),
    db=Depends(get_async_rls_client),
):
    """Test connection to Square API"""
    config = await square_service.get_config_by_id(str(current_user.id), config_id, db)
    if not config:
        raise HTTPException(status_code=404, detail="Square configuration not found")

    return await square_service.test_connection(config, str(current_user.id), db)


@router.get("/locations", response_model=List[SquareLocation])
async def get_square_locations(
    config_id: str,
    current_user: User = Depends(get_current_user),
    db=Depends(get_async_rls_client),
):
    """Get Square locations"""
    config = await square_service.get_config_by_id(str(current_user.id), config_id, db)
    if not config:
        raise HTTPException(status_code=404, detail="Square configuration not found")

    return await square_service.get_locations(config, str(current_user.id), db)


@router.get("/products", response_model=List[SquareProduct])
async def get_square_products(
    config_id: str,
    current_user: User = Depends(get_current_user),
    db=Depends(get_async_rls_client),
):
    """Get Square catalog products"""
    config = await square_service.get_config_by_id(str(current_user.id), config_id, db)
    if not config:
        raise HTTPException(status_code=404, detail="Square configuration not found")

    return await square_service.get_catalog_items(config, str(current_user.id), db)


@router.get("/customers", response_model=List[SquareCustomer])
async def get_square_customers(
    config_id: str,
    current_user: User = Depends(get_current_user),
    db=Depends(get_async_rls_client),
):
    """Get Square customers"""
    config = await square_service.get_config_by_id(str(current_user.id), config_id, db)
    if not config:
        raise HTTPException(status_code=404, detail="Square configuration not found")

    return await square_service.get_customers(config, str(current_user.id), db)


@router.get("/orders", response_model=List[SquareOrder])
async def get_square_orders(
    config_id: str,
    location_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db=Depends(get_async_rls_client),
):
    """Get Square orders"""
    config = await square_service.get_config_by_id(str(current_user.id), config_id, db)
    if not config:
        raise HTTPException(status_code=404, detail="Square configuration not found")

    return await square_service.get_orders(
        config, location_id, str(current_user.id), db
    )


@router.get("/payments", response_model=List[SquarePayment])
async def get_square_payments(
    config_id: str,
    location_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db=Depends(get_async_rls_client),
):
    """Get Square payments"""
    config = await square_service.get_config_by_id(str(current_user.id), config_id, db)
    if not config:
        raise HTTPException(status_code=404, detail="Square configuration not found")

    return await square_service.get_payments(
        config, location_id, str(current_user.id), db
    )


@router.get("/inventory", response_model=List[SquareInventoryCount])
async def get_square_inventory(
    config_id: str,
    location_ids: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db=Depends(get_async_rls_client),
):
    """Get Square inventory counts"""
    config = await square_service.get_config_by_id(str(current_user.id), config_id, db)
    if not config:
        raise HTTPException(status_code=404, detail="Square configuration not found")

    location_list = location_ids.split(",") if location_ids else None
    return await square_service.get_inventory_counts(config, location_list)


@router.get("/status", response_model=SquareConnectionStatus)
async def get_square_status(
    config_id: Optional[str] = Query(
        None, description="Configuration ID to check status"
    ),
    current_user: User = Depends(get_current_user),
    db=Depends(get_async_rls_client),
):
    """Get Square connection status for a specific configuration or general status"""
    if config_id:
        # Check status of specific configuration
        config = await square_service.get_config_by_id(
            str(current_user.id), config_id, db
        )
        if not config:
            raise HTTPException(
                status_code=404, detail="Square configuration not found"
            )

        return await square_service.test_connection(config, str(current_user.id), db)
    else:
        # Return general status - check if user has any configurations
        configs = await square_service.get_user_configs(str(current_user.id), db)
        if not configs:
            return SquareConnectionStatus(
                connected=False,
                environment="sandbox",
                error_message="No Square configurations found. Please create a configuration first.",
            )

        # Return status of the first active configuration
        active_config = next(
            (c for c in configs if c.is_active), configs[0] if configs else None
        )
        if active_config:
            return await square_service.test_connection(
                active_config, str(current_user.id), db
            )
        else:
            return SquareConnectionStatus(
                connected=False,
                environment="sandbox",
                error_message="No active Square configurations found.",
            )


# New API endpoints for additional Square integrations


@router.get("/refunds", response_model=List[SquareRefund])
async def get_square_refunds(
    config_id: str,
    location_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db=Depends(get_async_rls_client),
):
    """Get Square refunds"""
    config = await square_service.get_config_by_id(str(current_user.id), config_id, db)
    if not config:
        raise HTTPException(status_code=404, detail="Square configuration not found")

    return await square_service.get_refunds(config, location_id)


@router.get("/disputes", response_model=List[SquareDispute])
async def get_square_disputes(
    config_id: str,
    current_user: User = Depends(get_current_user),
    db=Depends(get_async_rls_client),
):
    """Get Square disputes"""
    config = await square_service.get_config_by_id(str(current_user.id), config_id, db)
    if not config:
        raise HTTPException(status_code=404, detail="Square configuration not found")

    return await square_service.get_disputes(config)


@router.get("/subscriptions", response_model=List[SquareSubscription])
async def get_square_subscriptions(
    config_id: str,
    location_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db=Depends(get_async_rls_client),
):
    """Get Square subscriptions"""
    config = await square_service.get_config_by_id(str(current_user.id), config_id, db)
    if not config:
        raise HTTPException(status_code=404, detail="Square configuration not found")

    return await square_service.get_subscriptions(config, location_id)


@router.get("/invoices", response_model=List[SquareInvoice])
async def get_square_invoices(
    config_id: str,
    location_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db=Depends(get_async_rls_client),
):
    """Get Square invoices"""
    config = await square_service.get_config_by_id(str(current_user.id), config_id, db)
    if not config:
        raise HTTPException(status_code=404, detail="Square configuration not found")

    return await square_service.get_invoices(config, location_id)


@router.get("/team-members", response_model=List[SquareTeamMember])
async def get_square_team_members(
    config_id: str,
    current_user: User = Depends(get_current_user),
    db=Depends(get_async_rls_client),
):
    """Get Square team members"""
    config = await square_service.get_config_by_id(str(current_user.id), config_id, db)
    if not config:
        raise HTTPException(status_code=404, detail="Square configuration not found")

    return await square_service.get_team_members(config)


@router.get("/labor", response_model=List[SquareLabor])
async def get_square_labor(
    config_id: str,
    location_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db=Depends(get_async_rls_client),
):
    """Get Square labor/timecard data"""
    config = await square_service.get_config_by_id(str(current_user.id), config_id, db)
    if not config:
        raise HTTPException(status_code=404, detail="Square configuration not found")

    return await square_service.get_labor(config, location_id)


@router.get("/merchants", response_model=List[SquareMerchant])
async def get_square_merchants(
    config_id: str,
    current_user: User = Depends(get_current_user),
    db=Depends(get_async_rls_client),
):
    """Get Square merchant information"""
    config = await square_service.get_config_by_id(str(current_user.id), config_id, db)
    if not config:
        raise HTTPException(status_code=404, detail="Square configuration not found")

    return await square_service.get_merchants(config)


@router.get("/payouts", response_model=List[SquarePayout])
async def get_square_payouts(
    config_id: str,
    location_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db=Depends(get_async_rls_client),
):
    """Get Square payout information"""
    config = await square_service.get_config_by_id(str(current_user.id), config_id, db)
    if not config:
        raise HTTPException(status_code=404, detail="Square configuration not found")

    return await square_service.get_payouts(config, location_id)
