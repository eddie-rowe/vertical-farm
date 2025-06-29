"use client";
import { useState, useEffect } from 'react';
import { useAuth } from "@/context/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Home } from 'lucide-react';
import CreateFarmModal from '@/components/CreateFarmModal';
import UnifiedFarmView from '@/components/farms/UnifiedFarmView';
import { FarmPageData, UUID, Farm, Row, Rack, Shelf } from "@/types/farm-layout";
import { getFarms, getFarmById, Farm as SupabaseFarm } from '@/services/farmService';
import { getRowsByFarm, getRacksByRow, getShelvesByRack } from '@/services/supabaseService';
import toast from 'react-hot-toast';

export default function FarmsPage() {
  const { user } = useAuth();
  
  // Core state
  const [farmPageData, setFarmPageData] = useState<FarmPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Farm selection state
  const [availableFarms, setAvailableFarms] = useState<Farm[]>([]);
  const [selectedFarmIdForDetails, setSelectedFarmIdForDetails] = useState<UUID | null>(null);
  const [isLoadingFarmsList, setIsLoadingFarmsList] = useState(true);
  const [farmsListError, setFarmsListError] = useState<string | null>(null);

  // Selection state for UnifiedFarmView
  const [selectedRow, setSelectedRow] = useState<Row | null>(null);
  const [selectedRack, setSelectedRack] = useState<Rack | null>(null);
  const [selectedShelf, setSelectedShelf] = useState<Shelf | null>(null);

  // Selection handlers
  const handleRowSelect = (row: Row) => {
    setSelectedRow(row);
    setSelectedRack(null); // Clear rack selection when row changes
    setSelectedShelf(null); // Clear shelf selection when row changes
  };

  const handleRackSelect = (rack: Rack) => {
    setSelectedRack(rack);
    setSelectedShelf(null); // Clear shelf selection when rack changes
  };

  const handleShelfSelect = (shelf: Shelf) => {
    setSelectedShelf(shelf);
  };

  // Clear selections when farm changes
  useEffect(() => {
    setSelectedRow(null);
    setSelectedRack(null);
    setSelectedShelf(null);
  }, [selectedFarmIdForDetails]);

  // Fetch available farms
  useEffect(() => {
    const fetchAvailableFarms = async () => {
      setIsLoadingFarmsList(true);
      setFarmsListError(null);
      try {
        const response = await getFarms();
        const layoutFarms = response
          .filter(farm => farm.id)
          .map(farm => ({
            ...farm,
            id: farm.id!,
            user_id: farm.user_id || farm.id!
          }));
        setAvailableFarms(layoutFarms);
        if (layoutFarms.length > 0) {
          setSelectedFarmIdForDetails(layoutFarms[0].id!);
        } else {
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

  // Fetch selected farm data
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

        // Load complete farm layout data
        console.log('Loading farm layout data for farm:', farmData.id);
        const dbRows = await getRowsByFarm(farmData.id!);
        console.log('Loaded rows:', dbRows.length);

        const rowsWithRacks = await Promise.all(
          dbRows.map(async (dbRow) => {
            const dbRacks = await getRacksByRow(dbRow.id);
            console.log(`Loaded racks for row ${dbRow.id}:`, dbRacks.length);

            const racksWithShelves = await Promise.all(
              dbRacks.map(async (dbRack) => {
                const dbShelves = await getShelvesByRack(dbRack.id);
                console.log(`Loaded shelves for rack ${dbRack.id}:`, dbShelves.length);

                return {
                  ...dbRack,
                  shelves: dbShelves.map(shelf => ({
                    ...shelf,
                    devices: [] // TODO: Load devices when needed
                  }))
                };
              })
            );

            return {
              ...dbRow,
              orientation: 'horizontal' as const,
              racks: racksWithShelves
            };
          })
        );

        const transformedData: FarmPageData = {
          farm: {
            ...farmData,
            id: farmData.id!,
            user_id: farmData.user_id || farmData.id!,
            rows: rowsWithRacks
          }
        };

        console.log('Complete farm layout loaded:', {
          rows: transformedData.farm.rows?.length || 0,
          racks: transformedData.farm.rows?.reduce((total, row) => total + (row.racks?.length || 0), 0) || 0,
          shelves: transformedData.farm.rows?.reduce((total, row) => 
            total + (row.racks?.reduce((rackTotal, rack) => 
              rackTotal + (rack.shelves?.length || 0), 0) || 0), 0) || 0
        });

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
    const layoutFarm = {
      ...newFarm,
      id: newFarm.id!,
      user_id: newFarm.user_id || newFarm.id!
    };
    
    setAvailableFarms(prev => [...prev, layoutFarm]);
    setSelectedFarmIdForDetails(newFarm.id!);
    setFarmsListError(null);
  };

  const handleDataRefresh = async () => {
    if (!selectedFarmIdForDetails) return;
    
    try {
      const farmData = await getFarmById(selectedFarmIdForDetails);
      if (!farmData) {
        throw new Error('Farm not found');
      }

      // Load complete farm layout data
      const dbRows = await getRowsByFarm(farmData.id!);
      const rowsWithRacks = await Promise.all(
        dbRows.map(async (dbRow) => {
          const dbRacks = await getRacksByRow(dbRow.id);
          const racksWithShelves = await Promise.all(
            dbRacks.map(async (dbRack) => {
              const dbShelves = await getShelvesByRack(dbRack.id);
              return {
                ...dbRack,
                shelves: dbShelves.map(shelf => ({
                  ...shelf,
                  devices: []
                }))
              };
            })
          );
          return {
            ...dbRow,
            orientation: 'horizontal' as const,
            racks: racksWithShelves
          };
        })
      );

      const transformedData: FarmPageData = {
        farm: {
          ...farmData,
          id: farmData.id!,
          user_id: farmData.user_id || farmData.id!,
          rows: rowsWithRacks
        }
      };

      setFarmPageData(transformedData);
      console.log("Farm data refreshed successfully");
    } catch (err) {
      console.error("Failed to refresh farm data:", err);
      toast.error("Failed to refresh farm data");
    }
  };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading user data...</div>;
  }

  return (
    <div className="flex-1 h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Enhanced Top Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <Home className="h-6 w-6 text-green-600 dark:text-green-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Farm Management
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Configure, monitor, and control your vertical farming operation
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Farm Selector */}
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
            
            <div className="flex items-center space-x-2">
              <CreateFarmModal onFarmCreated={handleFarmCreated} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {availableFarms.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-20 text-gray-600 dark:text-gray-400">
            <div className="max-w-md mx-auto">
              <h2 className="text-xl font-semibold mb-4">Welcome to Farm Management</h2>
              <p className="mb-6">Get started by creating your first farm to begin managing your vertical farming operation.</p>
              <CreateFarmModal onFarmCreated={handleFarmCreated} />
            </div>
          </div>
        </div>
      ) : isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-10 text-gray-600 dark:text-gray-400">Loading farm data...</div>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-10 text-red-600 dark:text-red-400">
            <p>Error loading farm data: {error}</p>
            <p>Please ensure the backend is running and the farm ID is correct.</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <UnifiedFarmView
            farmData={farmPageData}
            selectedRow={selectedRow}
            selectedRack={selectedRack}
            selectedShelf={selectedShelf}
            onRowSelect={handleRowSelect}
            onRackSelect={handleRackSelect}
            onShelfSelect={handleShelfSelect}
            onDataRefresh={handleDataRefresh}
          />
        </div>
      )}
    </div>
  );
}
