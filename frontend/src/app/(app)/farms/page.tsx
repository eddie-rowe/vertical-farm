"use client";
import { UUID } from "crypto";

import { Zap, Activity, Home } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";

import CreateFarmModal from "@/components/features/agriculture/farm-core/CreateFarmModal";
import EditFarmModal from "@/components/features/agriculture/farm-core/EditFarmModal";
import UnifiedFarmView from "@/components/features/agriculture/farm-core/UnifiedFarmView";
import { EmptyState, Phase2Demo } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FarmSelect } from "@/components/ui/farm-select";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { LayerProvider } from "@/contexts/LayerContext";
import { supabase } from "@/lib/supabaseClient";
// LayerSwitcher temporarily disabled due to import issues
import { FarmPageData, Row, Rack, Shelf, Farm } from "@/types/farm";

export default function FarmsPage() {
  const { user } = useAuth();

  // Farm selection and data state
  const [availableFarms, setAvailableFarms] = useState<Farm[]>([]);
  const [selectedFarmIdForDetails, setSelectedFarmIdForDetails] =
    useState<UUID | null>(null);
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
  const fetchAvailableFarms = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoadingFarmsList(true);
      setFarmsListError(null);

      const { data: farms, error } = await supabase
        .from("farms")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        // Error logged for debugging - keeping for now
        setFarmsListError(error.message);
        return;
      }

      const farmsList = farms || [];
      setAvailableFarms(farmsList);

      // Auto-select first farm if none selected
      if (farmsList.length > 0 && !selectedFarmIdForDetails) {
        setSelectedFarmIdForDetails(farmsList[0].id as UUID);
      }
    } catch {
      // Error logged for debugging
      setFarmsListError("Failed to load farms");
    } finally {
      setIsLoadingFarmsList(false);
    }
  }, [user?.id, selectedFarmIdForDetails]);

  // Fetch detailed farm data with full structure
  const fetchFarmData = useCallback(async () => {
    if (!selectedFarmIdForDetails || !user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Enhanced query with proper joins and data fetching
      const { data: farmData, error: farmError } = await supabase
        .from("farms")
        .select(
          `
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
        `,
        )
        .eq("id", selectedFarmIdForDetails)
        .eq("user_id", user.id)
        .single();

      if (farmError) {
        // Error logged for debugging
        setError(farmError.message);
        return;
      }

      if (!farmData) {
        setError("Farm not found");
        return;
      }

      // Transform the data to match the expected FarmPageData structure
      const transformedData: FarmPageData = {
        farm: {
          ...farmData,
          rows:
            farmData.rows?.map((row: any) => ({
              ...row,
              orientation: row.orientation || "horizontal",
              area_type: row.area_type || "growing",
              racks:
                row.racks?.map((rack: any) => ({
                  ...rack,
                  shelves:
                    rack.shelves?.map((shelf: any) => ({
                      ...shelf,
                      devices:
                        shelf.device_assignments?.map((device: any) => ({
                          id: device.id,
                          shelf_id: device.shelf_id,
                          device_type: device.entity_type,
                          name: device.friendly_name || device.entity_id,
                          status: "unknown", // Default status since is_active doesn't exist
                          device_data: null,
                          created_at: device.created_at,
                          updated_at: device.updated_at,
                        })) || [],
                    })) || [],
                })) || [],
            })) || [],
        },
      };

      setFarmPageData(transformedData);
    } catch {
      // Error logged for debugging
      setError("Failed to load farm data");
    } finally {
      setIsLoading(false);
    }
  }, [selectedFarmIdForDetails, user?.id]);

  // Effects
  useEffect(() => {
    fetchAvailableFarms();
  }, [fetchAvailableFarms]);

  useEffect(() => {
    if (selectedFarmIdForDetails) {
      fetchFarmData();
    }
  }, [selectedFarmIdForDetails, fetchFarmData]);

  // Event handlers
  const handleFarmCreated = (newFarm: Farm) => {
    setAvailableFarms((prev) => [newFarm, ...prev]);
    setSelectedFarmIdForDetails(newFarm.id as UUID);
    toast.success("Farm created successfully!");
  };

  const handleFarmUpdated = (updatedFarm: Farm) => {
    setAvailableFarms((prev) =>
      prev.map((farm) => (farm.id === updatedFarm.id ? updatedFarm : farm)),
    );

    // Update current farm data if it's the selected one
    if (selectedFarmIdForDetails === updatedFarm.id) {
      setFarmPageData((prev) =>
        prev
          ? {
              ...prev,
              farm: {
                ...prev.farm,
                ...updatedFarm,
              },
            }
          : null,
      );
    }

    toast.success("Farm updated successfully!");
  };

  const handleFarmDeleted = () => {
    if (!selectedFarmIdForDetails) return;

    setAvailableFarms((prev) =>
      prev.filter((farm) => farm.id !== selectedFarmIdForDetails),
    );
    setSelectedFarmIdForDetails(null);
    setFarmPageData(null);

    // Auto-select first available farm
    const remainingFarms = availableFarms.filter(
      (farm) => farm.id !== selectedFarmIdForDetails,
    );
    if (remainingFarms.length > 0) {
      setSelectedFarmIdForDetails(remainingFarms[0].id as UUID);
    }

    toast.success("Farm deleted successfully!");
  };

  const handleDataRefresh = async () => {
    await fetchFarmData();
    toast.success("Farm data refreshed!");
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
    return (
      <div className="flex items-center justify-center min-h-screen text-control-label">
        Loading user data...
      </div>
    );
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
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Farm:
                    </span>
                    {isLoadingFarmsList ? (
                      <span className="text-control-label state-maintenance text-sm">
                        Loading...
                      </span>
                    ) : farmsListError ? (
                      <span className="text-control-label state-offline text-sm">
                        {farmsListError}
                      </span>
                    ) : availableFarms.length > 0 &&
                      selectedFarmIdForDetails ? (
                      <FarmSelect
                        inputSize="sm"
                        validation="success"
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          setSelectedFarmIdForDetails(e.target.value as UUID)
                        }
                        value={selectedFarmIdForDetails || ""}
                        options={[
                          ...availableFarms.map((farm) => ({
                            value: farm.id,
                            label: farm.name,
                          })),
                        ]}
                        placeholder="Select a farm"
                        className="w-48 border-0 bg-transparent focus:ring-0 text-lg font-semibold text-gray-900 dark:text-white"
                      />
                    ) : (
                      <span className="text-control-label state-maintenance text-sm">
                        No farms available
                      </span>
                    )}
                  </div>

                  {/* Status Indicator */}
                  {availableFarms.length > 0 && !isLoading && !error && (
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        Online
                      </span>
                    </div>
                  )}
                </div>

                {/* Primary Actions */}
                <div className="flex items-center space-x-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="default"
                        size="sm"
                        className="flex items-center gap-2 text-xs"
                      >
                        <Zap className="w-3 h-3" />
                        Demo
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-farm-title">
                          Phase 2: Interactive Farm Elements Demo
                        </DialogTitle>
                      </DialogHeader>
                      <Phase2Demo />
                    </DialogContent>
                  </Dialog>
                  {selectedFarmIdForDetails &&
                    availableFarms.find(
                      (farm) => farm.id === selectedFarmIdForDetails,
                    ) &&
                    (() => {
                      const currentFarm = availableFarms.find(
                        (farm) => farm.id === selectedFarmIdForDetails,
                      )!;
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
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-3">
                      View:
                    </span>
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
              <div className="card-shadow bg-white dark:bg-gray-800 rounded-lg p-8">
                <EmptyState
                  icon={Home}
                  title="Welcome to Farm Management"
                  description="Get started by creating your first farm to begin managing your vertical farming operation."
                />
                <div className="flex justify-center mt-2">
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
              <div className="card-shadow bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md mx-auto">
                <EmptyState
                  icon={Activity}
                  title="Connection Error"
                  description={`Error loading farm data: ${error}. Please ensure the backend is running and the farm ID is correct.`}
                  actionLabel="Retry Connection"
                  onAction={() => window.location.reload()}
                  iconBgColor="bg-red-100 dark:bg-red-900/20"
                  iconColor="text-red-600 dark:text-red-400"
                />
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
