# Post-Security Audit Testing Guide

## 🎯 Overview

After implementing RLS policies and security hardening, this guide helps you systematically test and verify that all components of your vertical farming application are working correctly.

## 🚀 Quick Start

### Prerequisites
- Node.js installed
- Supabase environment variables configured
- User authenticated in your application

### Run All Tests
```bash
# From the frontend directory
cd frontend
npm run test:post-security

# Or run individual test suites
npm run test:realtime    # Real-time subscriptions
npm run test:auth        # Authentication & permissions  
npm run test:iot         # IoT device integration
```

## 📋 Test Suites

### 1. Real-time Subscriptions (`test:realtime`)
**What it tests:**
- Real-time connection establishment
- Table-specific subscriptions (farms, devices, sensors)
- User-scoped subscription filters
- Real-time event delivery

**Common Issues After RLS:**
- ❌ Subscriptions timeout due to restrictive RLS policies
- ❌ User-scoped filters blocked by permission changes
- ❌ Real-time events not received for certain tables

**Quick Fix:**
```sql
-- Check if real-time is enabled on tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('farms', 'device_assignments', 'sensor_readings');

-- Enable real-time if needed
ALTER PUBLICATION supabase_realtime ADD TABLE farms;
ALTER PUBLICATION supabase_realtime ADD TABLE device_assignments;
```

### 2. Authentication & Permissions (`test:auth`)
**What it tests:**
- User authentication flow
- Role-based access control (admin, farm_manager, operator, ha_power_user)
- User-scoped data access
- Security definer functions
- Storage bucket permissions

**Common Issues After RLS:**
- ❌ Users can't access their own data
- ❌ Role-based restrictions too strict
- ❌ Security definer functions not working
- ❌ File upload permissions broken

**Quick Fix:**
```sql
-- Check user role assignment
SELECT id, email, role FROM user_profiles WHERE email = 'your-email@example.com';

-- Verify RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
```

### 3. IoT Integration (`test:iot`)
**What it tests:**
- Device assignment CRUD operations
- Sensor data reading/writing
- Home Assistant configuration access
- Real-time device updates
- Task logging system

**Common Issues After RLS:**
- ❌ Device assignments not accessible
- ❌ Sensor data writes blocked
- ❌ HA integration configs restricted
- ❌ Background tasks failing

**Quick Fix:**
```sql
-- Check device assignment permissions
SELECT COUNT(*) FROM device_assignments; -- Should return data

-- Test sensor data access
SELECT COUNT(*) FROM sensor_readings WHERE last_updated > NOW() - INTERVAL '1 hour';
```

## 🔧 Manual Testing Checklist

### Frontend Components
- [ ] **Dashboard loads** without errors
- [ ] **Real-time updates** show live data changes
- [ ] **User profile** displays correctly
- [ ] **Farm management** allows CRUD operations
- [ ] **Device monitoring** shows current status
- [ ] **File uploads** work for documentation
- [ ] **Settings page** saves configurations

### User Roles Testing
Test with different user accounts:

- [ ] **Admin**: Full access to all farms and users
- [ ] **Farm Manager**: Access to assigned farms only
- [ ] **Operator**: Limited operational access
- [ ] **HA Power User**: Home Assistant integration access

### API Endpoints
- [ ] **Authentication** endpoints respond correctly
- [ ] **Farm data** APIs return appropriate data
- [ ] **Device management** APIs work
- [ ] **File upload** APIs accept files
- [ ] **Real-time** WebSocket connections establish

## 🚨 Critical Issues to Watch For

### 1. Real-time Subscription Failures
**Symptoms:**
- Dashboard doesn't update in real-time
- Device status appears stale
- No live sensor data

**Investigation:**
```bash
# Check browser console for WebSocket errors
# Look for "CHANNEL_ERROR" or subscription timeouts
```

### 2. Permission Denied Errors
**Symptoms:**
- "Permission denied" errors in console
- Empty data tables
- 403 errors on API calls

**Investigation:**
```sql
-- Check RLS policies for specific table
SELECT * FROM pg_policies WHERE tablename = 'farms';

-- Test direct query as user
SELECT * FROM farms; -- Run as authenticated user
```

### 3. File Upload Issues
**Symptoms:**
- File uploads fail silently
- Storage bucket access denied
- Images don't display

**Investigation:**
```javascript
// Test storage access in browser console
const { data, error } = await supabase.storage
  .from('user-uploads')
  .list();
console.log({ data, error });
```

## 🔍 Debugging Tips

### Enable Verbose Logging
```javascript
// Add to your Supabase client configuration
const supabase = createClient(url, key, {
  auth: {
    debug: true
  },
  realtime: {
    log_level: 'debug'
  }
});
```

### Check RLS Policy Coverage
```sql
-- Find tables without RLS enabled
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false;

-- Find tables without policies
SELECT t.tablename
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename
WHERE t.schemaname = 'public' 
AND p.policyname IS NULL 
AND t.rowsecurity = true;
```

### Test User Context
```sql
-- Check current user context
SELECT 
  auth.uid() as user_id,
  auth.email() as user_email,
  auth.role() as user_role;

-- Test security definer functions
SELECT is_admin();
SELECT get_user_accessible_farms();
```

## 📊 Expected Test Results

### ✅ Healthy Application
- **Real-time**: 90%+ subscription success rate
- **Authentication**: 100% user access to own data
- **IoT**: All device operations working
- **Overall**: 95%+ test pass rate

### ⚠️ Needs Attention
- **Real-time**: 70-89% success (some RLS issues)
- **Authentication**: Some role restrictions too strict
- **IoT**: Partial device access issues
- **Overall**: 80-94% test pass rate

### 🚨 Critical Issues
- **Real-time**: <70% success (major RLS problems)
- **Authentication**: Users can't access own data
- **IoT**: Device integration broken
- **Overall**: <80% test pass rate

## 🛠️ Common Fixes

### Fix Overly Restrictive RLS
```sql
-- Allow users to read their own profiles
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow farm managers to access their farms
CREATE POLICY "Farm managers can access their farms" ON farms
  FOR ALL USING (
    auth.uid() = manager_id OR 
    is_admin()
  );
```

### Fix Real-time Subscriptions
```sql
-- Enable real-time on critical tables
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE farms;
ALTER PUBLICATION supabase_realtime ADD TABLE device_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE sensor_readings;
```

### Fix Storage Permissions
```sql
-- Allow users to upload to their own folder
CREATE POLICY "Users can upload to own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-uploads' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

## 📞 Getting Help

If tests continue to fail after following this guide:

1. **Check the test output** for specific error messages
2. **Review RLS policies** for the failing tables
3. **Test with different user roles** to isolate permission issues
4. **Check Supabase logs** for server-side errors
5. **Verify environment variables** are correctly set

## 🔄 Continuous Testing

Add these tests to your CI/CD pipeline:

```yaml
# .github/workflows/post-security-tests.yml
name: Post-Security Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:post-security
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

---

**Remember**: Security hardening often breaks existing functionality. These tests help you find and fix issues quickly while maintaining your security posture. 