"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { FaSeedling, FaCog, FaUsers, FaTruck } from "react-icons/fa";
import type { EventOverlay, EventType } from "@/types/calendar";

interface EventOverlayControlsProps {
  overlays: EventOverlay[];
  onToggle: (overlayId: EventType, enabled: boolean) => void;
}

const ICON_MAP = {
  FaSeedling: FaSeedling,
  FaCog: FaCog,
  FaUsers: FaUsers,
  FaTruck: FaTruck,
};

export function EventOverlayControls({
  overlays,
  onToggle,
}: EventOverlayControlsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Event Overlays</CardTitle>
        <p className="text-sm text-muted-foreground">
          Toggle different types of events to customize your calendar view
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {overlays.map((overlay) => {
            const IconComponent =
              ICON_MAP[overlay.icon as keyof typeof ICON_MAP];

            return (
              <div
                key={overlay.id}
                className="flex items-center space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1">
                  {IconComponent && (
                    <div
                      className="p-2 rounded-md"
                      style={{
                        backgroundColor: overlay.enabled
                          ? overlay.color
                          : "#e5e7eb",
                        color: overlay.enabled ? "white" : "#6b7280",
                      }}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">
                        {overlay.label}
                      </span>
                      {overlay.enabled && (
                        <Badge
                          variant="secondary"
                          className="text-xs"
                          style={{
                            backgroundColor: `${overlay.color}20`,
                            color: overlay.color,
                            borderColor: overlay.color,
                          }}
                        >
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {overlay.description}
                    </p>
                  </div>
                </div>

                <Switch
                  checked={overlay.enabled}
                  onCheckedChange={(checked) => onToggle(overlay.id, checked)}
                  aria-label={`Toggle ${overlay.label} events`}
                />
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {overlays.filter((o) => o.enabled).length} of {overlays.length}{" "}
              event types enabled
            </span>
            <button
              onClick={() => {
                const allEnabled = overlays.every((o) => o.enabled);
                overlays.forEach((overlay) => {
                  onToggle(overlay.id, !allEnabled);
                });
              }}
              className="text-primary hover:text-primary/80 font-medium"
            >
              {overlays.every((o) => o.enabled) ? "Hide All" : "Show All"}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
