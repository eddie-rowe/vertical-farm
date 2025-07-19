"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  eventId?: string;
  retryCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.group("🚨 Error Boundary Caught Error");
      console.error("Error:", error);
      console.error("Error Info:", errorInfo);
      console.error("Component Stack:", errorInfo.componentStack);
      console.groupEnd();
    }

    // Update state with error info
    this.setState({
      error,
      errorInfo,
      eventId: this.generateEventId(),
    });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Report to error monitoring service (replace with your service)
    this.reportError(error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys?.some((key, idx) => key !== prevProps.resetKeys?.[idx])) {
        this.resetErrorBoundary();
      }
    }
  }

  generateEventId = (): string => {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  reportError = (error: Error, errorInfo: ErrorInfo) => {
    // Replace with your error monitoring service (Sentry, LogRocket, etc.)
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: "user-id", // Replace with actual user ID
    };

    // Log to service
    console.log("Error Report:", errorReport);

    // Example: Send to monitoring service
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorReport),
    // })
  };

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      eventId: undefined,
      retryCount: 0,
    });
  };

  handleRetry = () => {
    const newRetryCount = this.state.retryCount + 1;

    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: newRetryCount,
    });

    // Auto-reset after a delay to prevent infinite retry loops
    if (newRetryCount >= 3) {
      this.resetTimeoutId = window.setTimeout(() => {
        this.setState({ retryCount: 0 });
      }, 30000); // Reset after 30 seconds
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  copyErrorToClipboard = () => {
    const errorText = `
Error: ${this.state.error?.message}
Stack: ${this.state.error?.stack}
Component Stack: ${this.state.errorInfo?.componentStack}
Event ID: ${this.state.eventId}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
    `.trim();

    navigator.clipboard.writeText(errorText).then(() => {
      // Could show a toast here
      console.log("Error details copied to clipboard");
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isProduction = process.env.NODE_ENV === "production";
      const { error, eventId, retryCount } = this.state;

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
              <CardDescription>
                We&apos;re sorry, but something unexpected happened.
                {retryCount < 3
                  ? " You can try again or reload the page."
                  : " Please reload the page or contact support."}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {!isProduction && (
                <Alert>
                  <Bug className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Error:</strong> {error?.message}
                    <br />
                    <strong>Event ID:</strong> {eventId}
                  </AlertDescription>
                </Alert>
              )}

              {isProduction && eventId && (
                <Alert>
                  <AlertDescription className="text-sm">
                    Error ID: <code className="font-mono">{eventId}</code>
                    <br />
                    Please include this ID when contacting support.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-2">
              <div className="flex gap-2 w-full">
                {retryCount < 3 && (
                  <Button
                    onClick={this.handleRetry}
                    className="flex-1"
                    variant="outline"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                )}

                <Button
                  onClick={this.handleReload}
                  className="flex-1"
                  variant={retryCount >= 3 ? "default" : "outline"}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
              </div>

              <Button
                onClick={this.handleGoHome}
                variant="ghost"
                className="w-full"
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Homepage
              </Button>

              {!isProduction && (
                <Button
                  onClick={this.copyErrorToClipboard}
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                >
                  Copy Error Details
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }
}

export default ErrorBoundary;

// Higher-order component for easy wrapping
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, "children">,
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

// Hook for error boundary integration
export const useErrorHandler = () => {
  return (error: Error) => {
    // Re-throw error to be caught by nearest error boundary
    throw error;
  };
};
