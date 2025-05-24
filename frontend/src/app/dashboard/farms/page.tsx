"use client";
import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import TopDownFarmView from '../../../components/farm-config/TopDownFarmView';
import RackDetailView from '../../../components/farm-config/RackDetailView';
import CreateFarmModal from '../../../components/CreateFarmModal';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FarmPageData, UUID, Rack } from "@/types/farm-layout";
import { getFarmDetails, getFarmsList, FarmBasicInfo, FarmResponse } from '../../../lib/apiClient';
import toast from 'react-hot-toast';

export default function FarmsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [currentView, setCurrentView] = useState('top-down');
  const [editMode, setEditMode] = useState(false);
  const [selectedRackId, setSelectedRackId] = useState<UUID | null>(null);
  const [farmPageData, setFarmPageData] = useState<FarmPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [availableFarms, setAvailableFarms] = useState<FarmBasicInfo[]>([]);
  const [selectedFarmIdForDetails, setSelectedFarmIdForDetails] = useState<UUID | null>(null);
  const [isLoadingFarmsList, setIsLoadingFarmsList] = useState(true);
  const [farmsListError, setFarmsListError] = useState<string | null>(null);

  // Authentication guard
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchAvailableFarms = async () => {
      setIsLoadingFarmsList(true);
      setFarmsListError(null);
      try {
        const response = await getFarmsList();
        setAvailableFarms(response.farms);
        if (response.farms.length > 0) {
          setSelectedFarmIdForDetails(response.farms[0].id);
        } else {
          toast.error("No farms available to display.");
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error("Failed to fetch available farms:", err);
        setFarmsListError(err.message || "An unknown error occurred while fetching farms list.");
        toast.error(err.message || "Failed to load available farms.");
        setIsLoading(false);
      } finally {
        setIsLoadingFarmsList(false);
      }
    };
    fetchAvailableFarms();
  }, []);

  useEffect(() => {
    if (!selectedFarmIdForDetails) {
      setFarmPageData(null);
      setIsLoading(false);
      return;
    }

    const fetchFarmData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getFarmDetails(selectedFarmIdForDetails);
        setFarmPageData(data);
      } catch (err: any) {
        console.error("Failed to fetch farm data:", err);
        setError(err.message || "An unknown error occurred while fetching farm data.");
        toast.error(err.message || "Failed to load farm data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFarmData();
  }, [selectedFarmIdForDetails]);

  const handleFarmCreated = (newFarm: FarmResponse) => {
    // Add the new farm to the list
    const newFarmBasicInfo: FarmBasicInfo = {
      id: newFarm.id,
      name: newFarm.name
    };
    
    setAvailableFarms(prev => [...prev, newFarmBasicInfo]);
    
    // Select the newly created farm
    setSelectedFarmIdForDetails(newFarm.id);
    
    // Clear any previous errors since we now have farms
    setFarmsListError(null);
  };

  const handleRackClick = (rackId: UUID) => {
    setSelectedRackId(rackId);
    setCurrentView('side-view');
  };

  const handleFarmPageDataChange = (newData: FarmPageData) => {
    setFarmPageData(newData);
    console.log("Farm data updated in FarmsPage:", newData);
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

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-900 dark:border-green-100"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show redirecting state when user is not authenticated
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gray-50 dark:bg-gray-950 flex flex-col items-center">
      <div className="w-full max-w-7xl flex justify-between items-center mb-6 px-2">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Farm Configuration</h1>
          {isLoadingFarmsList ? (
            <span className="text-sm text-gray-500 dark:text-gray-400">Loading farms...</span>
          ) : farmsListError ? (
            <span className="text-sm text-red-500">{farmsListError}</span>
          ) : availableFarms.length > 0 && selectedFarmIdForDetails ? (
            <Select onValueChange={(value) => setSelectedFarmIdForDetails(value as UUID)} value={selectedFarmIdForDetails || undefined}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Select a farm" />
              </SelectTrigger>
              <SelectContent>
                {availableFarms.map(farm => (
                  <SelectItem key={farm.id} value={farm.id}>
                    {farm.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">No farms available.</span>
              <CreateFarmModal onFarmCreated={handleFarmCreated} />
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <CreateFarmModal onFarmCreated={handleFarmCreated} />
          <div className="flex items-center space-x-2">
            <Switch id="edit-mode-toggle" checked={editMode} onCheckedChange={setEditMode} aria-label="Toggle Edit Mode"/>
            <Label htmlFor="edit-mode-toggle" className="text-gray-700 dark:text-gray-200">Edit Mode</Label>
          </div>
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
        ) : isLoading ? (
          <div className="text-center py-10 text-gray-600 dark:text-gray-400">Loading farm data...</div>
        ) : error ? (
          <div className="text-center py-10 text-red-600 dark:text-red-400">
            <p>Error loading farm data: {error}</p>
            <p>Please ensure the backend is running and the farm ID is correct.</p>
          </div>
        ) : availableFarms.length === 0 ? (
          <div className="text-center py-20 text-gray-600 dark:text-gray-400">
            <div className="max-w-md mx-auto">
              <h2 className="text-xl font-semibold mb-4">Welcome to Farm Configuration</h2>
              <p className="mb-6">Get started by creating your first farm to begin managing your vertical farming operation.</p>
              <CreateFarmModal onFarmCreated={handleFarmCreated} />
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-gray-600 dark:text-gray-400">No farm data available or invalid view.</div>
        )}
      </div>
    </main>
  );
}
