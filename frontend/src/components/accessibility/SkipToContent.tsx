"use client";

import { cn } from "@/lib/utils";

export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50",
        "bg-blue-600 text-white px-4 py-2 rounded-md font-medium",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      )}
    >
      Skip to main content
    </a>
  );
}

export function FocusManager({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <SkipToContent />
      {children}
    </div>
  );
} 