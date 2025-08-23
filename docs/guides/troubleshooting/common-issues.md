# Common Issues & Solutions

Quick reference guide for resolving frequently encountered problems in the Vertical Farm platform.

## Login & Authentication Issues

### Cannot Login

**Symptoms**: Login button doesn't work, credentials rejected, spinning loader

**Common Causes & Solutions**:

1. **Invalid Credentials**
   ```bash
   # Verify email/password are correct
   # Check for typos, caps lock
   # Try password reset if forgotten
   ```

2. **Account Locked**
   - Too many failed attempts (5+ in 30 minutes)
   - Wait 30 minutes or contact admin
   - Check email for unlock instructions

3. **Browser Issues**
   ```javascript
   // Clear browser data
   localStorage.clear();
   sessionStorage.clear();
   // Clear cookies for the domain
   // Try incognito/private mode
   ```

4. **Network Problems**
   ```bash
   # Check connectivity
   ping api.vertical-farm.com
   # Check DNS resolution
   nslookup api.vertical-farm.com
   # Try different network/VPN
   ```

### Session Expired

**Symptoms**: Suddenly logged out, "Session expired" message

**Solutions**:
```typescript
// Extend session timeout (admin only)
{
  session: {
    idle_timeout: 1800, // 30 minutes
    absolute_timeout: 43200 // 12 hours
  }
}
```

- Log in again
- Enable "Remember me" for longer sessions
- Check system time is correct

### MFA Not Working

**Symptoms**: MFA code rejected, can't receive codes

**Solutions**:
1. Verify device time is synced
2. Use backup codes if available
3. Try SMS fallback if configured
4. Contact admin to reset MFA

## Farm & Device Management

### Farm Not Appearing

**Symptoms**: Created farm doesn't show in list

**Diagnostic Steps**:
```sql
-- Check database (admin only)
SELECT * FROM farms WHERE user_id = 'USER_ID';
-- Verify RLS policies
SELECT * FROM farms; -- Should filter automatically
```

**Solutions**:
1. Check filters in UI (active/inactive)
2. Verify user permissions
3. Refresh page (Ctrl+F5)
4. Check organization assignment

### Devices Showing Offline

**Symptoms**: All devices show red/offline status

**Diagnostic Commands**:
```bash
# Check device connectivity
curl -X GET https://api.vertical-farm.com/api/v1/devices/DEVICE_ID/status

# Check MQTT broker
mosquitto_sub -h mqtt.vertical-farm.com -t "devices/+/status" -v

# Verify device configuration
cat /etc/vertical-farm/device.conf
```

**Solutions**:
1. **Network Issues**
   - Check device network connection
   - Verify firewall rules (port 1883/8883 for MQTT)
   - Test with ping/traceroute

2. **Authentication**
   - Regenerate device token
   - Update device credentials
   - Check certificate expiration

3. **Power/Hardware**
   - Verify device power supply
   - Check physical connections
   - Restart device

### Cannot Control Devices

**Symptoms**: Control commands not working, buttons disabled

**Solutions**:
```typescript
// Check user permissions
const permissions = await checkUserPermissions(userId, deviceId);
console.log('Can control:', permissions.canControl);

// Verify device is online
const status = await getDeviceStatus(deviceId);
if (status !== 'online') {
  console.error('Device offline');
}

// Check for automation conflicts
const automations = await getActiveAutomations(deviceId);
```

1. Verify device is online
2. Check user has control permissions
3. Disable conflicting automations
4. Check device control limits
5. Try manual override mode

## Data & Analytics Issues

### Missing Sensor Data

**Symptoms**: Gaps in charts, no recent data

**Diagnostic Queries**:
```sql
-- Check latest data
SELECT MAX(created_at) as last_reading 
FROM sensor_data 
WHERE device_id = 'DEVICE_ID';

-- Check data frequency
SELECT DATE_TRUNC('hour', created_at) as hour,
       COUNT(*) as readings
FROM sensor_data
WHERE device_id = 'DEVICE_ID'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour;
```

**Solutions**:
1. Verify device is sending data
2. Check data retention policies
3. Verify time zone settings
4. Check sensor calibration
5. Review data filtering rules

### Reports Not Generating

**Symptoms**: Export fails, PDF blank, timeout errors

**Solutions**:
1. **Reduce Date Range**
   ```javascript
   // Instead of full year, try monthly
   const report = await generateReport({
     start: '2024-01-01',
     end: '2024-01-31'
   });
   ```

2. **Check Background Jobs**
   ```bash
   # Check job queue status
   SELECT * FROM job_queue WHERE type = 'report_generation';
   ```

3. **Memory Issues**
   - Reduce data complexity
   - Export CSV instead of PDF
   - Use pagination for large datasets

### Incorrect Calculations

**Symptoms**: Wrong totals, averages don't match

**Verification**:
```sql
-- Manual calculation to verify
SELECT 
  AVG(value) as avg_value,
  MIN(value) as min_value,
  MAX(value) as max_value,
  COUNT(*) as total_readings
FROM sensor_data
WHERE device_id = 'DEVICE_ID'
  AND created_at BETWEEN '2024-01-01' AND '2024-01-31';
```

**Solutions**:
1. Check timezone conversions
2. Verify aggregation periods
3. Check for null/invalid values
4. Review calculation formulas
5. Verify unit conversions

## Performance Issues

### Slow Page Loading

**Symptoms**: Pages take >3 seconds to load

**Browser Diagnostics**:
```javascript
// Check performance timing
console.log(performance.timing);

// Measure specific operations
performance.mark('start-fetch');
await fetchData();
performance.mark('end-fetch');
performance.measure('fetch-time', 'start-fetch', 'end-fetch');
```

**Solutions**:
1. Clear browser cache
2. Disable browser extensions
3. Check network speed
4. Try different browser
5. Contact support if persistent

### API Timeouts

**Symptoms**: "Request timeout" errors, spinning loaders

**Diagnostic Tools**:
```bash
# Test API response time
time curl https://api.vertical-farm.com/health

# Check specific endpoint
curl -w "@curl-format.txt" -o /dev/null -s \
  https://api.vertical-farm.com/api/v1/farms

# curl-format.txt:
time_namelookup:  %{time_namelookup}\n
time_connect:  %{time_connect}\n
time_appconnect:  %{time_appconnect}\n
time_pretransfer:  %{time_pretransfer}\n
time_redirect:  %{time_redirect}\n
time_starttransfer:  %{time_starttransfer}\n
time_total:  %{time_total}\n
```

**Solutions**:
1. Check server status page
2. Reduce request payload size
3. Implement pagination
4. Use caching where possible
5. Try during off-peak hours

## Integration Problems

### Home Assistant Not Connecting

**Symptoms**: "Connection failed", devices not syncing

**Diagnostic Steps**:
```python
# Test connection script
import requests

# Test Home Assistant
response = requests.get(
    'http://homeassistant.local:8123/api/',
    headers={'Authorization': f'Bearer {TOKEN}'}
)
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")
```

**Solutions**:
1. Verify HA URL is correct
2. Check token hasn't expired
3. Verify network connectivity
4. Check Cloudflare service token (if used)
5. Review HA logs for errors

### Square Payment Failures

**Symptoms**: Payments not processing, "Payment failed"

**Debugging**:
```typescript
// Check Square webhook logs
const webhookLogs = await getSquareWebhookLogs();
console.log('Recent failures:', webhookLogs.filter(l => l.status === 'failed'));

// Verify configuration
const config = await getSquareConfig();
console.log('Environment:', config.environment); // Should be 'production' for real payments
```

**Solutions**:
1. Verify Square credentials
2. Check sandbox vs production mode
3. Verify webhook URLs
4. Check payment method validity
5. Review Square dashboard for errors

## Mobile App Issues

### PWA Not Installing

**Symptoms**: No install prompt, "Add to Home Screen" missing

**Requirements Check**:
```javascript
// Check PWA requirements
if ('serviceWorker' in navigator) {
  console.log('✓ Service Worker supported');
}
if (window.location.protocol === 'https:') {
  console.log('✓ HTTPS enabled');
}
// Check manifest
fetch('/manifest.json')
  .then(r => r.json())
  .then(m => console.log('✓ Manifest valid:', m));
```

**Solutions**:
1. Ensure using HTTPS
2. Clear browser cache
3. Check manifest.json is valid
4. Verify service worker registration
5. Try different browser

### Push Notifications Not Working

**Symptoms**: Not receiving notifications, permission denied

**Diagnostic Code**:
```javascript
// Check notification permission
console.log('Permission:', Notification.permission);

// Request permission
Notification.requestPermission().then(permission => {
  console.log('New permission:', permission);
});

// Test notification
if (Notification.permission === 'granted') {
  new Notification('Test', { body: 'This is a test notification' });
}
```

**Solutions**:
1. Check browser notification settings
2. Verify VAPID keys configured
3. Check service worker is active
4. Review device settings
5. Test with different browser

## Database Issues

### Connection Pool Exhausted

**Symptoms**: "Too many connections", intermittent failures

**Monitoring**:
```sql
-- Check connection count
SELECT count(*) FROM pg_stat_activity;

-- View active connections
SELECT pid, usename, application_name, state, query_start
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;

-- Kill long-running queries
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state != 'idle'
  AND query_start < NOW() - INTERVAL '10 minutes';
```

**Solutions**:
1. Increase connection pool size
2. Reduce connection timeout
3. Implement connection pooling
4. Fix connection leaks
5. Scale database resources

### Slow Queries

**Symptoms**: Timeouts, slow page loads

**Analysis**:
```sql
-- Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 1000 -- ms
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Explain query plan
EXPLAIN ANALYZE
SELECT * FROM large_table WHERE condition = 'value';
```

**Solutions**:
1. Add missing indexes
2. Optimize query structure
3. Implement caching
4. Partition large tables
5. Upgrade database resources

## Quick Fixes Checklist

### Browser Issues
- [ ] Clear cache and cookies
- [ ] Disable extensions
- [ ] Try incognito mode
- [ ] Update browser
- [ ] Try different browser

### Network Issues
- [ ] Check internet connection
- [ ] Disable VPN/proxy
- [ ] Check firewall settings
- [ ] Verify DNS resolution
- [ ] Try mobile hotspot

### Account Issues
- [ ] Verify credentials
- [ ] Check account status
- [ ] Review permissions
- [ ] Check organization membership
- [ ] Contact administrator

### Data Issues
- [ ] Refresh page
- [ ] Check filters
- [ ] Verify date range
- [ ] Check timezone
- [ ] Clear local storage

### Performance Issues
- [ ] Reduce data range
- [ ] Enable pagination
- [ ] Clear cache
- [ ] Check network speed
- [ ] Try off-peak hours

## Getting Help

### Before Contacting Support

1. **Document the Issue**:
   - Screenshots/screen recordings
   - Error messages (exact text)
   - Steps to reproduce
   - Time and date of occurrence
   - Browser/device information

2. **Basic Troubleshooting**:
   - Try quick fixes above
   - Check status page
   - Search documentation
   - Review recent changes

3. **Gather Information**:
   ```javascript
   // Browser info
   console.log(navigator.userAgent);
   console.log('Screen:', screen.width, 'x', screen.height);
   
   // Network info
   console.log('Online:', navigator.onLine);
   console.log('Connection:', navigator.connection?.effectiveType);
   ```

### Contact Support

**Email**: support@vertical-farm.com
**Urgent**: Use in-app chat during business hours
**Documentation**: Check [full troubleshooting guide](./debugging-guide.md)

Include:
- Account email
- Issue description
- Error messages
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

---

*For advanced debugging, see [Debugging Guide](./debugging-guide.md) | For specific features, check [Feature Guides](../features/)*