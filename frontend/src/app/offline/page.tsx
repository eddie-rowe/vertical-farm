"use client";

import { WifiOff, Leaf, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md mx-auto text-center px-6">
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
            <WifiOff className="w-12 h-12 text-muted-foreground" />
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-4">
            You're Offline
          </h1>

          <p className="text-muted-foreground text-lg mb-6">
            Your farm data is safely cached. Some features may be limited until
            you reconnect.
          </p>
        </div>

        <div className="bg-card border rounded-lg p-6 mb-8">
          <div className="flex items-center justify-center mb-4">
            <Leaf className="w-8 h-8 text-green-600 mr-3" />
            <span className="text-lg font-semibold">Offline Mode Active</span>
          </div>

          <div className="text-sm text-muted-foreground space-y-2">
            <p>✓ View cached sensor readings</p>
            <p>✓ Browse historical data</p>
            <p>✓ Access plant care guides</p>
            <p>⚠ Real-time updates unavailable</p>
          </div>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => window.location.reload()}
            className="w-full"
            size="lg"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>

          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="w-full"
            size="lg"
          >
            Go Back
          </Button>
        </div>

        <div className="mt-8 text-xs text-muted-foreground">
          <p>
            Your vertical farm app works offline! Data will sync automatically
            when you reconnect.
          </p>
        </div>
      </div>
    </div>
  );
}
