import React from 'react';
import { ArrowTopRightOnSquareIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface IntegrationCardProps {
  name: string;
  icon: string;
  benefit: string;
  setupTime?: string;
  status: 'available' | 'connected' | 'coming-soon';
  onConnect?: () => void;
  difficulty?: 'easy' | 'medium' | 'advanced';
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({
  name,
  icon,
  benefit,
  setupTime = '2 min',
  status,
  onConnect,
  difficulty = 'easy'
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'border-farm-border bg-farm-muted state-growing';
      case 'coming-soon':
        return 'border-farm-border bg-farm-muted opacity-60 state-offline';
      default:
        return 'border-farm-border bg-farm-white hover:border-farm-accent hover:shadow-md state-active';
    }
  };

  const getStatusIcon = () => {
    if (status === 'connected') {
      return <CheckCircleIcon className="w-5 h-5 text-farm-accent" />;
    }
    return null;
  };

  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'easy':
        return 'text-farm-accent bg-farm-accent/10';
      case 'medium':
        return 'text-control-accent bg-control-accent/10';
      case 'advanced':
        return 'text-sensor-critical bg-sensor-critical/10';
      default:
        return 'text-farm-accent bg-farm-accent/10';
    }
  };

  return (
    <div className={`relative p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${getStatusColor()}`}
         onClick={status === 'available' ? onConnect : undefined}>
      
      {/* Status indicator */}
      <div className="absolute top-3 right-3">
        {getStatusIcon()}
      </div>

      {/* Integration Icon */}
      <div className="flex items-center mb-3">
        <div className="relative w-10 h-10 mr-3">
          <Image
            src={icon}
            alt={`${name} logo`}
            fill
            className="object-contain rounded"
          />
        </div>
        <h3 className="font-semibold text-farm-title">{name}</h3>
      </div>

      {/* Benefit description */}
      <p className="text-sm text-control-content mb-4 leading-relaxed">{benefit}</p>

      {/* Setup info and CTA */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs text-control-label">
          <ClockIcon className="w-3 h-3" />
          <span>{setupTime} setup</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor()}`}>
            {difficulty}
          </span>
        </div>

        {status === 'available' && (
          <button className="text-sm text-farm-accent hover:text-control-accent font-medium flex items-center">
            Connect
            <ArrowTopRightOnSquareIcon className="w-3 h-3 ml-1" />
          </button>
        )}

        {status === 'connected' && (
          <span className="text-sm text-farm-accent font-medium">Connected</span>
        )}

        {status === 'coming-soon' && (
          <span className="text-sm text-control-label font-medium">Coming Soon</span>
        )}
      </div>
    </div>
  );
};

export default IntegrationCard; 