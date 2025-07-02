import React from 'react';
import { ChartBarIcon, Cog6ToothIcon, BeakerIcon, CloudIcon, TruckIcon } from '@heroicons/react/24/outline';
import IntegrationCard from './IntegrationCard';

interface Integration {
  name: string;
  icon: string;
  benefit: string;
  setupTime?: string;
  status: 'available' | 'connected' | 'coming-soon';
  difficulty?: 'easy' | 'medium' | 'advanced';
  onConnect?: () => void;
}

interface EmptyStateWithIntegrationsProps {
  pageType: 'business' | 'devices' | 'ai' | 'environmental' | 'inventory';
  title: string;
  description: string;
  integrations: Integration[];
  customIcon?: React.ComponentType<{ className?: string }>;
}

const EmptyStateWithIntegrations: React.FC<EmptyStateWithIntegrationsProps> = ({
  pageType,
  title,
  description,
  integrations,
  customIcon: CustomIcon
}) => {
  const getPageIcon = () => {
    if (CustomIcon) return CustomIcon;
    
    switch (pageType) {
      case 'business':
        return ChartBarIcon;
      case 'devices':
        return Cog6ToothIcon;
      case 'ai':
        return BeakerIcon;
      case 'environmental':
        return CloudIcon;
      case 'inventory':
        return TruckIcon;
      default:
        return ChartBarIcon;
    }
  };

  const PageIcon = getPageIcon();

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 min-h-[400px]">
      {/* Icon */}
      <PageIcon className="w-16 h-16 text-gray-400 mb-6" />
      
      {/* Title and Description */}
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 mb-8 max-w-md leading-relaxed">{description}</p>
      
      {/* Integration Cards Grid */}
      <div className="w-full max-w-4xl">
        <h4 className="text-sm font-medium text-gray-700 mb-4 text-left">
          Recommended Integrations:
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.map((integration, index) => (
            <IntegrationCard
              key={index}
              name={integration.name}
              icon={integration.icon}
              benefit={integration.benefit}
              setupTime={integration.setupTime}
              status={integration.status}
              difficulty={integration.difficulty}
              onConnect={integration.onConnect}
            />
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-8">
        <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors">
          Browse All Integrations
          <ChartBarIcon className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default EmptyStateWithIntegrations; 