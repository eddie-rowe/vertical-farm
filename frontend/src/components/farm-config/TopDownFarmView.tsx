import React, { useState, useEffect } from "react";
import EntityEditModal, { EntityType } from "@/components/farm-layout/EntityEditModal";
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, KeyboardSensor, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { PlusIcon, TrashIcon, PencilIcon, Bars3Icon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  FarmFormData, 
  FarmSchema 
} from '@/lib/validations/farmSchemas';
import { 
  RowFormData, 
  RowSchema 
} from '@/lib/validations/rowSchemas';
import { 
  RackFormData, 
  RackSchema 
} from '@/lib/validations/rackSchemas';
import { 
  ShelfFormData, 
  ShelfSchema 
} from '@/lib/validations/shelfSchemas';
import { 
  FanFormData, 
  FanSchema 
} from '@/lib/validations/fanSchemas';
import { 
  SensorDeviceFormData, 
  SensorDeviceSchema 
} from '@/lib/validations/sensorDeviceSchemas';
import { Farm, Row, Rack, Shelf, UUID, FarmPageData } from "@/types/farm-layout";
import { ZodType } from 'zod';
import { FieldValues, DefaultValues } from "react-hook-form";

// Import database services
import { 
  createRow, 
  updateRow, 
  deleteRow, 
  getRowsByFarmId, 
  reorderRows 
} from "@/services/rowService";
import { 
  createRack, 
  updateRack, 
  deleteRack, 
  getRacksByRowId, 
  reorderRacks 
} from "@/services/rackService";
import { 
  createShelf, 
  updateShelf, 
  deleteShelf, 
  getShelvesByRackId,
  reorderShelves 
} from "@/services/shelfService";

// Type for the entity being edited in the modal
type ConfigurableEntityData = FarmFormData | RowFormData | RackFormData | ShelfFormData;

// Add helper for entity icons/colors
const entityStyles = {
  farm: 'gradient-farm card-shadow animate-pop',
  row: 'gradient-row card-shadow animate-pop',
  rack: 'gradient-rack card-shadow animate-pop',
  shelf: 'gradient-shelf card-shadow animate-pop',
};

// Helper function to get validation schema based on entity type
function getValidationSchema(type: EntityType): ZodType<any, any, any> {
  switch (type) {
    case 'farm': return FarmSchema;
    case 'row': return RowSchema;
    case 'rack': return RackSchema;
    case 'shelf': return ShelfSchema;
    case 'fan': return FanSchema;
    case 'sensorDevice': return SensorDeviceSchema;
    default: throw new Error(`Unknown entity type for validation: ${type}`);
  }
}

// Props for the new component
interface TopDownFarmViewProps {
  farmPageData: FarmPageData | null;
  editMode: boolean;
  onRackClick: (rackId: UUID) => void;
  onFarmPageDataChange: (newData: FarmPageData) => void;
}

export default function TopDownFarmView({ farmPageData, editMode, onRackClick, onFarmPageDataChange }: TopDownFarmViewProps) {
  const [internalFarmData, setInternalFarmData] = useState<FarmPageData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load real data from database
  useEffect(() => {
    const loadFarmLayoutData = async () => {
      if (!farmPageData?.farm?.id) {
        setInternalFarmData(farmPageData);
        return;
      }

      setIsLoading(true);
      try {
        // Load rows for this farm
        const dbRows = await getRowsByFarmId(farmPageData.farm.id);
        
        // For each row, load its racks
        const rowsWithRacks = await Promise.all(
          dbRows.map(async (dbRow) => {
            const dbRacks = await getRacksByRowId(dbRow.id);
            
            // For each rack, load its shelves
            const racksWithShelves = await Promise.all(
              dbRacks.map(async (dbRack) => {
                const dbShelves = await getShelvesByRackId(dbRack.id);
                
                // Convert DB shelf data to Row interface format
                const shelves: Shelf[] = dbShelves.map(shelf => ({
                  id: shelf.id,
                  name: shelf.name,
                  rack_id: shelf.rack_id,
                  position_in_rack: shelf.position_in_rack || 1,
                  width: shelf.width || 1,
                  depth: shelf.depth || 1,
                  max_weight: shelf.max_weight || null,
                  created_at: shelf.created_at || null,
                  updated_at: shelf.updated_at || null
                }));
                
                // Convert DB rack data to Rack interface format
                const rack: Rack = {
                  id: dbRack.id,
                  name: dbRack.name,
                  row_id: dbRack.row_id,
                  position_in_row: dbRack.position_in_row || 1,
                  width: dbRack.width || 1,
                  depth: dbRack.depth || 1,
                  height: dbRack.height || 1,
                  shelves,
                  created_at: dbRack.created_at || null,
                  updated_at: dbRack.updated_at || null
                };
                
                return rack;
              })
            );
            
            // Convert DB row data to Row interface format
            const row: Row = {
              id: dbRow.id,
              name: dbRow.name,
              farm_id: dbRow.farm_id,
              position_x: 0, // Default values since DB doesn't have these
              position_y: 0,
              length: 10,
              orientation: 'horizontal' as const,
              racks: racksWithShelves,
              created_at: dbRow.created_at || null,
              updated_at: dbRow.updated_at || null
            };
            
            return row;
          })
        );

        const updatedFarmData: FarmPageData = {
          farm: { ...farmPageData.farm, rows: rowsWithRacks }
        };

        setInternalFarmData(updatedFarmData);
        onFarmPageDataChange(updatedFarmData);
      } catch (error) {
        console.error('Error loading farm layout data:', error);
        toast.error('Failed to load farm layout data');
        // Fallback to provided data
        setInternalFarmData(farmPageData);
      } finally {
        setIsLoading(false);
      }
    };

    loadFarmLayoutData();
  }, [farmPageData?.farm?.id]);

  const handleDataUpdate = (updatedData: FarmPageData) => {
    setInternalFarmData(updatedData); 
    onFarmPageDataChange(updatedData); 
  };

  const [modal, setModal] = useState<{
    type: EntityType | null;
    entity: Partial<ConfigurableEntityData> | null;
    isNew: boolean;
    parentRowId?: UUID;
    parentRackId?: UUID;
  }>({ type: null, entity: null, isNew: false });

  const [dragging, setDragging] = useState<{ type: string; id: UUID } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type?: 'farm' | 'row' | 'rack' | 'shelf'; 
    idToDelete?: UUID;
    name?: string;
  }>({ open: false });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function handleRowsReorder(event: DragEndEvent) {
    const { active, over } = event;
    setDragging(null);
    
    if (!over || active.id === over.id || !internalFarmData?.farm.rows) return;

    const oldIndex = internalFarmData.farm.rows.findIndex(r => r.id === active.id);
    const newIndex = internalFarmData.farm.rows.findIndex(r => r.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;

    try {
      setIsSubmitting(true);
      const newRows = arrayMove(internalFarmData.farm.rows, oldIndex, newIndex);
      
      // Update positions in database
      const rowOrders = newRows.map((row, index) => ({ id: row.id, position: index + 1 }));
      await reorderRows(internalFarmData.farm.id, rowOrders);

      // Update local state
      const updatedData = { ...internalFarmData, farm: { ...internalFarmData.farm, rows: newRows } };
      handleDataUpdate(updatedData);
      toast.success('Row reordered');
    } catch (error) {
      console.error('Error reordering rows:', error);
      toast.error('Failed to reorder rows');
    } finally {
      setIsSubmitting(false);
    }
  }

  function openModal(
    type: EntityType,
    entityData: Partial<ConfigurableEntityData> | Farm | Row | Rack, 
    isNew: boolean,
    parentRowId?: UUID,
    parentRackId?: UUID
  ) {
    setModal({ type, entity: entityData, isNew, parentRowId, parentRackId });
  }

  function closeModal() {
    setModal({ type: null, entity: null, isNew: false });
  }

  async function saveModal(formValues: Record<string, any>) {
    if (!modal.type || !internalFarmData) return;

    try {
      setIsSubmitting(true);

      if (modal.type === 'row') {
        if (modal.isNew) {
          // Create new row
          const newRow = await createRow({
            name: formValues.name,
            farm_id: internalFarmData.farm.id,
            position: (internalFarmData.farm.rows?.length || 0) + 1
          });

          // Convert to Row interface format
          const convertedRow: Row = {
            id: newRow.id,
            name: newRow.name,
            farm_id: newRow.farm_id,
            position_x: 0,
            position_y: 0,
            length: 10,
            orientation: 'horizontal' as const,
            racks: [],
            created_at: newRow.created_at || null,
            updated_at: newRow.updated_at || null
          };

          const updatedRows = [...(internalFarmData.farm.rows || []), convertedRow];
          const updatedData = { ...internalFarmData, farm: { ...internalFarmData.farm, rows: updatedRows } };
          handleDataUpdate(updatedData);
          toast.success('Row created successfully');
        } else {
          // Update existing row
          const updatedRow = await updateRow(formValues.id, {
            name: formValues.name
          });

          const updatedRows = internalFarmData.farm.rows!.map(row => 
            row.id === updatedRow.id ? { ...row, name: updatedRow.name } : row
          );
          const updatedData = { ...internalFarmData, farm: { ...internalFarmData.farm, rows: updatedRows } };
          handleDataUpdate(updatedData);
          toast.success('Row updated successfully');
        }
      } else if (modal.type === 'rack') {
        if (modal.isNew && modal.parentRowId) {
          // Create new rack
          const row = internalFarmData.farm.rows?.find(r => r.id === modal.parentRowId);
          const newRack = await createRack({
            name: formValues.name,
            row_id: modal.parentRowId,
            position_in_row: (row?.racks?.length || 0) + 1,
            width: formValues.width || 1,
            depth: formValues.depth || 1,
            height: formValues.height || 1
          });

          // Convert to Rack interface format
          const convertedRack: Rack = {
            id: newRack.id,
            name: newRack.name,
            row_id: newRack.row_id,
            position_in_row: newRack.position_in_row || 1,
            width: newRack.width || 1,
            depth: newRack.depth || 1,
            height: newRack.height || 1,
            shelves: [],
            created_at: newRack.created_at || null,
            updated_at: newRack.updated_at || null
          };

          const updatedRows = internalFarmData.farm.rows!.map(row => 
            row.id === modal.parentRowId 
              ? { ...row, racks: [...(row.racks || []), convertedRack] }
              : row
          );
          const updatedData = { ...internalFarmData, farm: { ...internalFarmData.farm, rows: updatedRows } };
          handleDataUpdate(updatedData);
          toast.success('Rack created successfully');
        } else {
          // Update existing rack
          const updatedRack = await updateRack(formValues.id, {
            name: formValues.name,
            width: formValues.width,
            depth: formValues.depth,
            height: formValues.height
          });

          const updatedRows = internalFarmData.farm.rows!.map(row => ({
            ...row,
            racks: row.racks?.map(rack => 
              rack.id === updatedRack.id ? { 
                ...rack, 
                name: updatedRack.name,
                width: updatedRack.width || rack.width,
                depth: updatedRack.depth || rack.depth,
                height: updatedRack.height || rack.height
              } : rack
            ) || []
          }));
          const updatedData = { ...internalFarmData, farm: { ...internalFarmData.farm, rows: updatedRows } };
          handleDataUpdate(updatedData);
          toast.success('Rack updated successfully');
        }
      } else if (modal.type === 'shelf') {
        if (modal.isNew && modal.parentRackId) {
          // Create new shelf
          let rack: Rack | undefined;
          for (const row of internalFarmData.farm.rows || []) {
            rack = row.racks?.find(r => r.id === modal.parentRackId);
            if (rack) break;
          }

          const newShelf = await createShelf({
            name: formValues.name,
            rack_id: modal.parentRackId,
            position_in_rack: (rack?.shelves?.length || 0) + 1,
            width: formValues.width || 1,
            depth: formValues.depth || 1,
            max_weight: formValues.max_weight || null
          });

          // Convert to Shelf interface format
          const convertedShelf: Shelf = {
            id: newShelf.id,
            name: newShelf.name,
            rack_id: newShelf.rack_id,
            position_in_rack: newShelf.position_in_rack || 1,
            width: newShelf.width || 1,
            depth: newShelf.depth || 1,
            max_weight: newShelf.max_weight || null,
            created_at: newShelf.created_at || null,
            updated_at: newShelf.updated_at || null
          };

          const updatedRows = internalFarmData.farm.rows!.map(row => ({
            ...row,
            racks: row.racks?.map(rack => 
              rack.id === modal.parentRackId
                ? { ...rack, shelves: [...(rack.shelves || []), convertedShelf] }
                : rack
            ) || []
          }));
          const updatedData = { ...internalFarmData, farm: { ...internalFarmData.farm, rows: updatedRows } };
          handleDataUpdate(updatedData);
          toast.success('Shelf created successfully');
        } else {
          // Update existing shelf
          const updatedShelf = await updateShelf(formValues.id, {
            name: formValues.name,
            width: formValues.width,
            depth: formValues.depth
          });

          const updatedRows = internalFarmData.farm.rows!.map(row => ({
            ...row,
            racks: row.racks?.map(rack => ({
              ...rack,
              shelves: rack.shelves?.map(shelf => 
                shelf.id === updatedShelf.id ? { 
                  ...shelf, 
                  name: updatedShelf.name,
                  width: updatedShelf.width || shelf.width,
                  depth: updatedShelf.depth || shelf.depth
                } : shelf
              ) || []
            })) || []
          }));
          const updatedData = { ...internalFarmData, farm: { ...internalFarmData.farm, rows: updatedRows } };
          handleDataUpdate(updatedData);
          toast.success('Shelf updated successfully');
        }
      }

      closeModal();
    } catch (error) {
      console.error(`Error ${modal.isNew ? 'creating' : 'updating'} ${modal.type}:`, error);
      toast.error(`Failed to ${modal.isNew ? 'create' : 'update'} ${modal.type}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  function addRow() {
    if (!editMode) return;
    openModal('row', { name: '' }, true);
  }

  function addRack(rowId: UUID) {
    if (!editMode) return;
    openModal('rack', { name: '', width: 1, depth: 1, height: 1 }, true, rowId);
  }

  function addShelf(rackId: UUID) {
    if (!editMode) return;
    openModal('shelf', { name: '', width: 1, depth: 1 }, true, undefined, rackId);
  }

  function requestDelete(type: 'farm' | 'row' | 'rack' | 'shelf', id: UUID, name?: string) {
    setConfirmDialog({ open: true, type, idToDelete: id, name });
  }

  async function handleConfirmDelete() {
    if (!confirmDialog.idToDelete || !confirmDialog.type || !internalFarmData) return;

    try {
      setIsSubmitting(true);

      if (confirmDialog.type === 'row') {
        await deleteRow(confirmDialog.idToDelete);
        const updatedRows = internalFarmData.farm.rows!.filter(row => row.id !== confirmDialog.idToDelete);
        const updatedData = { ...internalFarmData, farm: { ...internalFarmData.farm, rows: updatedRows } };
        handleDataUpdate(updatedData);
        toast.success('Row deleted successfully');
      } else if (confirmDialog.type === 'rack') {
        await deleteRack(confirmDialog.idToDelete);
        const updatedRows = internalFarmData.farm.rows!.map(row => ({
          ...row,
          racks: row.racks?.filter(rack => rack.id !== confirmDialog.idToDelete) || []
        }));
        const updatedData = { ...internalFarmData, farm: { ...internalFarmData.farm, rows: updatedRows } };
        handleDataUpdate(updatedData);
        toast.success('Rack deleted successfully');
      } else if (confirmDialog.type === 'shelf') {
        await deleteShelf(confirmDialog.idToDelete);
        const updatedRows = internalFarmData.farm.rows!.map(row => ({
          ...row,
          racks: row.racks?.map(rack => ({
            ...rack,
            shelves: rack.shelves?.filter(shelf => shelf.id !== confirmDialog.idToDelete) || []
          })) || []
        }));
        const updatedData = { ...internalFarmData, farm: { ...internalFarmData.farm, rows: updatedRows } };
        handleDataUpdate(updatedData);
        toast.success('Shelf deleted successfully');
      }

      setConfirmDialog({ open: false });
    } catch (error) {
      console.error(`Error deleting ${confirmDialog.type}:`, error);
      toast.error(`Failed to delete ${confirmDialog.type}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancelDelete() {
    setConfirmDialog({ open: false });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading farm layout...</p>
        </div>
      </div>
    );
  }

  if (!internalFarmData?.farm) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">No farm data available</p>
      </div>
    );
  }

  const farm = internalFarmData.farm;

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragStart={(e) => setDragging({ type: e.active.data.current?.type as string, id: e.active.id as UUID })} 
      onDragEnd={handleRowsReorder}
    >
      <div className="space-y-6 w-full max-w-7xl mx-auto p-4 md:p-6">
        {editMode && (
          <Button
            onClick={addRow}
            className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg"
            disabled={isSubmitting}
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Row</span>
          </Button>
        )}

        <SortableContext items={farm.rows?.map(row => row.id) || []} strategy={verticalListSortingStrategy}>
          {farm.rows && farm.rows.length > 0 ? (
            farm.rows.map((row) => (
              <div key={row.id} className="mb-6">
                <Card className={`${entityStyles.row} ${editMode ? 'border-green-500 border-2' : ''}`}>
                  <CardHeader className="flex flex-row items-center justify-between space-x-4 py-4 px-6">
                    <div className="flex items-center space-x-2">
                      {editMode && <Bars3Icon className="h-5 w-5 text-gray-400 cursor-grab" />}
                      <CardTitle 
                        className={`text-lg font-semibold ${editMode ? 'cursor-pointer hover:text-green-600' : ''}`}
                        onClick={() => editMode && openModal('row', row, false)}
                      >
                        {row.name}
                      </CardTitle>
                    </div>
                    {editMode && (
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => addRack(row.id)}
                          disabled={isSubmitting}
                        >
                          <PlusIcon className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            openModal('row', row, false); 
                          }}
                          disabled={isSubmitting}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            requestDelete('row', row.id, row.name); 
                          }}
                          disabled={isSubmitting}
                          className="hover:bg-red-50 hover:border-red-300"
                        >
                          <TrashIcon className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </CardHeader>
                  
                  <CardContent className="px-6 pb-6">
                    {row.racks && row.racks.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                        {row.racks.map((rack) => (
                          <Card 
                            key={rack.id}
                            className={`${entityStyles.rack} ${editMode ? 'border-blue-500 border-2' : ''} cursor-pointer hover:shadow-lg transition-all duration-200`}
                            onClick={() => !editMode && onRackClick(rack.id)}
                          >
                            <CardHeader className="flex flex-row items-center justify-between space-x-2 py-3 px-4">
                              <div className="flex items-center space-x-2 min-w-0">
                                {editMode && <Bars3Icon className="h-4 w-4 text-gray-400 cursor-grab flex-shrink-0" />}
                                <CardTitle 
                                  className={`text-sm font-medium truncate ${editMode ? 'cursor-pointer hover:text-blue-600' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (editMode) openModal('rack', rack, false);
                                  }}
                                >
                                  {rack.name}
                                </CardTitle>
                              </div>
                              {editMode && (
                                <div className="flex items-center space-x-1 flex-shrink-0">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      addShelf(rack.id); 
                                    }}
                                    disabled={isSubmitting}
                                    className="h-6 w-6 p-1"
                                  >
                                    <PlusIcon className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      openModal('rack', rack, false); 
                                    }}
                                    disabled={isSubmitting}
                                    className="h-6 w-6 p-1"
                                  >
                                    <PencilIcon className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      requestDelete('rack', rack.id, rack.name); 
                                    }}
                                    disabled={isSubmitting}
                                    className="h-6 w-6 p-1 hover:bg-red-50 hover:border-red-300"
                                  >
                                    <TrashIcon className="h-3 w-3 text-red-500" />
                                  </Button>
                                </div>
                              )}
                            </CardHeader>
                            
                            <CardContent className="px-4 pb-3">
                              {rack.shelves && rack.shelves.length > 0 ? (
                                <div className="space-y-2">
                                  {rack.shelves.map((shelf) => (
                                    <div 
                                      key={shelf.id}
                                      className={`${entityStyles.shelf} p-2 rounded-md ${editMode ? 'border border-purple-300' : ''} flex items-center justify-between`}
                                    >
                                      <div className="flex items-center space-x-2 min-w-0">
                                        {editMode && <Bars3Icon className="h-3 w-3 text-gray-400 cursor-grab flex-shrink-0" />}
                                        <span 
                                          className={`text-xs font-medium truncate ${editMode ? 'cursor-pointer hover:text-purple-600' : ''}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (editMode) openModal('shelf', shelf, false);
                                          }}
                                        >
                                          {shelf.name}
                                        </span>
                                      </div>
                                      {editMode && (
                                        <div className="flex items-center space-x-1 flex-shrink-0">
                                          <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={(e) => { 
                                              e.stopPropagation(); 
                                              openModal('shelf', shelf, false); 
                                            }}
                                            disabled={isSubmitting}
                                            className="h-5 w-5 p-0.5"
                                          >
                                            <PencilIcon className="h-2.5 w-2.5" />
                                          </Button>
                                          <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={(e) => { 
                                              e.stopPropagation(); 
                                              requestDelete('shelf', shelf.id, shelf.name); 
                                            }}
                                            disabled={isSubmitting}
                                            className="h-5 w-5 p-0.5 hover:bg-red-50 hover:border-red-300"
                                          >
                                            <TrashIcon className="h-2.5 w-2.5 text-red-500" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-500 italic">No shelves</div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic">No racks in this row</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No rows in this farm</p>
              {editMode && (
                <Button onClick={addRow} disabled={isSubmitting}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add First Row
                </Button>
              )}
            </div>
          )}
        </SortableContext>

        {/* Entity Edit Modal */}
        {modal.type && (
          <EntityEditModal
            open={!!modal.type}
            onClose={closeModal}
            defaultValues={modal.entity as DefaultValues<FieldValues>}
            onSave={saveModal}
            title={`${modal.isNew ? 'Create New' : 'Edit'} ${modal.type.charAt(0).toUpperCase() + modal.type.slice(1)}`}
            entityType={modal.type}
            validationSchema={getValidationSchema(modal.type)}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={confirmDialog.open} onOpenChange={() => setConfirmDialog({ open: false })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {confirmDialog.type} "{confirmDialog.name}"? 
                {confirmDialog.type === 'row' && ' This will also delete all racks and shelves in this row.'}
                {confirmDialog.type === 'rack' && ' This will also delete all shelves in this rack.'}
                {' '}This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelDelete} disabled={isSubmitting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmDelete} 
                className="bg-red-600 hover:bg-red-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DndContext>
  );
}