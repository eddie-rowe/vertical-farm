"use client";
import { useState, useEffect } from 'react';
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Zap, Activity } from 'lucide-react';
import CreateFarmModal from '@/components/CreateFarmModal';
import LayoutConfigurationView from '@/components/farms/LayoutConfigurationView';
import DevicesControlsView from '@/components/farms/DevicesControlsView';
import EnvironmentMonitoringView from '@/components/farms/EnvironmentMonitoringView';
import { FarmPageData, UUID, Farm } from "@/types/farm-layout";
import { getFarms, getFarmById, Farm as SupabaseFarm } from '@/services/farmService';
import toast from 'react-hot-toast';

export default function FarmsPage() {
  const { user } = useAuth();
  
  const [editMode, setEditMode] = useState(false);
  const [farmPageData, setFarmPageData] = useState<FarmPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("layout");

  const [availableFarms, setAvailableFarms] = useState<Farm[]>([]);
  const [selectedFarmIdForDetails, setSelectedFarmIdForDetails] = useState<UUID | null>(null);
  const [isLoadingFarmsList, setIsLoadingFarmsList] = useState(true);
  const [farmsListError, setFarmsListError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvailableFarms = async () => {
      setIsLoadingFarmsList(true);
      setFarmsListError(null);
      try {
        const response = await getFarms();
        // Convert Supabase farms to layout farms
        const layoutFarms = response
          .filter(farm => farm.id) // Filter out farms without ID
          .map(farm => ({
            ...farm,
            id: farm.id!, // Non-null assertion since we filtered
            user_id: farm.user_id || farm.id! // Use user_id, fallback to farm.id if missing
          }));
        setAvailableFarms(layoutFarms);
        if (layoutFarms.length > 0) {
          setSelectedFarmIdForDetails(layoutFarms[0].id!);
        } else {
          // Don't show an error toast - this is normal for new users
          console.log("No farms found for current user - this is normal for new users");
          setIsLoading(false);
        }
      } catch (err: unknown) {
        console.error("Failed to fetch available farms:", err);
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred while fetching farms list.";
        setFarmsListError(errorMessage);
        toast.error(errorMessage);
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
        const farmData = await getFarmById(selectedFarmIdForDetails);
        if (!farmData) {
          throw new Error('Farm not found');
        }
        // Transform Supabase response to match expected FarmPageData structure
        const transformedData: FarmPageData = {
          farm: {
            ...farmData,
            id: farmData.id!,
            user_id: farmData.user_id || farmData.id!, // Use user_id, fallback to farm.id if missing
            rows: [] // Empty for now, populate as needed
          }
        };
        setFarmPageData(transformedData);
      } catch (err: unknown) {
        console.error("Failed to fetch farm data:", err);
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred while fetching farm data.";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFarmData();
  }, [selectedFarmIdForDetails]);

  const handleFarmCreated = (newFarm: SupabaseFarm) => {
    // Transform Supabase farm to layout farm with user_id
    const layoutFarm = {
      ...newFarm,
      id: newFarm.id!,
      user_id: newFarm.user_id || newFarm.id! // Use user_id, fallback to farm.id if missing
    };
    
    // Add the new farm to the list
    setAvailableFarms(prev => [...prev, layoutFarm]);
    
    // Select the newly created farm
    setSelectedFarmIdForDetails(newFarm.id!);
    
    // Clear any previous errors since we now have farms
    setFarmsListError(null);
  };

  const handleFarmPageDataChange = (newData: FarmPageData) => {
    setFarmPageData(newData);
    console.log("Farm data updated in FarmsPage:", newData);
  };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading user data...</div>;
  }

  return (
    <div className="flex-1 p-8 animate-pop">
      {/* Enhanced Header */}
      <div className="mb-8 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-green-900/20 dark:via-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-green-200 dark:border-green-700 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-green-900 dark:text-green-100 drop-shadow-lg">
              Farm Management
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
              Configure layouts, control devices, and monitor environmental conditions
            </p>
          </div>
          <div className="flex items-center space-x-4">
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
              </div>
            )}
            <CreateFarmModal onFarmCreated={handleFarmCreated} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      {availableFarms.length === 0 ? (
        <div className="text-center py-20 text-gray-600 dark:text-gray-400">
          <div className="max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-4">Welcome to Farm Management</h2>
            <p className="mb-6">Get started by creating your first farm to begin managing your vertical farming operation.</p>
            <CreateFarmModal onFarmCreated={handleFarmCreated} />
          </div>
        </div>
      ) : isLoading ? (
        <div className="text-center py-10 text-gray-600 dark:text-gray-400">Loading farm data...</div>
      ) : error ? (
        <div className="text-center py-10 text-red-600 dark:text-red-400">
          <p>Error loading farm data: {error}</p>
          <p>Please ensure the backend is running and the farm ID is correct.</p>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="layout" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Layout & Configuration
            </TabsTrigger>
            <TabsTrigger value="devices" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Devices & Controls
            </TabsTrigger>
            <TabsTrigger value="environment" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Environment & Monitoring
            </TabsTrigger>
          </TabsList>

          <TabsContent value="layout" className="mt-6">
            <LayoutConfigurationView 
              farmPageData={farmPageData}
              editMode={editMode}
              setEditMode={setEditMode}
              onFarmPageDataChange={handleFarmPageDataChange}
            />
          </TabsContent>

          <TabsContent value="devices" className="mt-6">
            <DevicesControlsView farmPageData={farmPageData} />
          </TabsContent>

          <TabsContent value="environment" className="mt-6">
            <EnvironmentMonitoringView farmPageData={farmPageData} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
