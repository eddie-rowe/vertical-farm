"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";

// Type declarations for external services
declare global {
  interface Window {
    DD_RUM?: {
      addError: (error: Error, context?: Record<string, any>) => void;
    };
  }
}

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to monitoring service
    console.error("Application Error:", {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    // Report to external error tracking (Datadog, Sentry, etc.)
    if (typeof window !== "undefined" && window.DD_RUM) {
      window.DD_RUM.addError(error, {
        digest: error.digest,
        errorType: "application-error",
      });
    }
  }, [error]);

  const isDevelopment = process.env.NODE_ENV === "development";

  const handleReportBug = () => {
    const subject = encodeURIComponent(`Error Report: ${error.message}`);
    const body = encodeURIComponent(
      `Error Details:\n\nMessage: ${error.message}\nDigest: ${error.digest || "N/A"}\nTimestamp: ${new Date().toISOString()}\nURL: ${window.location.href}\n\nUser Agent: ${navigator.userAgent}\n\nStack Trace:\n${error.stack || "Not available"}`,
    );
    window.open(
      `mailto:support@goodgoodgreens.org?subject=${subject}&body=${body}`,
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
      <Card className="w-full max-w-md border-red-200 dark:border-red-800">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertTriangle
              className="h-8 w-8 text-red-600 dark:text-red-400"
              aria-hidden="true"
            />
          </div>
          <CardTitle className="text-xl font-semibold text-red-900 dark:text-red-100">
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            We apologize for the inconvenience. An unexpected error has occurred
            while processing your request.
          </p>

          {isDevelopment && (
            <details className="text-left">
              <summary className="cursor-pointer text-xs font-medium text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200">
                Error Details (Development)
              </summary>
              <div className="mt-2 text-xs text-muted-foreground bg-red-50 dark:bg-red-950/20 p-3 rounded border border-red-200 dark:border-red-800">
                <p>
                  <strong>Message:</strong> {error.message}
                </p>
                {error.digest && (
                  <p>
                    <strong>Digest:</strong> {error.digest}
                  </p>
                )}
                {error.stack && (
                  <div className="mt-2">
                    <strong>Stack Trace:</strong>
                    <pre className="mt-1 text-xs overflow-auto max-h-32">
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={reset}
              className="flex-1"
              variant="default"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
              Try Again
            </Button>

            <Button
              onClick={() => (window.location.href = "/")}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Home className="h-4 w-4 mr-2" aria-hidden="true" />
              Go Home
            </Button>
          </div>

          <div className="pt-2 border-t border-border">
            <Button
              onClick={handleReportBug}
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <Bug className="h-3 w-3 mr-1" aria-hidden="true" />
              Report this issue
            </Button>
          </div>

          {error.digest && (
            <p className="text-xs text-muted-foreground pt-2">
              Error ID: {error.digest}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Error boundary HOC for additional error handling
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>,
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Client-side error boundary component
class ErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error boundary caught an error:", error, errorInfo);

    // Report to monitoring service
    if (typeof window !== "undefined" && window.DD_RUM) {
      window.DD_RUM.addError(error, {
        errorInfo,
        errorType: "react-error-boundary",
      });
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const Fallback = this.props.fallback;
      if (Fallback) {
        return (
          <Fallback
            error={this.state.error}
            retry={() => this.setState({ hasError: false, error: null })}
          />
        );
      }

      return (
        <Error
          error={this.state.error as any}
          reset={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}
