"use client";

import { CheckCircle, XCircle, AlertCircle, Loader2, Info } from "lucide-react";
import React, { useEffect, useState } from "react";

export type FeedbackType = "success" | "error" | "warning" | "info" | "loading";

export interface FeedbackMessage {
  id: string;
  type: FeedbackType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
}

interface ActionFeedbackProps {
  messages: FeedbackMessage[];
  onDismiss: (id: string) => void;
  position?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "top-center";
}

const ActionFeedback: React.FC<ActionFeedbackProps> = ({
  messages,
  onDismiss,
  position = "top-right",
}) => {
  const [visibleMessages, setVisibleMessages] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    messages.forEach((message) => {
      if (!visibleMessages.has(message.id)) {
        setVisibleMessages((prev) => new Set([...prev, message.id]));

        if (!message.persistent && message.type !== "loading") {
          const duration =
            message.duration || (message.type === "error" ? 6000 : 4000);
          setTimeout(() => {
            onDismiss(message.id);
          }, duration);
        }
      }
    });
  }, [messages, visibleMessages, onDismiss]);

  const getIcon = (type: FeedbackType) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case "info":
        return <Info className="w-5 h-5 text-blue-500" />;
      case "loading":
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getBackgroundColor = (type: FeedbackType) => {
    switch (type) {
      case "success":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      case "error":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
      case "info":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
      case "loading":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
      default:
        return "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800";
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case "top-right":
        return "fixed top-4 right-4 z-50";
      case "top-left":
        return "fixed top-4 left-4 z-50";
      case "bottom-right":
        return "fixed bottom-4 right-4 z-50";
      case "bottom-left":
        return "fixed bottom-4 left-4 z-50";
      case "top-center":
        return "fixed top-4 left-1/2 transform -translate-x-1/2 z-50";
      default:
        return "fixed top-4 right-4 z-50";
    }
  };

  if (messages.length === 0) return null;

  return (
    <div className={`${getPositionClasses()} max-w-md space-y-2`}>
      {messages.map((message) => (
        <div
          key={message.id}
          className={`
            ${getBackgroundColor(message.type)}
            border rounded-lg p-4 shadow-lg backdrop-blur-sm
            transform transition-all duration-300 ease-in-out
            animate-in slide-in-from-top-2 fade-in-0
            hover:shadow-xl
          `}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">{getIcon(message.type)}</div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {message.title}
              </h4>
              {message.message && (
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                  {message.message}
                </p>
              )}
            </div>
            {!message.persistent && message.type !== "loading" && (
              <button
                onClick={() => onDismiss(message.id)}
                className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                aria-label="Dismiss notification"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Progress bar for loading states */}
          {message.type === "loading" && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full animate-pulse"></div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ActionFeedback;
