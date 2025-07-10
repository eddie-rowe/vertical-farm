'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Download, Check } from 'lucide-react';

export default function PWAStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [isServiceWorkerActive, setIsServiceWorkerActive] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return;

    // Check online/offline status
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Check PWA installation status
    const checkPWAStatus = () => {
      // Check if running in standalone mode (installed PWA)
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsPWAInstalled(true);
      }
      
      // Check if running in PWA mode on iOS
      if ((window.navigator as any).standalone) {
        setIsPWAInstalled(true);
      }
    };

    // Check service worker status
    const checkServiceWorker = () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(() => {
          setIsServiceWorkerActive(true);
        });
      }
    };

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setCanInstall(true);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsPWAInstalled(true);
      setCanInstall(false);
    };

    // Initial checks
    updateOnlineStatus();
    checkPWAStatus();
    checkServiceWorker();

    // Event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Don't render in production
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 z-50 flex flex-col gap-2">
      <div className="flex gap-2">
        <Badge variant={isOnline ? "default" : "destructive"} className="text-xs">
          {isOnline ? (
            <>
              <Wifi className="h-3 w-3 mr-1" />
              Online
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3 mr-1" />
              Offline
            </>
          )}
        </Badge>

        {isPWAInstalled && (
          <Badge variant="outline" className="text-xs bg-green-50 border-green-200">
            <Check className="h-3 w-3 mr-1" />
            PWA Installed
          </Badge>
        )}

        {canInstall && !isPWAInstalled && (
          <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200">
            <Download className="h-3 w-3 mr-1" />
            Can Install
          </Badge>
        )}

        {isServiceWorkerActive && (
          <Badge variant="outline" className="text-xs bg-purple-50 border-purple-200">
            SW Active
          </Badge>
        )}
      </div>

      <div className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded border">
        Dev: PWA Status
      </div>
    </div>
  );
} 