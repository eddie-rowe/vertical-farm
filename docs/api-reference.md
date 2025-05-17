# API Reference – Vertical Farm Backend

_Last Synced: 2025-05-17_

## Overview
This document details all REST API endpoints exposed by the FastAPI backend, including authentication, request/response schemas, and error handling.

---

## Authentication
All endpoints (except `/health` and `/healthz`) require a valid Supabase JWT token in the `Authorization: Bearer <token>` header.

---

## Endpoints

### `GET /health`
- **Description:** Health check endpoint.
- **Auth:** None
- **Response:** `{ "status": "ok" }`

### `GET /healthz`
- **Description:** Health check endpoint (alias).
- **Auth:** None
- **Response:** `{ "status": "ok" }`

### `GET /supabase-items`
- **Description:** Fetches all items from the Supabase `items` table.
- **Auth:** None (should be protected in production)
- **Response:** `{ "data": [ ... ] }`

### `POST /items/`
- **Description:** Create a new item.
- **Auth:** Required
- **Request Body:**
  ```json
  {
    "name": "string",
    "description": "string (optional)",
    "price": 0.0,
    "tax": 0.0 (optional)
  }
  ```
- **Response:**
  ```json
  {
    "name": "string",
    "description": "string (optional)",
    "price": 0.0,
    "tax": 0.0 (optional)
  }
  ```
- **Errors:**
  - 400: Item already exists
  - 401: Invalid or missing token

### `GET /items/{item_name}`
- **Description:** Retrieve an item by name.
- **Auth:** Required
- **Path Param:** `item_name` (string)
- **Response:**
  ```json
  {
    "name": "string",
    "description": "string (optional)",
    "price": 0.0,
    "tax": 0.0 (optional)
  }
  ```
- **Errors:**
  - 404: Item not found
  - 401: Invalid or missing token

---

## Schemas

### `Item`
```json
{
  "name": "string",
  "description": "string (optional)",
  "price": 0.0,
  "tax": 0.0 (optional)
}
```

---

## Error Codes
- **400:** Bad Request (e.g., item already exists)
- **401:** Unauthorized (missing/invalid token)
- **404:** Not Found (item does not exist)

---

## See Also
- [backend-architecture.md](./backend-architecture.md)
- [security-model.md](./security-model.md) 