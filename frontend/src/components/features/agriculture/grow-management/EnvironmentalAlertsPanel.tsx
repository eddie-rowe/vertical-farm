import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Thermometer, 
  Droplets, 
  CheckCircle,
  Clock,
  X
} from 'lucide-react';

interface EnvironmentalAlert {
  id: string;
  schedule_id: string;
  shelf_id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  current_value?: number;
  target_min?: number;
  target_max?: number;
  acknowledged: boolean;
  created_at: string;
}

interface EnvironmentalAlertsPanelProps {
  shelfId?: string;
  scheduleId?: string;
}

const severityConfig = {
  critical: { color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50' },
  high: { color: 'bg-orange-500', textColor: 'text-orange-700', bgColor: 'bg-orange-50' },
  medium: { color: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50' },
  low: { color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50' }
};

const alertTypeIcons = {
  temperature: <Thermometer className="h-4 w-4" />,
  humidity: <Droplets className="h-4 w-4" />,
  harvest_ready: <CheckCircle className="h-4 w-4" />,
  harvest_approaching: <Clock className="h-4 w-4" />,
  default: <AlertTriangle className="h-4 w-4" />
};

export function EnvironmentalAlertsPanel({ shelfId, scheduleId }: EnvironmentalAlertsPanelProps) {
  const [alerts, setAlerts] = useState<EnvironmentalAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
    
    // Set up real-time subscription for new alerts
    const subscription = supabase
      .channel('environmental_alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'environmental_alerts',
          filter: shelfId ? `shelf_id=eq.${shelfId}` : undefined
        },
        (_payload) => {
          console.log('Alert update:', _payload);
          fetchAlerts(); // Refresh alerts when changes occur
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [shelfId, scheduleId]);

  const fetchAlerts = async () => {
    try {
      let query = supabase
        .from('environmental_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (shelfId) {
        query = query.eq('shelf_id', shelfId);
      }
      if (scheduleId) {
        query = query.eq('schedule_id', scheduleId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('environmental_alerts')
        .update({ 
          acknowledged: true, 
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', alertId);

      if (error) throw error;
      
      // Update local state
      setAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, acknowledged: true }
            : alert
        )
      );
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const formatValue = (value: number | undefined, type: string) => {
    if (value === undefined) return 'N/A';
    
    switch (type) {
      case 'temperature':
        return `${value.toFixed(1)}°C`;
      case 'humidity':
        return `${value.toFixed(1)}%`;
      default:
        return value.toString();
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMs = now.getTime() - alertTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const activeAlerts = alerts.filter(alert => !alert.acknowledged);
  const acknowledgedAlerts = alerts.filter(alert => alert.acknowledged);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Environmental Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading alerts...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Environmental Alerts
          {activeAlerts.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {activeAlerts.length} active
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Real-time environmental monitoring and alerts
        </p>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
            <p>No environmental alerts</p>
            <p className="text-sm">All conditions are within normal ranges</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Active Alerts */}
            {activeAlerts.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-red-700">Active Alerts</h4>
                <div className="space-y-2">
                  {activeAlerts.map((alert) => {
                    const config = severityConfig[alert.severity];
                    const icon = alertTypeIcons[alert.alert_type as keyof typeof alertTypeIcons] || alertTypeIcons.default;
                    
                    return (
                      <div key={alert.id} className={`border rounded-lg p-3 ${config.bgColor}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2 flex-1">
                            <div className={`p-1 rounded ${config.color} text-white`}>
                              {icon}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {alert.severity.toUpperCase()}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {getTimeAgo(alert.created_at)}
                                </span>
                              </div>
                              <p className={`text-sm ${config.textColor} mb-1`}>
                                {alert.message}
                              </p>
                              {alert.current_value !== undefined && (
                                <div className="text-xs text-muted-foreground">
                                  Current: {formatValue(alert.current_value, alert.alert_type)}
                                  {alert.target_min !== undefined && alert.target_max !== undefined && (
                                    <span> | Target: {formatValue(alert.target_min, alert.alert_type)} - {formatValue(alert.target_max, alert.alert_type)}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="ml-2"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Acknowledged Alerts */}
            {acknowledgedAlerts.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-muted-foreground">Recent (Acknowledged)</h4>
                <div className="space-y-2">
                  {acknowledgedAlerts.slice(0, 5).map((alert) => {
                    const icon = alertTypeIcons[alert.alert_type as keyof typeof alertTypeIcons] || alertTypeIcons.default;
                    
                    return (
                      <div key={alert.id} className="border rounded-lg p-3 bg-gray-50 opacity-75">
                        <div className="flex items-start gap-2">
                          <div className="p-1 rounded bg-gray-400 text-white">
                            {icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className="text-xs">
                                RESOLVED
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {getTimeAgo(alert.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {alert.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 