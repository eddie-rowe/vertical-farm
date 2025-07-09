import { useMemo } from 'react';

/**
 * Integration interface that matches the expected structure
 */
export interface Integration {
  name: string;
  [key: string]: any;
}

/**
 * Integration with handler attached
 */
export interface IntegrationWithHandler extends Integration {
  onConnect: () => void;
}

/**
 * Configuration for useIntegrations hook
 */
export interface IntegrationsConfig {
  /** Base integrations array */
  integrations: Integration[];
  /** Page type for routing (e.g., 'business', 'ai', 'devices') */
  pageType: string;
  /** Custom integration connection handler */
  onConnect?: (integrationName: string) => void;
}

/**
 * Custom hook for standardizing integration connection handling
 * 
 * This hook encapsulates the common pattern of:
 * 1. Mapping integrations to add connection handlers
 * 2. Standardizing the connection flow
 * 3. Routing to integration setup pages
 * 
 * @param config Configuration object for the hook
 * @returns Array of integrations with connection handlers attached
 */
export function useIntegrations(config: IntegrationsConfig): IntegrationWithHandler[] {
  const { integrations, pageType, onConnect } = config;

  const defaultConnectHandler = (integrationName: string) => {
    console.log(`Connecting to ${integrationName}...`);
    // Redirect to integration setup page
    const slug = integrationName.toLowerCase().replace(/\s+/g, '-');
    window.location.href = `/integrations/${slug}`;
  };

  const connectHandler = onConnect || defaultConnectHandler;

  const integrationsWithHandlers = useMemo(() => {
    return integrations.map(integration => ({
      ...integration,
      onConnect: () => connectHandler(integration.name)
    }));
  }, [integrations, connectHandler]);

  return integrationsWithHandlers;
}

/**
 * Utility function to create integration storage key
 * @param pageType The page type (e.g., 'business', 'ai')
 * @returns The localStorage key for checking integration status
 */
export function createIntegrationStorageKey(pageType: string): string {
  return `${pageType}-integrations-connected`;
} 