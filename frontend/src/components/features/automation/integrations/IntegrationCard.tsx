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
        return 'border-green-200 bg-green-50';
      case 'coming-soon':
        return 'border-gray-200 bg-gray-50 opacity-60';
      default:
        return 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md';
    }
  };

  const getStatusIcon = () => {
    if (status === 'connected') {
      return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    }
    return null;
  };

  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'advanced':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-green-600 bg-green-100';
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
        <h3 className="font-semibold text-gray-900">{name}</h3>
      </div>

      {/* Benefit description */}
      <p className="text-sm text-gray-600 mb-4 leading-relaxed">{benefit}</p>

      {/* Setup info and CTA */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <ClockIcon className="w-3 h-3" />
          <span>{setupTime} setup</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor()}`}>
            {difficulty}
          </span>
        </div>

        {status === 'available' && (
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center">
            Connect
            <ArrowTopRightOnSquareIcon className="w-3 h-3 ml-1" />
          </button>
        )}

        {status === 'connected' && (
          <span className="text-sm text-green-600 font-medium">Connected</span>
        )}

        {status === 'coming-soon' && (
          <span className="text-sm text-gray-400 font-medium">Coming Soon</span>
        )}
      </div>
    </div>
  );
};

export default IntegrationCard; 