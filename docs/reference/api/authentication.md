# Authentication and Authorization

## Overview

The Vertical Farming Platform uses a multi-layered authentication system combining Supabase Auth, JWT tokens, and Row Level Security (RLS) to ensure secure access to resources.

## Authentication Flow

### 1. User Registration

```python
# Python example using Supabase client
from supabase import create_client

supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Register a new user
response = supabase.auth.sign_up({
    'email': 'user@example.com',
    'password': 'secure_password'
})
```

### 2. User Login

```bash
# Obtain JWT token via curl
curl -X POST "https://api.vertical-farm.goodgoodgreens.org/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'
```

### 3. Token Usage

Include the JWT token in the Authorization header:

```python
headers = {
    'Authorization': f'Bearer {jwt_token}',
    'Content-Type': 'application/json'
}
response = requests.get(f'{BASE_URL}/farms', headers=headers)
```

## Authorization Mechanisms

### 1. Role-Based Access Control (RBAC)

Predefined roles:
- `admin`: Full system access
- `farm_manager`: Manage farms and devices
- `analyst`: View reports and analytics
- `user`: Basic farm monitoring

### 2. Row Level Security (RLS)

Supabase RLS ensures users can only access their own data:

```sql
-- Example RLS policy for farms table
CREATE POLICY "Users can only see their own farms" 
ON farms FOR SELECT 
USING (auth.uid() = user_id);
```

## Token Management

### Token Lifecycle
- **Expiration**: 1 hour
- **Refresh Token**: Available for extended sessions
- **Revocation**: Immediate on logout or security event

### Refresh Token Example

```python
# Refresh an expired token
new_session = supabase.auth.refresh_session(refresh_token)
```

## Security Best Practices

1. Always use HTTPS
2. Store tokens securely
3. Implement token rotation
4. Use short-lived access tokens
5. Monitor and log authentication events

## Troubleshooting

### Common Authentication Errors

- **401 Unauthorized**: Invalid or expired token
- **403 Forbidden**: Insufficient permissions
- **500 Internal Server Error**: Authentication service issue

## API Key Management

### Creating API Keys

```python
# Generate an API key (admin only)
api_key = user_service.generate_api_key(user_id)
```

### Revoking API Keys

```python
# Revoke a specific API key
user_service.revoke_api_key(api_key_id)
```

## Compliance and Auditing

- All authentication events are logged
- Supports multi-factor authentication
- Compliance with GDPR, CCPA data protection standards

## Related Documentation

- [Security Model](../../security/model.md)
- [User Permissions](../../security/permissions.md)