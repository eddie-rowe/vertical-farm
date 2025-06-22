# Home Assistant Integration Setup Guide

This guide will help you set up the Home Assistant integration for your Vertical Farm system, whether your Home Assistant is accessible directly or protected by Cloudflare Access.

## Authentication Methods

You'll need different tokens depending on how your Home Assistant is configured:

### Method 1: Direct Access (Local or Public without Cloudflare Access)
- **Only need**: Home Assistant Long-Lived Access Token

### Method 2: Protected by Cloudflare Access (Zero Trust)
- **Need both**: 
  - Home Assistant Long-Lived Access Token
  - Cloudflare Service Token (Client ID + Secret)

## Step 1: Get Your Home Assistant Long-Lived Access Token

1. **Log into your Home Assistant**
2. **Go to your profile**: Click your profile icon in the bottom left
3. **Navigate to Security**: Scroll down to "Long-lived access tokens"
4. **Create token**: Click "Create Token"
5. **Name it**: Give it a name like "Vertical Farm API"
6. **Copy the token**: Save it securely (you won't see it again!)

## Step 2: Cloudflare Service Token (Only if needed)

**Skip this step if your Home Assistant URL works directly without authentication prompts.**

If your Home Assistant is behind Cloudflare Access, you'll see a Cloudflare login screen when accessing it. In this case:

1. **Log into Cloudflare Zero Trust Dashboard**
2. **Navigate to Access**: Go to "Access" → "Service Auth" → "Service Tokens"
3. **Create Service Token**: Click "Create Service Token"
4. **Configure token**:
   - **Name**: "Vertical Farm Home Assistant"
   - **Duration**: Choose appropriate lifetime (e.g., 1 year)
5. **Generate token**: Click "Generate token"
6. **Copy both values**:
   - **Client ID**: Save this
   - **Client Secret**: Save this (you won't see it again!)

## Step 3: Configure Your Backend

1. **Copy the example config**:
   ```bash
   cd vertical-farm/backend
   cp home_assistant_config.env.example .env
   ```

2. **Edit the .env file** with your values:

### For Direct Access (Method 1):
```bash
# Home Assistant Integration Configuration
HOME_ASSISTANT_ENABLED=true
HOME_ASSISTANT_URL=https://automate-api.goodgoodgreens.org
HOME_ASSISTANT_TOKEN=your_actual_home_assistant_token_here

# Cloudflare settings (not needed for direct access)
CLOUDFLARE_ACCESS_PROTECTED=false
```

### For Cloudflare Access Protected (Method 2):
```bash
# Home Assistant Integration Configuration
HOME_ASSISTANT_ENABLED=true
HOME_ASSISTANT_URL=https://automate-api.goodgoodgreens.org
HOME_ASSISTANT_TOKEN=your_actual_home_assistant_token_here

# Cloudflare Access protection
CLOUDFLARE_ACCESS_PROTECTED=true
CLOUDFLARE_SERVICE_CLIENT_ID=your_cloudflare_client_id_here
CLOUDFLARE_SERVICE_CLIENT_SECRET=your_cloudflare_client_secret_here
```

### For Local Network Testing:
```bash
# Home Assistant Integration Configuration
HOME_ASSISTANT_ENABLED=true
HOME_ASSISTANT_URL=http://192.168.0.144:8123
HOME_ASSISTANT_TOKEN=your_actual_home_assistant_token_here

# No Cloudflare needed for local access
CLOUDFLARE_ACCESS_PROTECTED=false
```

## Step 4: Test Your Configuration

Run the test script to verify everything is working:

```bash
cd vertical-farm/backend
python test_home_assistant_connection.py
```

**Expected output for successful connection**:
```
🏠 Home Assistant Connection Test
================================

✅ Configuration loaded:
   URL: https://automate-api.goodgoodgreens.org
   HA Token: ********************abc1
   🔒 Cloudflare Access protection enabled  # (if using Cloudflare)

🔌 Testing connection...
   Using Cloudflare Access authentication...  # (if using Cloudflare)

✅ Successfully connected to Home Assistant
   Version: 2024.1.0
   Components: 145 loaded
   Entities: 67 available

🌡️  Sample sensor data:
   sensor.temperature_living_room: 22.5°C
   sensor.humidity_kitchen: 45%
   light.office_lamp: on

🎉 Home Assistant integration is ready!
```

## Troubleshooting

### Error: "Invalid access token"
- **Check**: Your Home Assistant token is correct
- **Verify**: Token hasn't expired
- **Test**: Try accessing your HA URL directly in a browser

### Error: "Connection refused" or timeout
- **Check**: Your Home Assistant URL is accessible
- **Test**: Visit the URL in your browser
- **Network**: Ensure your backend can reach the Home Assistant instance

### Error: "CF-Access denied" or 401 with Cloudflare
- **Check**: Your Cloudflare service token is correct
- **Verify**: The service token hasn't expired
- **Permissions**: Ensure the service token has access to your Home Assistant application

### Error: "Could not connect to Home Assistant"
- **Check**: Home Assistant is running and responsive
- **Network**: Verify network connectivity
- **Firewall**: Check if ports 8123 or 443 are accessible

## Security Notes

1. **Never commit tokens to version control**: Keep your `.env` file private
2. **Use HTTPS**: Always use HTTPS URLs for production
3. **Rotate tokens**: Regularly rotate your access tokens
4. **Principle of least privilege**: Give tokens only the access they need

## Next Steps

Once your connection test passes:

1. **Start your backend**: The Home Assistant integration will automatically initialize
2. **Check the logs**: Look for successful connection messages
3. **Use the API**: Home Assistant endpoints will be available at `/api/v1/home-assistant/`
4. **Frontend integration**: Configure the frontend to use the Home Assistant features

## API Endpoints Available

After successful setup, these endpoints will be available:

- `GET /api/v1/home-assistant/status` - Integration status
- `GET /api/v1/home-assistant/devices` - List all devices
- `POST /api/v1/home-assistant/devices/control` - Control devices
- `GET /api/v1/home-assistant/sensors` - Get sensor data
- `POST /api/v1/home-assistant/lights/control` - Control lights
- `POST /api/v1/home-assistant/irrigation/control` - Control irrigation

---

**Questions?** Check the logs in your backend for more detailed error messages, or consult the Home Assistant and Cloudflare documentation for additional troubleshooting steps. 