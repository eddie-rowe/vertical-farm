import React from 'react';
import { Button } from '@/components/ui/button';
import { ActionButtonProps } from '../types';

export const ActionButton: React.FC<ActionButtonProps> = ({ 
  action, 
  impact, 
  urgency,
  onClick = () => {} 
}) => {
  const getVariant = (urgency: 'low' | 'medium' | 'high') => {
    switch (urgency) {
      case 'high': return 'default';
      case 'medium': return 'outline';
      case 'low': return 'ghost';
      default: return 'outline';
    }
  };

  const getAnimation = (urgency: 'low' | 'medium' | 'high') => {
    switch (urgency) {
      case 'high': return 'animate-pulse';
      case 'medium': return 'hover:animate-pulse';
      case 'low': return '';
      default: return '';
    }
  };

  const getUrgencyColor = (urgency: 'low' | 'medium' | 'high') => {
    switch (urgency) {
      case 'high': return 'bg-red-500 text-white border-red-500';
      case 'medium': return 'border-orange-500 text-orange-700 hover:bg-orange-50';
      case 'low': return 'text-green-700 hover:bg-green-50';
      default: return '';
    }
  };

  return (
    <Button
      variant={getVariant(urgency)}
      size="sm"
      className={`w-full justify-between text-left p-3 h-auto ${getAnimation(urgency)} ${getUrgencyColor(urgency)}`}
      onClick={onClick}
    >
      <div className="flex flex-col items-start">
        <span className="text-sm font-medium">{action}</span>
        <span className="text-xs opacity-75">{impact}</span>
      </div>
      <div className={`w-2 h-2 rounded-full ${
        urgency === 'high' ? 'bg-red-500' :
        urgency === 'medium' ? 'bg-orange-500' :
        'bg-green-500'
      }`} />
    </Button>
  );
}; 