import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StrategicCardProps } from '../types';

export const StrategicCard: React.FC<StrategicCardProps> = ({ 
  title, 
  icon: Icon, 
  children, 
  priority = "normal",
  className = "" 
}) => {
  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-500 bg-red-50 shadow-red-100';
      case 'high':
        return 'border-orange-500 bg-orange-50 shadow-orange-100';
      case 'low':
        return 'border-green-500 bg-green-50 shadow-green-100';
      case 'normal':
      default:
        return 'border-gray-200 bg-white shadow-gray-100';
    }
  };

  return (
    <Card className={`border-l-4 ${getPriorityStyles(priority)} ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
          <Icon className="w-5 h-5" />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
}; 