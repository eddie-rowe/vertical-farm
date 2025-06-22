## Multi-Tenant Architecture Overview

Looking at our current database schema, we have a solid foundation:

```
user_profiles → farms → rows → racks → shelves → schedules
                  ↓
            device_assignments → scheduled_actions
```

Each user is isolated at the **farm level**, ensuring complete independence between users.

## The Reliability Implementation

### 1. **Scheduled Action Generation**
When a user starts a new grow schedule, the system automatically generates all required actions for the entire grow cycle:

```sql
-- Example: User A starts lettuce (30-day cycle, water every 4 hours, 16h light cycle)
-- System creates ~360 scheduled actions (180 watering + 60 light on/off + nutrients, etc.)
```

### 2. **Cron-Based Execution Engine**
We'd implement a dedicated Edge Function that runs every minute:

```typescript
// supabase/functions/scheduled-action-processor/index.ts
export default async function(req: Request) {
  // Get all farms with pending actions in next 60 seconds
  const farms = await getFarmsWithPendingActions();
  
  // Process each farm independently (parallel execution)
  await Promise.allSettled(
    farms.map(farm => processFarmActions(farm.id))
  );
}
```

### 3. **Farm-Isolated Processing**
Each farm's actions are processed in complete isolation:

```sql
-- Process only User A's farm actions
SELECT sa.* FROM scheduled_actions sa
JOIN device_assignments da ON sa.device_assignment_id = da.id
JOIN farms f ON (da.farm_id = f.id OR da.row_id IN (SELECT id FROM rows WHERE farm_id = f.id))
WHERE f.id = 'user-a-farm-id'
  AND sa.execution_time <= NOW() + INTERVAL '1 minute'
  AND sa.status = 'pending';
```

### 4. **Failure Isolation & Recovery**
If User A's Home Assistant is offline, it doesn't affect Users B or C:

```typescript
async function processFarmActions(farmId: string) {
  try {
    const actions = await getPendingActions(farmId);
    
    for (const action of actions) {
      try {
        await executeAction(action);
        await markActionExecuted(action.id);
      } catch (error) {
        await handleActionFailure(action.id, error);
        // Retry logic: 1min, 5min, 15min, then mark failed
      }
    }
  } catch (farmError) {
    // Farm-level error doesn't affect other farms
    await logFarmError(farmId, farmError);
  }
}
```

## Real-World Example Scenario

Let's say at 8:00 AM:

- **User A (Lettuce Farm)**: 3 shelves need watering, 2 need lights on
- **User B (Tomato Farm)**: 1 shelf needs nutrient dosing, 4 need lights on  
- **User C (Herb Farm)**: 2 shelves need watering, 1 needs fan activation

Our system processes these **concurrently** and **independently**:

```typescript
// 8:00 AM execution
await Promise.allSettled([
  processFarmActions('user-a-farm'), // 5 actions
  processFarmActions('user-b-farm'), // 5 actions  
  processFarmActions('user-c-farm'), // 3 actions
]);

// Even if User B's Home Assistant is down, 
// Users A and C still get their automation
```

## Reliability Guarantees

### **Database-Level Reliability**
```sql
-- Atomic action execution with logging
CREATE OR REPLACE FUNCTION execute_scheduled_action(action_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update status to 'executing' to prevent duplicates
  UPDATE scheduled_actions 
  SET status = 'executing', executed_at = NOW()
  WHERE id = action_id AND status = 'pending';
  
  -- If no rows updated, action already processed
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Execute the actual device control
  -- (This calls our immediate device control functions)
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

### **Retry Logic with Exponential Backoff**
```typescript
const retrySchedule = [
  1 * 60 * 1000,    // 1 minute
  5 * 60 * 1000,    // 5 minutes  
  15 * 60 * 1000,   // 15 minutes
  60 * 60 * 1000,   // 1 hour
];

async function handleActionFailure(actionId: string, error: Error) {
  const action = await getAction(actionId);
  const retryCount = action.retry_count || 0;
  
  if (retryCount < retrySchedule.length) {
    // Schedule retry
    await scheduleRetry(actionId, retrySchedule[retryCount]);
  } else {
    // Mark as failed, alert farm manager
    await markActionFailed(actionId, error.message);
    await alertFarmManager(action.farm_id, actionId);
  }
}
```

### **Circuit Breaker for Problematic Devices**
```sql
-- Temporarily disable devices with repeated failures
CREATE OR REPLACE FUNCTION check_device_health(device_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  failure_count INTEGER;
BEGIN
  -- Count failures in last hour
  SELECT COUNT(*) INTO failure_count
  FROM scheduled_actions sa
  WHERE sa.device_assignment_id = device_id
    AND sa.status = 'failed'
    AND sa.executed_at > NOW() - INTERVAL '1 hour';
    
  -- If 3+ failures, temporarily disable
  IF failure_count >= 3 THEN
    UPDATE device_assignments 
    SET status = 'temporarily_disabled'
    WHERE id = device_id;
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

## Monitoring Dashboard

Farm managers see real-time automation status:

- ✅ **Shelf A-1**: Watered at 8:00 AM (Success)
- ✅ **Shelf A-2**: Lights on at 8:00 AM (Success)  
- ❌ **Shelf A-3**: Watering failed - pump offline (Retrying in 5 min)
- ⏳ **Shelf A-4**: Nutrient dose scheduled for 8:30 AM

System administrators see health across all 50 farms:
- **Farm Success Rate**: 98.5% (last 24h)
- **Active Farms**: 47/50 (3 have temporary issues)
- **Actions Processed**: 2,847 today
- **Failed Actions**: 23 (all retrying or resolved)

## Scalability Benefits

This architecture scales beautifully because:

1. **Parallel Processing**: All 50 farms process simultaneously
2. **Database Efficiency**: Indexed queries by farm and execution time
3. **Resource Isolation**: One farm's issues don't consume resources from others
4. **Horizontal Scaling**: Can easily handle 500+ farms with the same pattern

The result is a system where each user gets reliable, independent automation regardless of what happens with other users' farms. Your lettuce gets watered on schedule even if someone else's tomato farm has connectivity issues!