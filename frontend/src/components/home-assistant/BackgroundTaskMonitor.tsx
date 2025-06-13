import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Activity,
  BarChart3,
  Settings,
  Database,
  Zap
} from 'lucide-react';

interface TaskLog {
  id: number;
  task_id: string;
  task_type: string;
  priority: 'critical' | 'high' | 'normal' | 'low';
  success: boolean;
  execution_time: number;
  error_message?: string;
  retry_count: number;
  created_at: string;
}

interface QueueStat {
  name: string;
  length: number;
  oldest_message_age: number;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  success_rate: number;
  total_queue_length: number;
  queue_stats: Array<{
    queue_name: string;
    queue_length: number;
    oldest_msg_age_seconds: number;
  }>;
  recent_task_count: number;
  timestamp: string;
}

interface RegisteredFunction {
  name: string;
  description: string;
  priority: string;
  estimated_duration: string;
}

const BackgroundTaskMonitor: React.FC = () => {
  const [queueStats, setQueueStats] = useState<QueueStat[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [registeredFunctions, setRegisteredFunctions] = useState<RegisteredFunction[]>([]);
  const [taskLogs, setTaskLogs] = useState<TaskLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch queue statistics
  const fetchQueueStats = async () => {
    try {
      const response = await fetch('/api/v1/background-tasks/queues', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch queue stats');
      
      const data = await response.json();
      setQueueStats(data.queues || []);
    } catch (err) {
      console.error('Error fetching queue stats:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Fetch system health
  const fetchSystemHealth = async () => {
    try {
      const response = await fetch('/api/v1/background-tasks/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch system health');
      
      const data = await response.json();
      setSystemHealth(data);
    } catch (err) {
      console.error('Error fetching system health:', err);
    }
  };

  // Fetch registered functions
  const fetchRegisteredFunctions = async () => {
    try {
      const response = await fetch('/api/v1/background-tasks/functions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch registered functions');
      
      const data = await response.json();
      setRegisteredFunctions(data.functions || []);
    } catch (err) {
      console.error('Error fetching registered functions:', err);
    }
  };

  // Fetch task logs
  const fetchTaskLogs = async () => {
    try {
      const response = await fetch('/api/v1/background-tasks/logs?limit=50', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch task logs');
      
      const data = await response.json();
      setTaskLogs(data.logs || []);
    } catch (err) {
      console.error('Error fetching task logs:', err);
    }
  };

  // Trigger manual queue processing
  const triggerProcessing = async () => {
    try {
      const response = await fetch('/api/v1/background-tasks/trigger/process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to trigger processing');
      
      // Refresh data after triggering
      await refreshData();
    } catch (err) {
      console.error('Error triggering processing:', err);
      setError(err instanceof Error ? err.message : 'Failed to trigger processing');
    }
  };

  // Refresh all data
  const refreshData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchQueueStats(),
        fetchSystemHealth(),
        fetchRegisteredFunctions(),
        fetchTaskLogs()
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    refreshData();
    
    if (autoRefresh) {
      const interval = setInterval(refreshData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Get status color and icon
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'healthy':
        return { color: 'bg-green-500', icon: CheckCircle, text: 'Healthy' };
      case 'degraded':
        return { color: 'bg-yellow-500', icon: AlertTriangle, text: 'Degraded' };
      case 'unhealthy':
        return { color: 'bg-red-500', icon: XCircle, text: 'Unhealthy' };
      default:
        return { color: 'bg-gray-500', icon: Activity, text: 'Unknown' };
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'normal':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading background task monitor...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Background Task Monitor</h2>
          <p className="text-sm text-muted-foreground">Powered by Supabase Queues & Edge Functions</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {autoRefresh ? 'Pause' : 'Resume'} Auto-refresh
          </Button>
          <Button variant="outline" size="sm" onClick={triggerProcessing}>
            <Zap className="h-4 w-4 mr-1" />
            Process Now
          </Button>
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* System Health Overview */}
      {systemHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-3">
                {(() => {
                  const { color, icon: Icon, text } = getStatusDisplay(systemHealth.status);
                  return (
                    <>
                      <div className={`w-3 h-3 rounded-full ${color}`} />
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{text}</span>
                    </>
                  );
                })()}
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold">{systemHealth.success_rate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold">{systemHealth.total_queue_length}</p>
                <p className="text-sm text-muted-foreground">Queued Tasks</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold">{systemHealth.recent_task_count}</p>
                <p className="text-sm text-muted-foreground">Recent Tasks</p>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Overall Success Rate</span>
                <span>{systemHealth.success_rate.toFixed(1)}%</span>
              </div>
              <Progress value={systemHealth.success_rate} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="queues">Queue Status</TabsTrigger>
          <TabsTrigger value="functions">Available Functions</TabsTrigger>
          <TabsTrigger value="logs">Recent Logs</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {queueStats.map((queue) => (
              <Card key={queue.name}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground capitalize">
                        {queue.name.replace('_tasks', '').replace('_', ' ')} Queue
                      </p>
                      <p className="text-2xl font-bold">{queue.length}</p>
                      {queue.oldest_message_age > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Oldest: {Math.round(queue.oldest_message_age / 60)}m ago
                        </p>
                      )}
                    </div>
                    <Activity className={`h-8 w-8 ${getPriorityColor(queue.name.replace('_tasks', '')).split(' ')[0]}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Queue Status Tab */}
        <TabsContent value="queues" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {queueStats.map((queue) => (
              <Card key={queue.name} className={`border-l-4 ${getPriorityColor(queue.name.replace('_tasks', '')).split(' ').slice(2).join(' ')}`}>
                <CardHeader>
                  <CardTitle className={`capitalize ${getPriorityColor(queue.name.replace('_tasks', '')).split(' ')[0]}`}>
                    {queue.name.replace('_tasks', '').replace('_', ' ')} Priority
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Tasks Queued:</span>
                      <span className="font-bold">{queue.length}</span>
                    </div>
                    {queue.oldest_message_age > 0 && (
                      <div className="flex justify-between">
                        <span>Oldest Message:</span>
                        <span className="font-bold">{Math.round(queue.oldest_message_age / 60)} minutes ago</span>
                      </div>
                    )}
                    {queue.length === 0 && (
                      <p className="text-sm text-muted-foreground">No tasks in queue</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Registered Functions Tab */}
        <TabsContent value="functions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {registeredFunctions.map((func, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{func.name}</CardTitle>
                  <Badge variant="outline" className={getPriorityColor(func.priority)}>
                    {func.priority} priority
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{func.description}</p>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    Est. duration: {func.estimated_duration}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Task Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Task Execution Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {taskLogs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No recent task logs</p>
                ) : (
                  taskLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {log.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium">{log.task_type}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className={getPriorityColor(log.priority)}>
                          {log.priority}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {log.execution_time}ms
                          {log.retry_count > 0 && ` (retry ${log.retry_count})`}
                        </p>
                        {log.error_message && (
                          <p className="text-xs text-red-500 mt-1 max-w-xs truncate">
                            {log.error_message}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BackgroundTaskMonitor; 