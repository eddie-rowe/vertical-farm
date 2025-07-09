"use client";
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from '@/lib/supabaseClient';
import { UUID } from 'crypto';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { Zap, Activity, Home } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { FarmSelect } from "@/components/ui/farm-select";
import { PageHeader } from '@/components/ui/PageHeader';
import CreateFarmModal from '@/components/features/agriculture/farm-core/CreateFarmModal'
import EditFarmModal from '@/components/features/agriculture/farm-core/EditFarmModal';
import { Phase2Demo } from '@/components/shared';
import UnifiedFarmView from '@/components/features/agriculture/farm-core/UnifiedFarmView';
import { LayerProvider } from '@/contexts/LayerContext';
// LayerSwitcher temporarily disabled due to import issues
import { FarmPageData, Row, Rack, Shelf, Farm } from '@/types/farm';
import { CreateFarmData } from '@/services/supabaseService';

export default function FarmsPage() {
  const { user } = useAuth();
  
  // Farm selection and data state
  const [availableFarms, setAvailableFarms] = useState<Farm[]>([]);
  const [selectedFarmIdForDetails, setSelectedFarmIdForDetails] = useState<UUID | null>(null);
  const [farmPageData, setFarmPageData] = useState<FarmPageData | null>(null);
  const [isLoadingFarmsList, setIsLoadingFarmsList] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [farmsListError, setFarmsListError] = useState<string | null>(null);

  // Selection state for UnifiedFarmView
  const [selectedRow, setSelectedRow] = useState<Row | null>(null);
  const [selectedRack, setSelectedRack] = useState<Rack | null>(null);
  const [selectedShelf, setSelectedShelf] = useState<Shelf | null>(null);

  // Fetch available farms
  const fetchAvailableFarms = async () => {
    if (!user?.id) return;

    try {
      setIsLoadingFarmsList(true);
      setFarmsListError(null);
      
      const { data: farms, error } = await supabase
        .from('farms')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching farms:', error);
        setFarmsListError(error.message);
        return;
      }
      
      const farmsList = farms || [];
      setAvailableFarms(farmsList);
      
      // Auto-select first farm if none selected
      if (farmsList.length > 0 && !selectedFarmIdForDetails) {
        setSelectedFarmIdForDetails(farmsList[0].id as UUID);
      }
    } catch (err) {
      console.error('Unexpected error fetching farms:', err);
      setFarmsListError('Failed to load farms');
    } finally {
      setIsLoadingFarmsList(false);
    }
  };

  // Fetch detailed farm data with full structure
  const fetchFarmData = async () => {
    if (!selectedFarmIdForDetails || !user?.id) return;

    try {
      setIsLoading(true);
      setError(null);
      
      // Enhanced query with proper joins and data fetching
      const { data: farmData, error: farmError } = await supabase
        .from('farms')
        .select(`
          id,
          name,
          location,
          farm_image_url,
          user_id,
          created_at,
          updated_at,
          rows (
            id,
            name,
            farm_id,
            orientation,
            created_at,
            updated_at,
            racks (
              id,
              name,
              row_id,
              created_at,
              updated_at,
              shelves (
                id,
                name,
                rack_id,
                created_at,
                updated_at,
                device_assignments (
                  id,
                  shelf_id,
                  entity_type,
                  friendly_name,
                  entity_id,
                  created_at,
                  updated_at
                )
              )
            )
          )
        `)
        .eq('id', selectedFarmIdForDetails)
        .eq('user_id', user.id)
        .single();

      if (farmError) {
        console.error('Error fetching farm data:', farmError);
        setError(farmError.message);
        return;
      }

      if (!farmData) {
        setError('Farm not found');
        return;
      }

      // Transform the data to match the expected FarmPageData structure
      const transformedData: FarmPageData = {
        farm: {
          ...farmData,
          rows: farmData.rows?.map((row: any) => ({
            ...row,
            orientation: row.orientation || 'horizontal',
            racks: row.racks?.map((rack: any) => ({
              ...rack,
              shelves: rack.shelves?.map((shelf: any) => ({
                ...shelf,
                devices: shelf.device_assignments?.map((device: any) => ({
                  id: device.id,
                  shelf_id: device.shelf_id,
                  device_type: device.entity_type,
                  name: device.friendly_name || device.entity_id,
                  status: 'unknown', // Default status since is_active doesn't exist
                  device_data: null,
                  created_at: device.created_at,
                  updated_at: device.updated_at
                })) || []
              })) || []
            })) || []
          })) || []
        }
      };

      setFarmPageData(transformedData);
    } catch (err) {
      console.error('Unexpected error fetching farm data:', err);
      setError('Failed to load farm data');
    } finally {
      setIsLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchAvailableFarms();
  }, [user?.id]);

  useEffect(() => {
    if (selectedFarmIdForDetails) {
      fetchFarmData();
    }
  }, [selectedFarmIdForDetails, user?.id]);

  // Event handlers
  const handleFarmCreated = (newFarm: Farm) => {
    setAvailableFarms(prev => [newFarm, ...prev]);
    setSelectedFarmIdForDetails(newFarm.id as UUID);
    toast.success('Farm created successfully!');
  };

  const handleFarmUpdated = (updatedFarm: Farm) => {
    setAvailableFarms(prev => prev.map(farm => 
      farm.id === updatedFarm.id ? updatedFarm : farm
    ));
    
    // Update current farm data if it's the selected one
    if (selectedFarmIdForDetails === updatedFarm.id) {
      setFarmPageData(prev => prev ? {
        ...prev,
        farm: {
          ...prev.farm,
          ...updatedFarm
        }
      } : null);
    }
    
    toast.success('Farm updated successfully!');
  };

  const handleFarmDeleted = () => {
    if (!selectedFarmIdForDetails) return;
    
    setAvailableFarms(prev => prev.filter(farm => farm.id !== selectedFarmIdForDetails));
    setSelectedFarmIdForDetails(null);
    setFarmPageData(null);
    
    // Auto-select first available farm
    const remainingFarms = availableFarms.filter(farm => farm.id !== selectedFarmIdForDetails);
    if (remainingFarms.length > 0) {
      setSelectedFarmIdForDetails(remainingFarms[0].id as UUID);
    }
    
    toast.success('Farm deleted successfully!');
  };

  const handleDataRefresh = async () => {
    await fetchFarmData();
    toast.success('Farm data refreshed!');
  };

  // Selection handlers for UnifiedFarmView
  const handleRowSelect = useCallback((row: Row) => {
    setSelectedRow(row);
    setSelectedRack(null); // Clear rack selection when selecting a different row
    setSelectedShelf(null); // Clear shelf selection when selecting a different row
  }, []);

  const handleRackSelect = useCallback((rack: Rack) => {
    setSelectedRack(rack);
    setSelectedShelf(null); // Clear shelf selection when selecting a different rack
  }, []);

  const handleShelfSelect = useCallback((shelf: Shelf) => {
    setSelectedShelf(shelf);
  }, []);

  // Loading check
  if (!user) {
    return <div className="flex items-center justify-center min-h-screen text-control-label">Loading user data...</div>;
  }

  return (
    <>
      <Toaster />
      <LayerProvider defaultActiveLayers={[]} exclusiveMode={true}>
        <div className="flex-1 h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
          {/* Standardized Page Header */}
          <PageHeader
            title="Farm Management"
            description="Configure, monitor, and control your vertical farming operation"
          />
          
          {/* Two-Tier Controls Section */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 card-shadow">
            {/* Primary Header Row */}
            <div className="px-8 py-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  {/* Farm Context */}
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Farm:</span>
                    {isLoadingFarmsList ? (
                      <span className="text-control-label state-maintenance text-sm">Loading...</span>
                    ) : farmsListError ? (
                      <span className="text-control-label state-offline text-sm">{farmsListError}</span>
                    ) : availableFarms.length > 0 && selectedFarmIdForDetails ? (
                      <FarmSelect
                        inputSize="sm"
                        validation="success"
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedFarmIdForDetails(e.target.value as UUID)}
                        value={selectedFarmIdForDetails || ""}
                        options={[
                          ...availableFarms.map(farm => ({
                            value: farm.id,
                            label: farm.name
                          }))
                        ]}
                        placeholder="Select a farm"
                        className="w-48 border-0 bg-transparent focus:ring-0 text-lg font-semibold text-gray-900 dark:text-white"
                      />
                    ) : (
                      <span className="text-control-label state-maintenance text-sm">No farms available</span>
                    )}
                  </div>
                  
                  {/* Status Indicator */}
                  {availableFarms.length > 0 && !isLoading && !error && (
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-600 dark:text-green-400 font-medium">Online</span>
                    </div>
                  )}
                </div>
                
                {/* Primary Actions */}
                <div className="flex items-center space-x-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="default" size="sm" className="flex items-center gap-2 text-xs">
                        <Zap className="w-3 h-3" />
                        Demo
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-farm-title">Phase 2: Interactive Farm Elements Demo</DialogTitle>
                      </DialogHeader>
                      <Phase2Demo />
                    </DialogContent>
                  </Dialog>
                  {selectedFarmIdForDetails && availableFarms.find(farm => farm.id === selectedFarmIdForDetails) && (() => {
                    const currentFarm = availableFarms.find(farm => farm.id === selectedFarmIdForDetails)!;
                    return (
                      <EditFarmModal 
                        farm={currentFarm}
                        onFarmUpdated={handleFarmUpdated}
                        onFarmDeleted={handleFarmDeleted}
                      />
                    );
                  })()}
                  <CreateFarmModal onFarmCreated={handleFarmCreated} />
                </div>
              </div>
            </div>
            
            {/* Secondary Controls Row - Layer Navigation */}
            {availableFarms.length > 0 && !isLoading && !error && (
              <div className="px-8 py-3 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-3">View:</span>
                    {/* LayerSwitcher temporarily disabled */}
                  </div>
                  
                  {/* Quick Stats or Secondary Info */}
                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>Last updated: {new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

        {/* Main Content with Farm-Specific States */}
        {availableFarms.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-20">
              <div className="max-w-md mx-auto card-shadow bg-white dark:bg-gray-800 rounded-lg p-8">
                <div className="p-4 rounded-full bg-gradient-to-br from-green-400 to-green-600 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                  <Home className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-farm-title mb-4">Welcome to Farm Management</h2>
                <p className="text-control-label mb-6">Get started by creating your first farm to begin managing your vertical farming operation.</p>
                <CreateFarmModal onFarmCreated={handleFarmCreated} />
              </div>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-10">
              <div className="inline-flex items-center space-x-2 text-control-label state-active">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                <span>Loading farm data...</span>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-10">
              <div className="card-shadow bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md mx-auto">
                <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/20 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                  <Activity className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-farm-title state-offline mb-4">Connection Error</h3>
                <p className="text-control-label state-offline mb-2">Error loading farm data: {error}</p>
                <p className="text-control-label mb-6">Please ensure the backend is running and the farm ID is correct.</p>
                <Button 
                  variant="default" 
                  onClick={() => window.location.reload()}
                >
                  Retry Connection
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 p-6">
              {/* Use UnifiedFarmView instead of the tabbed interface */}
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
          </div>
        )}
        </div>
      </LayerProvider>
    </>
  );
}
