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
      case 'high': return 'destructive';
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

  const getUrgencyAccent = (urgency: 'low' | 'medium' | 'high') => {
    switch (urgency) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-orange-500';
      case 'low': return 'border-l-green-500';
      default: return '';
    }
  };

  return (
    <Button
      variant={getVariant(urgency)}
      size="sm"
      className={`w-full justify-between text-left p-3 h-auto border-l-4 ${getAnimation(urgency)} ${getUrgencyAccent(urgency)}`}
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