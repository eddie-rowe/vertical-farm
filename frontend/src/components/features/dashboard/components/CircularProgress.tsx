import React from 'react';
import { CircularProgressProps } from '../types';

export const CircularProgress: React.FC<CircularProgressProps> = ({ 
  value, 
  size = 120, 
  strokeWidth = 8, 
  className = "",
  showLabel = true 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const getColor = (val: number) => {
    if (val >= 80) return '#10B981'; // green-500
    if (val >= 60) return '#F59E0B'; // yellow-500
    if (val >= 40) return '#EF4444'; // red-500
    return '#6B7280'; // gray-500
  };

  const getTextColor = (val: number) => {
    if (val >= 80) return 'text-green-600';
    if (val >= 60) return 'text-yellow-600';
    if (val >= 40) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <div className="relative">
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="none"
          />
          
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getColor(value)}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-out"
          />
        </svg>
        
        {showLabel && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getTextColor(value)}`}>
                {value}%
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 