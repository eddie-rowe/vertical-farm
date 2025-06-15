# Cloudflare Integration for Vertical Farm

This directory contains Cloudflare configurations and Workers that enhance the vertical farming application with edge computing, security, and performance optimizations.

## 🎯 Architecture Overview

Our Cloudflare integration complements (not replaces) Supabase by providing:

- **Edge Processing**: Handle IoT sensor data at the edge before sending to Supabase
- **Security Layer**: DDoS protection, WAF rules, and rate limiting
- **Performance**: CDN caching and global content delivery
- **Caching**: KV storage for frequently accessed data

## 📁 Directory Structure

```
cloudflare/
├── workers/                 # Cloudflare Workers
│   └── sensor-processor/    # IoT data processing at edge
├── security/               # Security configurations
│   ├── waf-rules.json     # Web Application Firewall rules
│   └── rate-limiting.json # Rate limiting configurations
├── cdn/                   # CDN and caching rules
│   └── cache-rules.json   # Cache configuration
├── kv/                    # KV namespace configurations
│   └── device-cache-config.json
├── scripts/               # Deployment scripts
│   └── deploy.sh         # Main deployment script
├── wrangler.toml         # Main Wrangler configuration
└── README.md             # This file
```

## 🚀 Quick Start

### Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Domain**: Add your domain to Cloudflare
3. **Wrangler CLI**: Install globally
   ```bash
   npm install -g wrangler
   ```
4. **Authentication**: Login to Wrangler
   ```bash
   wrangler login
   ```

### Environment Variables

Set these environment variables before deployment:

```bash
export CLOUDFLARE_ACCOUNT_ID="your_account_id"
export CLOUDFLARE_API_TOKEN="your_api_token"
export CLOUDFLARE_ZONE_ID="your_zone_id"
```

### Deployment

1. **Update Configuration**: Edit `wrangler.toml` with your account details
2. **Deploy Everything**:
   ```bash
   cd cloudflare
   ./scripts/deploy.sh
   ```

## 🔧 Configuration

### 1. Update Wrangler Configuration

Edit `wrangler.toml` and replace placeholders:
- `YOUR_ACCOUNT_ID_HERE`
- `YOUR_SUPABASE_URL`
- `YOUR_SUPABASE_ANON_KEY`
- `YOUR_KV_NAMESPACE_ID`

### 2. Domain Configuration

Update worker routes in `workers/sensor-processor/wrangler.toml`:
```toml
routes = [
  { pattern = "yourdomain.com/api/sensors/*", zone_name = "yourdomain.com" }
]
```

## 🛡️ Security Features

### WAF Rules
- SQL injection protection
- XSS prevention
- IoT device validation
- Suspicious payload blocking

### Rate Limiting
- API endpoint protection: 100 req/min
- Sensor data: 300 req/min
- Authentication: 10 req/5min
- Device registration: 5 req/hour

## ⚡ Performance Features

### CDN Caching
- Static assets: 30 days
- Dashboard pages: 5 minutes
- Public pages: 1 hour
- API responses: No cache

### Edge Processing
- Sensor data validation
- Duplicate filtering
- Threshold-based forwarding
- Real-time caching

## 📊 Monitoring

### Cloudflare Dashboard
- Worker performance metrics
- Security event logs
- Cache hit rates
- Error tracking

### KV Usage
- Device state caching
- Sensor reading storage
- User preference caching
- Alert threshold management

## 🔄 Data Flow

```
IoT Device → Cloudflare Worker → KV Cache → Supabase
                ↓
         Edge Processing
         - Validation
         - Deduplication
         - Caching
```

## 🛠️ Development

### Local Testing
```bash
cd workers/sensor-processor
wrangler dev
```

### Deploy Single Worker
```bash
cd workers/sensor-processor
wrangler deploy --env development
```

### KV Operations
```bash
# List keys
wrangler kv:key list --binding=DEVICE_CACHE

# Get value
wrangler kv:key get --binding=DEVICE_CACHE "sensor:device1:latest"

# Put value
wrangler kv:key put --binding=DEVICE_CACHE "test:key" "test-value"
```

## 📈 Benefits

### For IoT Devices
- Reduced latency (edge processing)
- Better reliability (edge caching)
- Bandwidth optimization (deduplication)

### For Application
- Reduced Supabase load
- Faster dashboard loading
- Better security posture
- Global performance

### For Users
- Faster page loads
- Real-time data access
- Better uptime
- Enhanced security

## 🔧 Troubleshooting

### Common Issues

1. **Worker not receiving requests**
   - Check route configuration
   - Verify DNS settings
   - Confirm zone ID

2. **KV namespace errors**
   - Verify namespace IDs in wrangler.toml
   - Check binding names
   - Confirm permissions

3. **Security rules blocking legitimate traffic**
   - Review WAF logs in dashboard
   - Adjust rate limiting thresholds
   - Whitelist known good IPs

### Logs and Debugging

```bash
# View worker logs
wrangler tail sensor-processor

# Check deployment status
wrangler status sensor-processor

# View KV namespace info
wrangler kv:namespace list
```

## 🔄 Updates and Maintenance

### Regular Tasks
- Monitor security logs weekly
- Review performance metrics monthly
- Update worker code as needed
- Adjust cache rules based on usage

### Scaling Considerations
- Monitor KV usage limits
- Adjust worker CPU limits if needed
- Review rate limiting thresholds
- Consider additional workers for new features

## 📞 Support

For issues specific to this integration:
1. Check Cloudflare dashboard for errors
2. Review worker logs with `wrangler tail`
3. Verify configuration files
4. Test with `wrangler dev` locally

---

**Next Steps**: After deployment, monitor the Cloudflare dashboard and adjust configurations based on your specific traffic patterns and security requirements. 