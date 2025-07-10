import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyStateWithIntegrations, IntegrationHint } from '@/components/features/automation';

// Integration interface for empty state component
interface Integration {
  name: string;
  icon: string;
  benefit: string;
  setupTime?: string;
  status: 'available' | 'connected' | 'coming-soon';
  difficulty?: 'easy' | 'medium' | 'advanced';
  onConnect?: () => void;
}

/**
 * Props for empty state configuration
 */
export interface EmptyStateProps {
  /** Title for the empty state */
  title: string;
  /** Description for the empty state */
  description: string;
  /** Page type for empty state component */
  pageType: "business" | "devices" | "ai" | "environmental" | "inventory";
}

/**
 * Props for integration hint configuration
 */
export interface IntegrationHintProps {
  /** Message object for integration hints */
  message: any;
  /** Array of integration names to display */
  integrationNames: string[];
  /** Page context for integration hints */
  pageContext: any;
  /** Hint variant style */
  variant?: 'info' | 'warning' | 'success';
}

/**
 * Props for the PageLayout component
 */
export interface PageLayoutProps {
  /** Page title */
  title: string;
  /** Page description */
  description: string;
  /** Whether data is currently loading */
  isLoading?: boolean;
  /** Whether the page has meaningful data to display */
  hasData?: boolean;
  /** Integrations with connection handlers */
  integrations?: Integration[];
  /** Empty state configuration */
  emptyStateProps?: EmptyStateProps;
  /** Integration hint configuration */
  integrationHintProps?: IntegrationHintProps;
  /** Page content to render when data exists */
  children: React.ReactNode;
  /** Loading component override */
  loadingComponent?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Default loading component
 */
const DefaultLoadingComponent: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-farm-accent state-active"></div>
  </div>
);

/**
 * Standardized page layout component
 * 
 * This component provides a consistent structure for all pages including:
 * - Loading states
 * - Empty states with integration prompts
 * - Page headers
 * - Integration hints for connected pages
 * - Content areas
 */
export const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  description,
  isLoading = false,
  hasData = true,
  integrations = [],
  emptyStateProps,
  integrationHintProps,
  children,
  loadingComponent,
  className = ''
}) => {
  // Show loading state
  if (isLoading) {
    return loadingComponent || <DefaultLoadingComponent />;
  }

  // Show empty state if no data and empty state props provided
  if (!hasData && emptyStateProps) {
    return (
      <div className={`space-y-6 ${className}`}>
        <PageHeader
          title={title}
          description={description}
        />

        <EmptyStateWithIntegrations
          pageType={emptyStateProps.pageType}
          title={emptyStateProps.title}
          description={emptyStateProps.description}
          integrations={integrations}
        />
      </div>
    );
  }

  // Show main content with optional integration hints
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Page Header */}
      <PageHeader
        title={title}
        description={description}
      />

      {/* Integration Hint (only show if we have data and integration hint props) */}
      {hasData && integrationHintProps && (
        <IntegrationHint
          message={integrationHintProps.message}
          integrations={integrationHintProps.integrationNames}
          pageContext={integrationHintProps.pageContext}
          variant={integrationHintProps.variant || 'info'}
        />
      )}

      {/* Main Content */}
      {children}
    </div>
  );
};

/**
 * Utility function to create empty state props
 */
export const createEmptyStateProps = (
  pageType: "business" | "devices" | "ai" | "environmental" | "inventory",
  title: string,
  description: string
): EmptyStateProps => ({
  pageType,
  title,
  description
});

/**
 * Utility function to create integration hint props
 */
export const createIntegrationHintProps = (
  message: any,
  integrationNames: string[],
  pageContext: any,
  variant: 'info' | 'warning' | 'success' = 'info'
): IntegrationHintProps => ({
  message,
  integrationNames,
  pageContext,
  variant
}); 