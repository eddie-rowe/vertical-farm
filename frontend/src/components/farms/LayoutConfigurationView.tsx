"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Grid3X3, Layers, Settings, Archive, BarChart3, Edit2, Eye, Map } from 'lucide-react';
import TopDownFarmView from '@/components/farm-config/TopDownFarmView';
import RackDetailView from '@/components/farm-config/RackDetailView';
import { FarmPageData, UUID, Rack } from "@/types/farm-layout";

interface LayoutConfigurationViewProps {
  farmPageData: FarmPageData | null;
  editMode: boolean;
  setEditMode: (editMode: boolean) => void;
  onFarmPageDataChange: (newData: FarmPageData) => void;
}

export default function LayoutConfigurationView({ 
  farmPageData, 
  editMode, 
  setEditMode, 
  onFarmPageDataChange 
}: LayoutConfigurationViewProps) {
  const [currentView, setCurrentView] = useState('top-down');
  const [selectedRackId, setSelectedRackId] = useState<UUID | null>(null);

  const handleRackClick = (rackId: UUID) => {
    setSelectedRackId(rackId);
    setCurrentView('side-view');
  };

  const handleReturnToTopDownView = () => {
    setCurrentView('top-down');
    setSelectedRackId(null);
  };

  const handleRackDataChange = (updatedRack: Rack) => {
    if (!farmPageData) return;

    const newFarmPageData: FarmPageData = JSON.parse(JSON.stringify(farmPageData));
    let rackFoundAndUpdated = false;

    newFarmPageData.farm.rows = newFarmPageData.farm.rows?.map(row => {
      if (row.racks) {
        const rackIndex = row.racks.findIndex(r => r.id === updatedRack.id);
        if (rackIndex !== -1) {
          const newRacks = [...row.racks];
          newRacks[rackIndex] = updatedRack;
          rackFoundAndUpdated = true;
          return { ...row, racks: newRacks };
        }
      }
      return row;
    });

    if (rackFoundAndUpdated) {
      onFarmPageDataChange(newFarmPageData);
      console.log("Specific rack data updated in LayoutConfigurationView:", newFarmPageData);
    } else {
      console.warn("handleRackDataChange: Rack not found, no update performed.");
    }
  };
  
  const getSelectedRack = (): Rack | null => {
    if (!farmPageData || !selectedRackId) return null;
    for (const row of farmPageData.farm.rows || []) {
      const rack = row.racks?.find(r => r.id === selectedRackId);
      if (rack) return rack;
    }
    return null;
  };

  // Calculate farm statistics
  const farmStats = farmPageData ? {
    totalRows: farmPageData.farm.rows?.length || 0,
    totalRacks: farmPageData.farm.rows?.reduce((total, row) => total + (row.racks?.length || 0), 0) || 0,
    totalShelves: farmPageData.farm.rows?.reduce((total, row) => 
      total + (row.racks?.reduce((rackTotal, rack) => 
        rackTotal + (rack.shelves?.length || 0), 0) || 0), 0) || 0,
    capacityUtilization: 75 // This would be calculated based on actual plant data
  } : null;

  if (!farmPageData) {
    return (
      <div className="text-center py-16 text-gray-600 dark:text-gray-400">
        <div className="max-w-md mx-auto">
          <Map className="h-20 w-20 mx-auto mb-6 text-gray-400" />
          <h2 className="text-2xl font-semibold mb-4">No Farm Selected</h2>
          <p className="text-lg mb-6">Select a farm from the dropdown to view and configure its layout.</p>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-left">
            <h3 className="font-medium mb-3">Layout Configuration Features:</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Visual top-down farm layout
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Interactive row and rack management
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Drag-and-drop organization
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                Detailed rack configuration
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Farm Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="animate-pop bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" />
              Total Rows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900 dark:text-green-100 mb-2">{farmStats?.totalRows}</div>
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
              Active
            </Badge>
          </CardContent>
        </Card>

        <Card className="animate-pop bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-700 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <Archive className="h-4 w-4" />
              Total Racks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-2">{farmStats?.totalRacks}</div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
              Configured
            </Badge>
          </CardContent>
        </Card>

        <Card className="animate-pop bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-700 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Total Shelves
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100 mb-2">{farmStats?.totalShelves}</div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100">
              Available
            </Badge>
          </CardContent>
        </Card>

        <Card className="animate-pop bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-700 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Capacity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900 dark:text-orange-100 mb-2">{farmStats?.capacityUtilization}%</div>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100">
              Utilized
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Edit Mode Controls */}
      <Card className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 border-slate-200 dark:border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Label htmlFor="edit-mode" className="text-base font-medium flex items-center gap-2">
                  {editMode ? <Edit2 className="h-4 w-4 text-blue-600" /> : <Eye className="h-4 w-4 text-gray-600" />}
                  {editMode ? 'Edit Mode' : 'View Mode'}
                </Label>
                <Switch 
                  id="edit-mode" 
                  checked={editMode} 
                  onCheckedChange={setEditMode}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {editMode ? 
                'Click elements to edit, drag to reorder, use buttons to add/remove' :
                'Click racks to view details, toggle edit mode to make changes'
              }
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Farm Layout Visualization */}
      <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-slate-100 to-gray-100 dark:from-slate-800 dark:to-gray-800 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold flex items-center gap-3">
              <Map className="h-6 w-6 text-blue-600" />
              Farm Layout: {farmPageData.farm.name}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Rows</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Racks</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {currentView === 'top-down' ? (
            <TopDownFarmView 
              farmPageData={farmPageData}
              editMode={editMode}
              onRackClick={handleRackClick}
              onFarmPageDataChange={onFarmPageDataChange}
            />
          ) : currentView === 'side-view' && selectedRackId ? (
            <RackDetailView
              rackData={getSelectedRack()}
              editMode={editMode}
              onRackDataChange={handleRackDataChange}
              onBack={handleReturnToTopDownView}
            />
          ) : (
            <div className="text-center py-10 text-gray-600 dark:text-gray-400">
              <p>Invalid view state</p>
              <Button onClick={handleReturnToTopDownView} className="mt-4">
                Return to Top-Down View
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 