"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Calendar, 
  Clock, 
  Eye, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  ChevronLeft,
  ChevronRight,
  Leaf,
  Droplets,
  Sun,
  Thermometer,
  Search,
  MoreHorizontal,
  Table,
  BarChart3,
  MapPin,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings
} from "lucide-react";

interface GrowTimelineItem {
  id: string;
  shelfId: string;
  shelfName: string;
  rackName: string;
  rowName: string;
  farmName: string;
  recipeName: string;
  speciesName: string;
  startDate: string;
  endDate: string;
  status: 'planned' | 'active' | 'completed' | 'aborted';
  progress: number;
  daysElapsed: number;
  daysRemaining: number;
  totalDays: number;
  yield?: number;
  automationEnabled: boolean;
  criticalAlerts: number;
  environmentalScore: number;
}

interface InteractiveGrowTimelineProps {
  selectedGrowId?: string;
  onGrowSelect?: (growId: string) => void;
  onGrowAction?: (growId: string, action: string) => void;
  viewMode?: 'timeline' | 'spatial' | 'status' | 'management';
  timeRange?: number; // days
}

export default function InteractiveGrowTimeline({
  selectedGrowId,
  onGrowSelect,
  onGrowAction,
  viewMode = 'timeline',
  timeRange = 90
}: InteractiveGrowTimelineProps) {
  const [grows, setGrows] = useState<GrowTimelineItem[]>([]);
  const [filteredGrows, setFilteredGrows] = useState<GrowTimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredGrow, setHoveredGrow] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedGrows, setSelectedGrows] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("startDate");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Mock data - replace with actual API calls
    const mockGrows: GrowTimelineItem[] = [
      {
        id: "grow-1",
        shelfId: "shelf-1",
        shelfName: "Shelf A1-1-1",
        rackName: "Rack A1-1",
        rowName: "Row A1",
        farmName: "Greenhouse A",
        recipeName: "Quick Lettuce",
        speciesName: "Lettuce",
        startDate: "2024-01-15",
        endDate: "2024-02-19",
        status: "active",
        progress: 65,
        daysElapsed: 23,
        daysRemaining: 12,
        totalDays: 35,
        automationEnabled: true,
        criticalAlerts: 0,
        environmentalScore: 92
      },
      {
        id: "grow-2",
        shelfId: "shelf-2",
        shelfName: "Shelf A1-1-2",
        rackName: "Rack A1-1",
        rowName: "Row A1",
        farmName: "Greenhouse A",
        recipeName: "Premium Basil",
        speciesName: "Basil",
        startDate: "2024-01-20",
        endDate: "2024-03-09",
        status: "active",
        progress: 40,
        daysElapsed: 20,
        daysRemaining: 29,
        totalDays: 49,
        automationEnabled: true,
        criticalAlerts: 1,
        environmentalScore: 87
      },
      {
        id: "grow-3",
        shelfId: "shelf-3",
        shelfName: "Shelf B1-1-1",
        rackName: "Rack B1-1",
        rowName: "Row B1",
        farmName: "Greenhouse A",
        recipeName: "Quick Lettuce",
        speciesName: "Lettuce",
        startDate: "2024-01-01",
        endDate: "2024-02-05",
        status: "completed",
        progress: 100,
        daysElapsed: 35,
        daysRemaining: 0,
        totalDays: 35,
        yield: 2.3,
        automationEnabled: true,
        criticalAlerts: 0,
        environmentalScore: 95
      },
      {
        id: "grow-4",
        shelfId: "shelf-4",
        shelfName: "Shelf A2-1-1",
        rackName: "Rack A2-1",
        rowName: "Row A2",
        farmName: "Greenhouse A",
        recipeName: "Micro Greens",
        speciesName: "Microgreens",
        startDate: "2024-02-10",
        endDate: "2024-02-24",
        status: "planned",
        progress: 0,
        daysElapsed: 0,
        daysRemaining: 14,
        totalDays: 14,
        automationEnabled: true,
        criticalAlerts: 0,
        environmentalScore: 0
      },
      {
        id: "grow-5",
        shelfId: "shelf-5",
        shelfName: "Shelf A1-2-1",
        rackName: "Rack A1-2",
        rowName: "Row A1",
        farmName: "Greenhouse A",
        recipeName: "Spinach Mix",
        speciesName: "Spinach",
        startDate: "2024-01-25",
        endDate: "2024-03-15",
        status: "active",
        progress: 55,
        daysElapsed: 18,
        daysRemaining: 31,
        totalDays: 49,
        automationEnabled: false,
        criticalAlerts: 2,
        environmentalScore: 78
      },
      {
        id: "grow-6",
        shelfId: "shelf-6",
        shelfName: "Shelf B2-1-1",
        rackName: "Rack B2-1",
        rowName: "Row B2",
        farmName: "Greenhouse B",
        recipeName: "Quick Lettuce",
        speciesName: "Lettuce",
        startDate: "2023-12-20",
        endDate: "2024-01-24",
        status: "aborted",
        progress: 30,
        daysElapsed: 15,
        daysRemaining: 0,
        totalDays: 35,
        automationEnabled: true,
        criticalAlerts: 5,
        environmentalScore: 45
      }
    ];

    setTimeout(() => {
      setGrows(mockGrows);
      setIsLoading(false);
    }, 500);
  }, []);

  // Filter and sort grows
  useEffect(() => {
    const filtered = grows.filter(grow => {
      const matchesSearch = searchTerm === "" || 
        grow.shelfName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grow.speciesName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grow.recipeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grow.farmName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || grow.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    // Sort grows
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'startDate':
          aValue = new Date(a.startDate);
          bValue = new Date(b.startDate);
          break;
        case 'progress':
          aValue = a.progress;
          bValue = b.progress;
          break;
        case 'daysRemaining':
          aValue = a.daysRemaining;
          bValue = b.daysRemaining;
          break;
        case 'environmentalScore':
          aValue = a.environmentalScore;
          bValue = b.environmentalScore;
          break;
        case 'shelfName':
          aValue = a.shelfName;
          bValue = b.shelfName;
          break;
        default:
          aValue = a.startDate;
          bValue = b.startDate;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredGrows(filtered);
  }, [grows, searchTerm, statusFilter, sortBy, sortOrder]);

  const getStatusColor = (status: GrowTimelineItem['status']) => {
    switch (status) {
      case 'planned': return 'bg-blue-500';
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      case 'aborted': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusBadgeColor = (status: GrowTimelineItem['status']) => {
    switch (status) {
      case 'planned': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'aborted': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: GrowTimelineItem['status']) => {
    switch (status) {
      case 'planned': return <Clock className="h-4 w-4" />;
      case 'active': return <Play className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'aborted': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleSelectGrow = (growId: string, checked: boolean) => {
    if (checked) {
      setSelectedGrows([...selectedGrows, growId]);
    } else {
      setSelectedGrows(selectedGrows.filter(id => id !== growId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedGrows(filteredGrows.map(grow => grow.id));
    } else {
      setSelectedGrows([]);
    }
  };

  const handleBulkAction = (action: string) => {
    console.log(`Performing ${action} on grows:`, selectedGrows);
    onGrowAction?.(selectedGrows.join(','), action);
    setSelectedGrows([]);
  };

  const calculateTimelinePosition = (startDate: string, endDate: string, totalDays: number) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    
    const timelineStart = new Date(today);
    timelineStart.setDate(today.getDate() - timeRange / 2);
    
    const timelineEnd = new Date(today);
    timelineEnd.setDate(today.getDate() + timeRange / 2);
    
    const timelineTotal = timelineEnd.getTime() - timelineStart.getTime();
    const itemStart = Math.max(0, (start.getTime() - timelineStart.getTime()) / timelineTotal * 100);
    const itemEnd = Math.min(100, (end.getTime() - timelineStart.getTime()) / timelineTotal * 100);
    
    return {
      left: `${itemStart}%`,
      width: `${Math.max(1, itemEnd - itemStart)}%`
    };
  };

  const renderManagementView = () => {
    return (
      <div className="space-y-4">
        {/* Management Controls */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search grows by shelf, species, recipe, or farm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              {/* Filters */}
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="aborted">Aborted</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="startDate">Start Date</SelectItem>
                    <SelectItem value="progress">Progress</SelectItem>
                    <SelectItem value="daysRemaining">Days Remaining</SelectItem>
                    <SelectItem value="environmentalScore">Score</SelectItem>
                    <SelectItem value="shelfName">Shelf Name</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
            </div>
            
            {/* Bulk Actions */}
            {selectedGrows.length > 0 && (
              <div className="flex items-center gap-2 mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <span className="text-sm font-medium">
                  {selectedGrows.length} grow{selectedGrows.length !== 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2 ml-auto">
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('pause')}>
                    <Pause className="h-4 w-4 mr-1" />
                    Pause
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('resume')}>
                    <Play className="h-4 w-4 mr-1" />
                    Resume
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('abort')}>
                    <XCircle className="h-4 w-4 mr-1" />
                    Abort
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Management Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Grow Management ({filteredGrows.length})</span>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedGrows.length === filteredGrows.length && filteredGrows.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">Select All</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 w-12"></th>
                    <th className="text-left p-2">Location</th>
                    <th className="text-left p-2">Crop</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Progress</th>
                    <th className="text-left p-2">Timeline</th>
                    <th className="text-left p-2">Health</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGrows.map((grow) => {
                    const isSelected = selectedGrows.includes(grow.id);
                    const isRowSelected = selectedGrowId === grow.id;
                    
                    return (
                      <tr 
                        key={grow.id} 
                        className={`border-b hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer ${
                          isRowSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                        onClick={() => onGrowSelect?.(grow.id)}
                      >
                        <td className="p-2">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectGrow(grow.id, checked as boolean)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        
                        <td className="p-2">
                          <div className="space-y-1">
                            <div className="font-medium text-sm">{grow.shelfName}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {grow.farmName} › {grow.rowName} › {grow.rackName}
                            </div>
                          </div>
                        </td>
                        
                        <td className="p-2">
                          <div className="space-y-1">
                            <div className="font-medium text-sm">{grow.speciesName}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">{grow.recipeName}</div>
                          </div>
                        </td>
                        
                        <td className="p-2">
                          <Badge className={`${getStatusBadgeColor(grow.status)} flex items-center gap-1 w-fit`}>
                            {getStatusIcon(grow.status)}
                            <span className="capitalize">{grow.status}</span>
                          </Badge>
                        </td>
                        
                        <td className="p-2">
                          {grow.status === 'active' ? (
                            <div className="space-y-1 min-w-24">
                              <div className="flex justify-between text-xs">
                                <span>{grow.progress}%</span>
                                <span>{grow.daysRemaining}d</span>
                              </div>
                              <Progress value={grow.progress} className="h-2" />
                            </div>
                          ) : grow.status === 'completed' && grow.yield ? (
                            <div className="text-sm text-green-600 font-medium">
                              {grow.yield} kg
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">—</span>
                          )}
                        </td>
                        
                        <td className="p-2">
                          <div className="text-xs space-y-1">
                            <div>Start: {new Date(grow.startDate).toLocaleDateString()}</div>
                            <div>End: {new Date(grow.endDate).toLocaleDateString()}</div>
                            <div className="text-gray-500">{grow.totalDays} days total</div>
                          </div>
                        </td>
                        
                        <td className="p-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                grow.environmentalScore >= 90 ? 'bg-green-500' :
                                grow.environmentalScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                              }`} />
                              <span className="text-xs">{grow.environmentalScore}%</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {grow.automationEnabled && (
                                <div className="w-2 h-2 bg-blue-400 rounded-full" title="Automation Enabled" />
                              )}
                              {grow.criticalAlerts > 0 && (
                                <div className="flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3 text-red-500" />
                                  <span className="text-xs text-red-500">{grow.criticalAlerts}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                onGrowAction?.(grow.id, 'view');
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                onGrowAction?.(grow.id, 'edit');
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                onGrowAction?.(grow.id, 'settings');
                              }}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            {grow.status === 'active' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onGrowAction?.(grow.id, 'abort');
                                }}
                              >
                                <XCircle className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {filteredGrows.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No grows found matching your criteria.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderTimelineView = () => {
    const groupedGrows = grows.reduce((groups, grow) => {
      const key = `${grow.farmName} › ${grow.rowName} › ${grow.rackName}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(grow);
      return groups;
    }, {} as Record<string, GrowTimelineItem[]>);

    return (
      <div className="space-y-4">
        {Object.entries(groupedGrows).map(([location, locationGrows]) => (
          <Card key={location} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {location}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {locationGrows.map((grow) => {
                  const timelinePos = calculateTimelinePosition(grow.startDate, grow.endDate, grow.totalDays);
                  const isSelected = selectedGrowId === grow.id;
                  const isHovered = hoveredGrow === grow.id;
                  
                  return (
                    <div
                      key={grow.id}
                      className={`relative h-12 bg-gray-100 dark:bg-gray-800 rounded-lg cursor-pointer transition-all duration-200 ${
                        isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''
                      } ${isHovered ? 'shadow-md scale-105' : ''}`}
                      onClick={() => onGrowSelect?.(grow.id)}
                      onMouseEnter={() => setHoveredGrow(grow.id)}
                      onMouseLeave={() => setHoveredGrow(null)}
                    >
                      {/* Timeline bar */}
                      <div
                        className={`absolute top-1 h-10 rounded ${getStatusColor(grow.status)} opacity-80 flex items-center px-2`}
                        style={timelinePos}
                      >
                        <div className="flex items-center gap-2 text-white text-xs font-medium">
                          <Leaf className="h-3 w-3" />
                          <span>{grow.shelfName}</span>
                          <span>•</span>
                          <span>{grow.speciesName}</span>
                        </div>
                      </div>
                      
                      {/* Progress indicator */}
                      {grow.status === 'active' && (
                        <div
                          className="absolute top-1 h-10 bg-white bg-opacity-30 rounded"
                          style={{
                            left: timelinePos.left,
                            width: `${(parseFloat(timelinePos.width.replace('%', '')) * grow.progress / 100)}%`
                          }}
                        />
                      )}
                      
                      {/* Status indicators */}
                      <div className="absolute top-1 right-1 flex items-center gap-1">
                        {grow.automationEnabled && (
                          <div className="w-2 h-2 bg-blue-400 rounded-full" title="Automation enabled" />
                        )}
                        {grow.criticalAlerts > 0 && (
                          <div className="w-2 h-2 bg-red-400 rounded-full" title={`${grow.criticalAlerts} critical alerts`} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderSpatialView = () => {
    const farmGroups = grows.reduce((groups, grow) => {
      if (!groups[grow.farmName]) groups[grow.farmName] = {};
      if (!groups[grow.farmName][grow.rowName]) groups[grow.farmName][grow.rowName] = {};
      if (!groups[grow.farmName][grow.rowName][grow.rackName]) groups[grow.farmName][grow.rowName][grow.rackName] = [];
      groups[grow.farmName][grow.rowName][grow.rackName].push(grow);
      return groups;
    }, {} as Record<string, Record<string, Record<string, GrowTimelineItem[]>>>);

    return (
      <div className="space-y-6">
        {Object.entries(farmGroups).map(([farmName, rows]) => (
          <Card key={farmName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-green-600" />
                {farmName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(rows).map(([rowName, racks]) => (
                  <div key={rowName} className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">{rowName}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(racks).map(([rackName, rackGrows]) => (
                        <Card key={rackName} className="bg-gray-50 dark:bg-gray-900">
                          <CardContent className="p-3">
                            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                              {rackName}
                            </div>
                            <div className="space-y-1">
                              {rackGrows.map((grow) => {
                                const isSelected = selectedGrowId === grow.id;
                                return (
                                  <div
                                    key={grow.id}
                                    className={`p-2 rounded cursor-pointer transition-all duration-200 ${
                                      isSelected ? 'ring-2 ring-blue-500' : 'hover:bg-white dark:hover:bg-gray-800'
                                    }`}
                                    onClick={() => onGrowSelect?.(grow.id)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded ${getStatusColor(grow.status)}`} />
                                        <span className="text-xs font-medium">{grow.shelfName}</span>
                                      </div>
                                      <Badge className={`text-xs ${getStatusBadgeColor(grow.status)}`}>
                                        {grow.status}
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                      {grow.speciesName} • {grow.recipeName}
                                    </div>
                                    {grow.status === 'active' && (
                                      <Progress value={grow.progress} className="h-1 mt-1" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderStatusView = () => {
    const statusGroups = grows.reduce((groups, grow) => {
      if (!groups[grow.status]) groups[grow.status] = [];
      groups[grow.status].push(grow);
      return groups;
    }, {} as Record<string, GrowTimelineItem[]>);

    const statusOrder: GrowTimelineItem['status'][] = ['active', 'planned', 'completed', 'aborted'];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusOrder.map((status) => {
          const statusGrows = statusGroups[status] || [];
          return (
            <Card key={status} className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm capitalize flex items-center gap-2">
                  <div className={`w-3 h-3 rounded ${getStatusColor(status)}`} />
                  {status} ({statusGrows.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {statusGrows.map((grow) => {
                    const isSelected = selectedGrowId === grow.id;
                    return (
                      <div
                        key={grow.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'ring-2 ring-blue-500 shadow-lg' 
                            : 'hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                        onClick={() => onGrowSelect?.(grow.id)}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{grow.shelfName}</span>
                            <div className="flex items-center gap-1">
                              {grow.automationEnabled && (
                                <div className="w-2 h-2 bg-blue-400 rounded-full" />
                              )}
                              {grow.criticalAlerts > 0 && (
                                <div className="w-2 h-2 bg-red-400 rounded-full" />
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {grow.speciesName} • {grow.recipeName}
                          </div>
                          <div className="text-xs text-gray-500">
                            📍 {grow.farmName} › {grow.rowName} › {grow.rackName}
                          </div>
                          {grow.status === 'active' && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>Progress</span>
                                <span>{grow.progress}%</span>
                              </div>
                              <Progress value={grow.progress} className="h-1" />
                              <div className="text-xs text-gray-500">
                                {grow.daysRemaining} days remaining
                              </div>
                            </div>
                          )}
                          {grow.status === 'completed' && grow.yield && (
                            <div className="text-xs text-green-600 font-medium">
                              Yield: {grow.yield} kg
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-lg">Loading grow timeline...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900 p-4' : ''}`}>
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {Math.round(zoomLevel * 100)}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.25))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Timeline Content */}
      <div ref={timelineRef} style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}>
        {viewMode === 'timeline' && renderTimelineView()}
        {viewMode === 'spatial' && renderSpatialView()}
        {viewMode === 'status' && renderStatusView()}
        {viewMode === 'management' && renderManagementView()}
      </div>
    </div>
  );
} 