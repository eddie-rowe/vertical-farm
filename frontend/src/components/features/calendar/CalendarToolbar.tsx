'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FaChevronLeft, FaChevronRight, FaCalendarDay, FaCalendarWeek, FaCalendar, FaList } from 'react-icons/fa';
import type { CalendarView } from '@/types/calendar';

// FullCalendar-compatible toolbar props
interface CalendarToolbarProps {
  currentView: CalendarView;
  title: string;
  onNavigate: (action: 'prev' | 'next' | 'today') => void;
  onViewChange: (view: CalendarView) => void;
  availableViews?: CalendarView[];
}

const VIEW_LABELS: Record<CalendarView, string> = {
  month: 'Month',
  week: 'Week',
  work_week: 'Work Week',
  day: 'Day',
  agenda: 'Agenda'
};

const VIEW_ICONS: Record<CalendarView, React.ComponentType<{ className?: string }>> = {
  month: FaCalendar,
  week: FaCalendarWeek,
  work_week: FaCalendarWeek,
  day: FaCalendarDay,
  agenda: FaList
};

export function CalendarToolbar({ 
  currentView,
  title,
  onNavigate,
  onViewChange,
  availableViews = ['month', 'week', 'day', 'agenda']
}: CalendarToolbarProps) {
  const ViewIcon = VIEW_ICONS[currentView];

  const handleNavigate = (action: 'prev' | 'next' | 'today') => {
    onNavigate(action);
  };

  const handleViewChange = (newView: CalendarView) => {
    onViewChange(newView);
  };

  return (
    <div className="flex items-center justify-between p-4 border-b bg-background">
      {/* Navigation Controls */}
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleNavigate('today')}
          className="font-medium"
        >
          Today
        </Button>
        
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNavigate('prev')}
            aria-label="Previous period"
          >
            <FaChevronLeft className="w-3 h-3" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNavigate('next')}
            aria-label="Next period"
          >
            <FaChevronRight className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Current Period Label */}
      <div className="flex-1 text-center">
        <h2 className="text-lg font-semibold text-foreground">
          {title}
        </h2>
      </div>

      {/* View Controls */}
      <div className="flex items-center space-x-2">
        {/* Mobile View Selector */}
        <div className="sm:hidden">
          <Select value={currentView} onValueChange={(value) => handleViewChange(value as CalendarView)}>
            <SelectTrigger className="w-32">
              <SelectValue>
                <div className="flex items-center space-x-2">
                  <ViewIcon className="w-4 h-4" />
                  <span>{VIEW_LABELS[currentView]}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {availableViews.map((viewOption) => {
                const OptionIcon = VIEW_ICONS[viewOption];
                return (
                  <SelectItem key={viewOption} value={viewOption}>
                    <div className="flex items-center space-x-2">
                      <OptionIcon className="w-4 h-4" />
                      <span>{VIEW_LABELS[viewOption]}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Desktop View Buttons */}
        <div className="hidden sm:flex items-center space-x-1">
          {availableViews.map((viewOption) => {
            const OptionIcon = VIEW_ICONS[viewOption];
            return (
              <Button
                key={viewOption}
                variant={currentView === viewOption ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleViewChange(viewOption)}
                className="flex items-center space-x-2"
              >
                <OptionIcon className="w-3 h-3" />
                <span className="hidden md:inline">{VIEW_LABELS[viewOption]}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
} 