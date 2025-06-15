# Cloudflare Workers - Vertical Farm

Modern, secure, and performant Cloudflare Workers for the Vertical Farm IoT platform.

## 🚀 Overview

This project contains 4 specialized Cloudflare Workers that provide edge computing capabilities for the Vertical Farm platform:

- **sensor-processor**: Processes IoT sensor data at the edge with intelligent caching and alerting
- **main-api-cache**: Caches FastAPI backend endpoints with intelligent TTL strategies
- **static-assets-cache**: Optimizes Next.js static file delivery with long-term caching
- **health-check-cache**: Provides fast health monitoring with aggregated status reporting

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   IoT Sensors   │    │   Next.js App   │    │  Health Checks  │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ sensor-processor│    │static-assets-   │    │health-check-    │
│                 │    │cache            │    │cache            │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 ▼
                    ┌─────────────────┐
                    │ main-api-cache  │
                    │                 │
                    └─────────┬───────┘
                              ▼
                    ┌─────────────────┐
                    │   Supabase DB   │
                    └─────────────────┘
```

## ✨ Features

### 🔒 Security
- **Rate Limiting**: KV-based sliding window rate limiting
- **Security Headers**: Comprehensive security headers (CSP, HSTS, X-Frame-Options)
- **Input Validation**: Strict validation and sanitization for all inputs
- **Error Handling**: Secure error responses without information disclosure

### 📊 Performance
- **Intelligent Caching**: Content-aware TTL strategies
- **Edge Processing**: Sensor data validation and processing at the edge
- **Analytics Integration**: Performance metrics and error tracking
- **Parallel Operations**: Concurrent cache operations for optimal performance

### 🛠️ Developer Experience
- **TypeScript**: 100% TypeScript with strict typing
- **Modern Tooling**: Latest ESLint, Prettier, and development tools
- **Modular Architecture**: Shared utilities and type definitions
- **Comprehensive Documentation**: Detailed code documentation and examples

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Cloudflare account with Workers enabled
- Wrangler CLI installed globally: `npm install -g wrangler`

### Installation

1. **Clone and navigate to the workers directory:**
   ```bash
   cd vertical-farm/cloudflare/workers
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

4. **Authenticate with Cloudflare:**
   ```bash
   wrangler auth login
   ```

### Development

1. **Start development server for a specific worker:**
   ```bash
   npm run dev:sensor     # Sensor processor
   npm run dev:main       # Main API cache
   npm run dev:assets     # Static assets cache
   npm run dev:health     # Health check cache
   ```

2. **Type checking:**
   ```bash
   npm run type-check
   ```

3. **Linting and formatting:**
   ```bash
   npm run lint           # Check for linting errors
   npm run lint:fix       # Fix linting errors
   npm run format         # Format code with Prettier
   ```

### Deployment

1. **Deploy all workers:**
   ```bash
   npm run deploy
   ```

2. **Deploy with dry run (preview):**
   ```bash
   npm run deploy:dry-run
   ```

## 📁 Project Structure

```
cloudflare/workers/
├── types/
│   └── worker.d.ts              # Shared TypeScript definitions
├── utils/
│   └── security.ts              # Security utilities and rate limiting
├── sensor-processor/
│   ├── index.ts                 # Sensor data processing worker
│   └── wrangler.toml           # Worker configuration
├── main-api-cache/
│   ├── index.ts                 # API caching worker
│   └── wrangler.toml           # Worker configuration
├── static-assets-cache/
│   ├── index.ts                 # Static assets caching worker
│   └── wrangler.toml           # Worker configuration
├── health-check-cache/
│   ├── index.ts                 # Health monitoring worker
│   └── wrangler.toml           # Worker configuration
├── tsconfig.json               # TypeScript configuration
├── eslint.config.js            # ESLint configuration
├── .prettierrc                 # Prettier configuration
├── package.json                # Dependencies and scripts
├── deploy-local.sh             # Local deployment script
├── AUDIT_REPORT.md             # Comprehensive audit report
└── README.md                   # This file
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the workers directory with the following variables:

```bash
# Cloudflare Configuration
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_KV_NAMESPACE_ID=your_kv_namespace_id
CLOUDFLARE_KV_PREVIEW_ID=your_preview_namespace_id

# Domain Configuration
DOMAIN=yourdomain.com
API_DOMAIN=api.yourdomain.com

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key

# Backend Configuration
BACKEND_PROD_URL=https://your-backend.com
```

### Worker-Specific Configuration

Each worker has its own `wrangler.toml` file with specific configuration:

- **Routes**: URL patterns the worker should handle
- **KV Namespaces**: Key-value storage bindings
- **Environment Variables**: Worker-specific environment variables
- **Compatibility**: Node.js compatibility flags

## 🔍 Monitoring

### Analytics

Each worker includes analytics integration for monitoring:

- **Performance Metrics**: Response times, cache hit rates
- **Error Tracking**: Structured error logging
- **Usage Patterns**: Request patterns and trends
- **Security Events**: Rate limiting and security violations

### Health Monitoring

The health-check-cache worker provides aggregated health status:

```bash
# Check overall system health
curl https://your-health-worker.workers.dev/health

# Check specific service health
curl https://your-health-worker.workers.dev/api/v1/cache/health
```

### Logs

View real-time logs for any worker:

```bash
npm run tail:sensor    # Sensor processor logs
npm run tail:main      # Main API cache logs
npm run tail:assets    # Static assets cache logs
npm run tail:health    # Health check cache logs
```

## 🧪 Testing

### Manual Testing

1. **Sensor Data Processing:**
   ```bash
   curl -X POST https://your-domain.com/api/sensors/ \
     -H "Content-Type: application/json" \
     -d '{"device_id":"test-001","sensor_type":"temperature","value":25.5}'
   ```

2. **API Caching:**
   ```bash
   curl https://your-api-cache.workers.dev/api/v1/health
   ```

3. **Static Assets:**
   ```bash
   curl https://your-static-cache.workers.dev/_next/static/css/app.css
   ```

### Performance Testing

Use tools like `wrk` or `ab` to test performance:

```bash
# Test sensor data ingestion
wrk -t12 -c400 -d30s -s post-sensor-data.lua https://your-domain.com/api/sensors/

# Test API caching
wrk -t12 -c400 -d30s https://your-api-cache.workers.dev/api/v1/health
```

## 🔒 Security

### Rate Limiting

Each worker implements configurable rate limiting:

- **Sensor Processor**: 60 requests per minute per IP
- **API Cache**: 100 requests per minute per IP
- **Static Assets**: 200 requests per minute per IP
- **Health Check**: 30 requests per minute per IP

### Security Headers

All workers include comprehensive security headers:

- **Content Security Policy (CSP)**
- **Strict Transport Security (HSTS)**
- **X-Frame-Options**
- **X-Content-Type-Options**
- **Referrer Policy**
- **Permissions Policy**

### Input Validation

Strict validation for all inputs:

- **Device IDs**: Alphanumeric with hyphens/underscores, 3-50 characters
- **Sensor Values**: Range validation per sensor type
- **Sensor Types**: Whitelist of allowed types
- **XSS Prevention**: Input sanitization

## 📈 Performance

### Benchmarks

- **Sensor Processing**: < 100ms average response time
- **Cache Hit Rate**: > 90% for frequently accessed data
- **Memory Usage**: < 128MB per worker
- **Cold Start**: < 50ms for TypeScript workers

### Optimization

- **Parallel Operations**: Concurrent cache operations
- **Intelligent TTL**: Content-aware cache expiration
- **Edge Processing**: Reduce origin server load
- **Compression**: Automatic compression for static assets

## 🚨 Troubleshooting

### Common Issues

1. **Environment Variables Not Loading:**
   ```bash
   # Ensure .env file exists and is properly formatted
   source .env && echo $CLOUDFLARE_ACCOUNT_ID
   ```

2. **TypeScript Compilation Errors:**
   ```bash
   # Check TypeScript configuration
   npm run type-check
   ```

3. **Deployment Failures:**
   ```bash
   # Check wrangler authentication
   wrangler whoami
   
   # Verify environment variables
   ./deploy-local.sh --dry-run
   ```

4. **Rate Limiting Issues:**
   ```bash
   # Check rate limit configuration in worker code
   # Adjust SENSOR_RATE_LIMIT environment variable
   ```

### Debug Mode

Enable debug logging by setting environment variables:

```bash
export DEBUG=true
export LOG_LEVEL=debug
```

## 🤝 Contributing

1. **Code Style**: Follow ESLint and Prettier configurations
2. **TypeScript**: Maintain strict typing throughout
3. **Testing**: Add tests for new functionality
4. **Documentation**: Update README and code comments
5. **Security**: Follow security best practices

### Development Workflow

1. Create feature branch
2. Make changes with proper TypeScript typing
3. Run linting and formatting: `npm run lint:fix && npm run format`
4. Test locally: `npm run dev:worker-name`
5. Deploy to preview: `npm run deploy:dry-run`
6. Create pull request

## 📚 Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [ESLint Configuration](https://eslint.org/docs/user-guide/configuring/)
- [Prettier Configuration](https://prettier.io/docs/en/configuration.html)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ for the Vertical Farm IoT Platform** 