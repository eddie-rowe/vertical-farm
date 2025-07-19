import React, { useState } from "react";
import {
  LightBulbIcon,
  XMarkIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

interface IntegrationHintProps {
  message: string;
  integrations: string[];
  pageContext: string;
  onDismiss?: () => void;
  isDismissible?: boolean;
  variant?: "info" | "success" | "warning";
}

const IntegrationHint: React.FC<IntegrationHintProps> = ({
  message,
  integrations,
  pageContext,
  onDismiss,
  isDismissible = true,
  variant = "info",
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const handleViewIntegrations = () => {
    router.push("/integrations");
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return {
          background: "bg-green-50",
          border: "border-green-200",
          text: "text-green-800",
          icon: "text-green-500",
          button: "text-green-600 hover:text-green-800",
        };
      case "warning":
        return {
          background: "bg-yellow-50",
          border: "border-yellow-200",
          text: "text-yellow-800",
          icon: "text-yellow-500",
          button: "text-yellow-600 hover:text-yellow-800",
        };
      default:
        return {
          background: "bg-blue-50",
          border: "border-blue-200",
          text: "text-blue-800",
          icon: "text-blue-500",
          button: "text-blue-600 hover:text-blue-800",
        };
    }
  };

  if (!isVisible) return null;

  const styles = getVariantStyles();

  return (
    <div
      className={`${styles.background} ${styles.border} border rounded-lg p-4 mb-6`}
    >
      <div className="flex items-start">
        <LightBulbIcon
          className={`w-5 h-5 ${styles.icon} mt-0.5 mr-3 flex-shrink-0`}
        />

        <div className="flex-1 min-w-0">
          <div className={`text-sm ${styles.text} mb-2`}>
            <strong>Enhance this page:</strong> {message}
          </div>

          {/* Integration suggestions */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`text-xs ${styles.text} opacity-75`}>
              Suggested:
            </span>
            {integrations.slice(0, 3).map((integration, index) => (
              <span
                key={index}
                className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-white bg-opacity-50 ${styles.text}`}
              >
                {integration}
              </span>
            ))}
            {integrations.length > 3 && (
              <span className={`text-xs ${styles.text} opacity-75`}>
                +{integrations.length - 3} more
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleViewIntegrations}
              className={`text-sm ${styles.button} font-medium flex items-center hover:underline transition-colors`}
            >
              View integrations
              <ArrowRightIcon className="w-3 h-3 ml-1" />
            </button>

            <button
              className={`text-xs ${styles.text} opacity-75 hover:opacity-100 transition-opacity`}
            >
              Learn more about {pageContext}
            </button>
          </div>
        </div>

        {/* Dismiss button */}
        {isDismissible && (
          <button
            onClick={handleDismiss}
            className={`${styles.icon} hover:opacity-75 transition-opacity flex-shrink-0 ml-2`}
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default IntegrationHint;
