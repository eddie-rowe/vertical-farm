"use client";
import { useState, useEffect } from 'react';
import TopDownFarmView from '../../../components/farm-config/TopDownFarmView';
import RackDetailView from '../../../components/farm-config/RackDetailView';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FarmPageData, UUID, Rack } from "@/types/farm-layout";
import { v4 as uuidv4 } from 'uuid';

// Mock data (aligned with FarmPageData and string UUIDs)
const mockFarmPageData: FarmPageData = {
  farm: {
    id: uuidv4() as UUID,
    name: "My Vertical Farm",
    owner_id: uuidv4() as UUID,
    location: "Urban Center Rooftop",
    width: 20,
    depth: 10,
    rows: [
      {
        id: uuidv4() as UUID,
        name: "Row Alpha",
        farm_id: "farm-uuid-123" as UUID,
        position_x: 1,
        position_y: 1,
        length: 8,
        orientation: "horizontal",
        racks: [
          {
            id: uuidv4() as UUID,
            name: "Alpha-01",
            row_id: "row-uuid-abc" as UUID,
            position_in_row: 1,
            width: 1.5,
            depth: 0.8,
            height: 2.2,
            max_shelves: 5,
            shelves: [
              { id: uuidv4() as UUID, name: "A01-S1", rack_id: "rack-uuid-xyz" as UUID, position_in_rack: 1, width: 1.5, depth: 0.8, max_weight:20 },
              { id: uuidv4() as UUID, name: "A01-S2", rack_id: "rack-uuid-xyz" as UUID, position_in_rack: 2, width: 1.5, depth: 0.8, max_weight:20 },
            ]
          },
          {
            id: uuidv4() as UUID,
            name: "Alpha-02",
            row_id: "row-uuid-abc" as UUID,
            position_in_row: 2,
            width: 1.5,
            depth: 0.8,
            height: 2.2,
            max_shelves: 5,
            shelves: []
          }
        ]
      },
      {
        id: uuidv4() as UUID,
        name: "Row Bravo",
        farm_id: "farm-uuid-123" as UUID,
        position_x: 1,
        position_y: 5,
        length: 8,
        orientation: "horizontal",
        racks: []
      }
    ]
  }
};

export default function FarmsPage() {
  const [currentView, setCurrentView] = useState('top-down');
  const [editMode, setEditMode] = useState(false);
  const [selectedRackId, setSelectedRackId] = useState<UUID | null>(null);
  const [farmPageData, setFarmPageData] = useState<FarmPageData | null>(null);

  useEffect(() => {
    // Simulate fetching data or initialize with mock data
    // For consistent mock data with correct relationships, we should regenerate it here if we were to purely rely on it.
    // However, since this is just mock, simply updating the IDs to be UUIDs is the main goal.
    // A more robust mock data setup would dynamically link the farm_id and row_id.
    const farmId = mockFarmPageData.farm.id;
    mockFarmPageData.farm.rows?.forEach(row => {
      row.farm_id = farmId;
      const rowId = row.id;
      row.racks?.forEach(rack => {
        rack.row_id = rowId;
        const rackId = rack.id;
        rack.shelves?.forEach(shelf => {
          shelf.rack_id = rackId;
        });
      });
    });
    setFarmPageData(mockFarmPageData);
  }, []);

  const handleRackClick = (rackId: UUID) => {
    setSelectedRackId(rackId);
    setCurrentView('side-view');
  };

  const handleFarmPageDataChange = (newData: FarmPageData) => {
    setFarmPageData(newData);
    // Here you might also want to trigger an API call to save changes to the backend
    console.log("Farm data updated in FarmsPage:", newData);
  };

  const handleReturnToTopDownView = () => {
    setCurrentView('top-down');
    setSelectedRackId(null);
  };

  const handleRackDataChange = (updatedRack: Rack) => {
    if (!farmPageData) return;

    const newFarmPageData: FarmPageData = JSON.parse(JSON.stringify(farmPageData)); // Deep copy
    let rackFoundAndUpdated = false;

    newFarmPageData.farm.rows = newFarmPageData.farm.rows?.map(row => {
      if (row.racks) {
        const rackIndex = row.racks.findIndex(r => r.id === updatedRack.id);
        if (rackIndex !== -1) {
          // Create a new array for racks to ensure immutability at this level
          const newRacks = [...row.racks];
          newRacks[rackIndex] = updatedRack;
          rackFoundAndUpdated = true;
          return { ...row, racks: newRacks };
        }
      }
      return row;
    });

    if (rackFoundAndUpdated) {
      setFarmPageData(newFarmPageData);
      console.log("Specific rack data updated in FarmsPage:", newFarmPageData);
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

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gray-50 dark:bg-gray-950 flex flex-col items-center">
      <div className="w-full max-w-7xl flex justify-between items-center mb-6 px-2">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Farm Configuration</h1>
        <div className="flex items-center space-x-2">
          <Switch id="edit-mode-toggle" checked={editMode} onCheckedChange={setEditMode} aria-label="Toggle Edit Mode"/>
          <Label htmlFor="edit-mode-toggle" className="text-gray-700 dark:text-gray-200">Edit Mode</Label>
        </div>
      </div>
      
      <div className="w-full max-w-7xl">
        {currentView === 'top-down' && farmPageData ? (
          <TopDownFarmView 
            farmPageData={farmPageData}
            editMode={editMode}
            onRackClick={handleRackClick}
            onFarmPageDataChange={handleFarmPageDataChange}
          />
        ) : currentView === 'side-view' && selectedRackId ? (
          <RackDetailView
            rackData={getSelectedRack()}
            editMode={editMode}
            onRackDataChange={handleRackDataChange}
            onBack={handleReturnToTopDownView}
          />
        ) : (
          <div className="text-center py-10 text-gray-600 dark:text-gray-400">Loading farm data or invalid view...</div>
        )}
      </div>
    </main>
  );
}
