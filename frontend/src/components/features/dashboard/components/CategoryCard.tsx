import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FaArrowUp, FaArrowDown, FaChevronRight } from 'react-icons/fa';
import { CategoryCardProps } from '../types';

export const CategoryCard: React.FC<CategoryCardProps> = ({ 
  category, 
  onClick 
}) => {
  const handleQuickAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  const getStatusColor = (status: typeof category.status) => {
    switch (status) {
      case 'good': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700';
      case 'warning': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700';
      case 'attention': return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-700';
      case 'critical': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700';
    }
  };

  const getPriorityColor = (priority: typeof category.priority) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500 bg-red-50 dark:bg-red-950';
      case 'high': return 'border-l-orange-500 bg-orange-50 dark:bg-orange-950';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950';
      case 'low': return 'border-l-green-500 bg-green-50 dark:bg-green-950';
      default: return 'border-l-gray-500 bg-gray-50 dark:bg-gray-950';
    }
  };

  const getTrendIcon = (trend: typeof category.trend) => {
    switch (trend) {
      case 'up': return <FaArrowUp className="w-3 h-3 text-green-600 dark:text-green-400" />;
      case 'down': return <FaArrowDown className="w-3 h-3 text-red-600 dark:text-red-400" />;
      case 'stable': return <span className="w-3 h-3 bg-gray-400 dark:bg-gray-500 rounded-full" />;
      default: return null;
    }
  };

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-l-4 ${getPriorityColor(category.priority)}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {category.title}
          </CardTitle>
          <Badge 
            variant="outline" 
            className={`${getStatusColor(category.status)} text-xs font-medium`}
          >
            {category.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Value and Change */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{category.value}</span>
              {getTrendIcon(category.trend)}
            </div>
            <span className={`text-sm font-medium ${
              category.trend === 'up' ? 'text-green-600 dark:text-green-400' : 
              category.trend === 'down' ? 'text-red-600 dark:text-red-400' : 
              'text-gray-600 dark:text-gray-300'
            }`}>
              {category.change}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {category.description}
          </p>

          {/* Quick Actions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Quick Actions
              </span>
              <FaChevronRight className="w-3 h-3 text-gray-400 dark:text-gray-500" />
            </div>
            <div className="flex flex-wrap gap-2">
              {category.quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs px-3 py-1 h-auto"
                  onClick={(e) => handleQuickAction(e, action.onClick)}
                >
                  {action.text}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 