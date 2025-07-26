"""
Pydantic schemas for Square integration webhook functionality.
"""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, field_validator


class WebhookStatus(str, Enum):
    """Webhook status enumeration."""

    PENDING = "pending"
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"


class WebhookEventStatus(str, Enum):
    """Webhook event processing status enumeration."""

    RECEIVED = "received"
    PROCESSED = "processed"
    FAILED = "failed"
    IGNORED = "ignored"


class SquareWebhookEventType(str, Enum):
    """Square webhook event types we handle."""

    CATALOG_VERSION_UPDATED = "catalog.version.updated"
    ORDER_CREATED = "order.created"
    ORDER_UPDATED = "order.updated"
    ORDER_FULFILLED = "order.fulfilled"
    PAYMENT_CREATED = "payment.created"
    PAYMENT_UPDATED = "payment.updated"
    CUSTOMER_CREATED = "customer.created"
    CUSTOMER_UPDATED = "customer.updated"
    INVENTORY_COUNT_UPDATED = "inventory.count.updated"


# Request/Response Schemas
class SquareWebhookCreate(BaseModel):
    """Schema for creating a new webhook configuration."""

    webhook_url: str = Field(..., description="URL where Square will send webhooks")
    event_types: list[str] = Field(
        default=[], description="List of event types to subscribe to"
    )

    @field_validator("webhook_url")
    @classmethod
    def validate_webhook_url(cls, v):
        """Validate webhook URL format."""
        if not v.startswith(("http://", "https://")):
            raise ValueError("Webhook URL must start with http:// or https://")
        return v

    @field_validator("event_types")
    @classmethod
    def validate_event_types(cls, v):
        """Validate event types are supported."""
        valid_types = [e.value for e in SquareWebhookEventType]
        for event_type in v:
            if event_type not in valid_types:
                raise ValueError(f"Unsupported event type: {event_type}")
        return v


class SquareWebhookUpdate(BaseModel):
    """Schema for updating webhook configuration."""

    webhook_url: str | None = Field(
        None, description="URL where Square will send webhooks"
    )
    event_types: list[str] | None = Field(
        None, description="List of event types to subscribe to"
    )
    status: WebhookStatus | None = Field(None, description="Webhook status")

    @field_validator("webhook_url")
    @classmethod
    def validate_webhook_url(cls, v):
        """Validate webhook URL format."""
        if v and not v.startswith(("http://", "https://")):
            raise ValueError("Webhook URL must start with http:// or https://")
        return v


class SquareWebhookResponse(BaseModel):
    """Schema for webhook configuration response."""

    id: str
    user_id: str
    webhook_id: str | None
    webhook_url: str
    event_types: list[str]
    status: WebhookStatus
    last_verified_at: datetime | None
    error_message: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Webhook Event Schemas
class SquareWebhookPayload(BaseModel):
    """Schema for incoming Square webhook payload."""

    merchant_id: str = Field(..., description="Square merchant ID")
    type: str = Field(..., description="Event type")
    event_id: str = Field(..., description="Unique event ID")
    created_at: str = Field(..., description="Event creation timestamp")
    data: dict[str, Any] = Field(..., description="Event data payload")


class SquareWebhookEventCreate(BaseModel):
    """Schema for creating webhook event log entry."""

    user_id: str
    event_id: str
    event_type: str
    merchant_id: str
    payload: dict[str, Any]
    signature_header: str


class SquareWebhookEventResponse(BaseModel):
    """Schema for webhook event response."""

    id: str
    user_id: str
    event_id: str
    event_type: str
    merchant_id: str
    payload: dict[str, Any]
    signature_header: str
    processed_at: datetime | None
    status: WebhookEventStatus
    cache_invalidated: bool
    error_message: str | None
    created_at: datetime

    class Config:
        from_attributes = True


# Cache Invalidation Schemas
class CacheInvalidationRequest(BaseModel):
    """Schema for manual cache invalidation request."""

    cache_types: list[str] = Field(..., description="Types of cache to invalidate")
    reason: str | None = Field(None, description="Reason for invalidation")

    @field_validator("cache_types")
    @classmethod
    def validate_cache_types(cls, v):
        """Validate cache types."""
        valid_types = [
            "locations",
            "products",
            "customers",
            "orders",
            "payments",
            "all",
        ]
        for cache_type in v:
            if cache_type not in valid_types:
                raise ValueError(f"Invalid cache type: {cache_type}")
        return v


class CacheInvalidationResponse(BaseModel):
    """Schema for cache invalidation response."""

    success: bool
    invalidated_caches: list[str]
    message: str
    timestamp: datetime


# Webhook Registration Schemas
class WebhookRegistrationRequest(BaseModel):
    """Schema for registering webhook with Square."""

    notification_url: str = Field(..., description="URL for webhook notifications")
    event_types: list[str] = Field(..., description="Event types to subscribe to")


class WebhookRegistrationResponse(BaseModel):
    """Schema for webhook registration response."""

    webhook_id: str
    notification_url: str
    event_types: list[str]
    signature_key: str
    status: str
    created_at: datetime


# Webhook Health Check Schemas
class WebhookHealthResponse(BaseModel):
    """Schema for webhook health check response."""

    webhook_id: str | None
    status: WebhookStatus
    last_event_received: datetime | None
    total_events_received: int
    failed_events: int
    success_rate: float
    last_error: str | None
