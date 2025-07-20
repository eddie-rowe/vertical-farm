"use client";

import {
  BeakerIcon,
  ChartBarIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import React, { useState } from "react";

import {
  EmptyStateWithIntegrations,
  IntegrationHint,
} from "@/components/features/automation";
import {
  CropEnvironmentView,
  OperationalBusinessView,
  RiskIncidentView,
  DashboardsForecastingView,
  HeatmapsView,
} from "@/components/features/intelligence";
import { usePageData } from "@/components/shared/hooks/usePageData";
import { MetricsGrid } from "@/components/shared/metrics";
import { Card } from "@/components/ui/card";
import { FarmControlButton } from "@/components/ui/farm-control-button";
import { LoadingCard } from "@/components/ui/loading";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  FaLeaf,
  FaBuilding,
  FaExclamationTriangle,
  FaChartLine,
  FaMapMarkedAlt,
} from "@/lib/icons";
import {
  AI_INTEGRATIONS,
  INTEGRATION_MESSAGES,
  INTEGRATION_CONTEXTS,
} from "@/lib/integrations/constants";

const tabs = [
  {
    id: "crop-environment",
    label: "Crop & Environment Intelligence",
    icon: <FaLeaf className="text-sensor-value gradient-icon" />,
    component: CropEnvironmentView,
  },
  {
    id: "operational-business",
    label: "Operational & Business Intelligence",
    icon: <FaBuilding className="text-control-label gradient-icon" />,
    component: OperationalBusinessView,
  },
  {
    id: "risk-incident",
    label: "Risk & Incident Detection",
    icon: (
      <FaExclamationTriangle className="text-control-secondary gradient-icon" />
    ),
    component: RiskIncidentView,
  },
  {
    id: "dashboards-forecasting",
    label: "Dashboards & Forecasting",
    icon: <FaChartLine className="text-farm-accent gradient-icon" />,
    component: DashboardsForecastingView,
  },
  {
    id: "heatmaps",
    label: "Operations Heatmaps",
    icon: <FaMapMarkedAlt className="text-control-secondary gradient-icon" />,
    component: HeatmapsView,
  },
];

// Mock data to simulate existing AI data
interface AIData {
  analysisRuns: number;
  predictions: number;
  insights: number;
  hasData: boolean;
}

const AIPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("crop-environment");

  // Use our standardized data loading hook
  const { data: aiData, isLoading } = usePageData<AIData>({
    storageKey: "ai-integrations-connected",
    mockData: {
      analysisRuns: 24,
      predictions: 12,
      insights: 6,
      hasData: true,
    },
  });

  const activeTabData = tabs.find((tab) => tab.id === activeTab);
  const ActiveComponent = activeTabData?.component;

  const handleConnectIntegration = (integrationName: string) => {
    console.log(`Connecting to ${integrationName}...`);
    // This would typically redirect to integration setup
    window.location.href = `/integrations/${integrationName.toLowerCase().replace(/\s+/g, "-")}`;
  };

  const aiIntegrationsWithHandlers = AI_INTEGRATIONS.map((integration) => ({
    ...integration,
    onConnect: () => handleConnectIntegration(integration.name),
  }));

  if (isLoading) {
    return <LoadingCard message="Loading AI insights..." />;
  }

  // Show empty state if no AI data
  if (!aiData?.hasData) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="AI Insights & Analytics"
          description="Leverage artificial intelligence for crop analysis, yield predictions, and growth optimization."
        />

        <EmptyStateWithIntegrations
          pageType="ai"
          title="Unlock AI-Powered Farming"
          description="Connect AI platforms to enable intelligent crop analysis, predictive insights, and automated recommendations for optimal growth."
          integrations={aiIntegrationsWithHandlers}
        />
      </div>
    );
  }

  // Show dashboard with integration hints
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="AI Insights & Analytics"
        description="Leverage artificial intelligence for crop analysis, yield predictions, and growth optimization."
      />

      {/* Integration Hint */}
      <IntegrationHint
        message={INTEGRATION_MESSAGES.ai}
        integrations={[
          "OpenAI",
          "Anthropic Claude",
          "Google AI",
          "Perplexity AI",
        ]}
        pageContext={INTEGRATION_CONTEXTS.ai}
        variant="info"
      />

      {/* Standardized AI Metrics using MetricsGrid */}
      <MetricsGrid
        columns={3}
        metrics={[
          {
            id: "analysis-runs",
            label: "Analysis Runs",
            value: aiData?.analysisRuns?.toString() || "0",
            icon: BeakerIcon,
            stateClass: "state-active",
            iconColor: "h-6 w-6 text-control-label gradient-icon",
          },
          {
            id: "predictions",
            label: "Predictions Generated",
            value: aiData?.predictions?.toString() || "0",
            icon: ChartBarIcon,
            stateClass: "state-active",
            iconColor: "h-6 w-6 text-control-label gradient-icon",
          },
          {
            id: "insights",
            label: "Active Insights",
            value: aiData?.insights?.toString() || "0",
            icon: EyeIcon,
            stateClass: "state-active",
            iconColor: "h-6 w-6 text-control-label gradient-icon",
          },
        ]}
      />

      {/* Intelligence Modules Navigation */}
      <div className="bg-farm-white card-shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tabs.map((tab) => (
            <FarmControlButton
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              variant={activeTab === tab.id ? "primary" : "default"}
              className="flex flex-col items-center gap-3 p-6 h-auto"
            >
              <div className="text-2xl">{tab.icon}</div>
              <span className="text-control-label text-center leading-tight">
                {tab.label}
              </span>
            </FarmControlButton>
          ))}
        </div>
      </div>

      {/* Active Intelligence Module Content */}
      <Card className="bg-farm-white card-shadow">
        <div className="p-6">{ActiveComponent && <ActiveComponent />}</div>
      </Card>
    </div>
  );
};

export default AIPage;
