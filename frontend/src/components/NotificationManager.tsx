'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  subscribeToPushNotifications, 
  unsubscribeFromPushNotifications,
  getVapidPublicKey 
} from '@/lib/actions/push-notifications';

type NotificationPermission = 'default' | 'granted' | 'denied';

export default function NotificationManager() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [vapidKey, setVapidKey] = useState<string | null>(null);

  useEffect(() => {
    // Check if notifications are supported
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      return;
    }

    // Get current permission status
    setPermission(Notification.permission);

    // Check if user is already subscribed
    checkSubscriptionStatus();

    // Get VAPID key
    getVapidPublicKey().then(setVapidKey);
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      }
    } catch (error) {
      console.error('Failed to check subscription status:', error);
    }
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications');
      return;
    }

    setIsLoading(true);

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === 'granted') {
        await subscribeToNotifications();
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToNotifications = async () => {
    if (!vapidKey) {
      console.error('VAPID key not available');
      return;
    }

    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      // Convert subscription to the format expected by the server
      const subscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(subscription.getKey('auth')!),
        },
      };

      const result = await subscribeToPushNotifications(subscriptionData);
      
      if (result.success) {
        setIsSubscribed(true);
      } else {
        console.error('Failed to subscribe:', result.error);
      }
    } catch (error) {
      console.error('Failed to subscribe to notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribeFromNotifications = async () => {
    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        
        const subscriptionData = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
            auth: arrayBufferToBase64(subscription.getKey('auth')!),
          },
        };

        await unsubscribeFromPushNotifications(subscriptionData);
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('Failed to unsubscribe from notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render in production for now (can be enabled later)
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  // Don't render if notifications aren't supported
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return null;
  }

  const getStatusBadge = () => {
    if (permission === 'denied') {
      return (
        <Badge variant="destructive" className="text-xs">
          <X className="h-3 w-3 mr-1" />
          Blocked
        </Badge>
      );
    }

    if (isSubscribed) {
      return (
        <Badge variant="default" className="text-xs bg-green-100 text-green-800 border-green-200">
          <Check className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="text-xs">
        <Bell className="h-3 w-3 mr-1" />
        Available
      </Badge>
    );
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm">
      <div className="bg-card border rounded-lg shadow-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-sm">Farm Notifications</h3>
          </div>
          {getStatusBadge()}
        </div>

        <p className="text-xs text-muted-foreground">
          Get alerts for temperature changes, growth milestones, and system issues
        </p>

        <div className="flex space-x-2">
          {permission === 'granted' && !isSubscribed && (
            <Button
              onClick={subscribeToNotifications}
              disabled={isLoading}
              size="sm"
              className="flex-1"
            >
              <Bell className="h-4 w-4 mr-2" />
              {isLoading ? 'Enabling...' : 'Enable Alerts'}
            </Button>
          )}

          {permission === 'default' && (
            <Button
              onClick={requestPermission}
              disabled={isLoading}
              size="sm"
              className="flex-1"
            >
              <Bell className="h-4 w-4 mr-2" />
              {isLoading ? 'Requesting...' : 'Allow Notifications'}
            </Button>
          )}

          {isSubscribed && (
            <Button
              onClick={unsubscribeFromNotifications}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <BellOff className="h-4 w-4 mr-2" />
              {isLoading ? 'Disabling...' : 'Disable'}
            </Button>
          )}

          {permission === 'denied' && (
            <div className="text-xs text-muted-foreground">
              Enable notifications in browser settings to receive farm alerts
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Utility functions
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((b) => binary += String.fromCharCode(b));
  return window.btoa(binary);
} 