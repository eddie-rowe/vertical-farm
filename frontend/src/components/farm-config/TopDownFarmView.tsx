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
import { FarmSchema, FarmFormData } from "@/lib/validations/farmSchemas";
import { RowSchema, RowFormData } from "@/lib/validations/rowSchemas";
import { RackSchema, RackFormData } from "@/lib/validations/rackSchemas";
import { ShelfSchema, ShelfFormData } from "@/lib/validations/shelfSchemas";
import { FanSchema } from "@/lib/validations/fanSchemas";
import { SensorDeviceSchema } from "@/lib/validations/sensorDeviceSchemas";
import { ZodType } from "zod";
import { FarmPageData, Farm, Row, Rack, UUID } from "@/types/farm-layout";
import { FieldValues, DefaultValues } from "react-hook-form";
import { v4 as uuidv4 } from 'uuid';

// Updated interfaces to align with Zod schemas (optional/nullable where appropriate)
interface DBShelf extends ShelfFormData { id: string; rack_id: string; } 
interface DBRack extends RackFormData { id: string; row_id: string; shelves: DBShelf[]; }
interface DBRow extends RowFormData { id: string; farm_id: string; racks: DBRack[]; }
interface DBFarm extends FarmFormData { id: string; } 

// Type for the entity being edited in the modal
type ConfigurableEntityData = FarmFormData | RowFormData | RackFormData | ShelfFormData; // Removed Fan/Sensor for now

// Type for entities stored in the main 'data' state
type DataEntity = DBFarm | DBRow | DBRack | DBShelf; // Fan/Sensor not in main data tree yet

const initialFarmId = uuidv4();
const initialRow1Id = uuidv4();
const initialRow2Id = uuidv4();
const initialRack1Id = uuidv4();
const initialRack2Id = uuidv4();

const initialData: { farm: DBFarm; rows: DBRow[] } = {
  farm: { 
    id: initialFarmId, 
    name: "Demo Farm", 
    location: "Greenhouse 1", 
    width: 100, 
    depth: 50, 
    plan_image_url: null 
  },
  rows: [
    {
      id: initialRow1Id,
      farm_id: initialFarmId, 
      name: "Row A",
      position_x: 10,
      position_y: 5,
      length: 40,
      orientation: "horizontal",
      racks: [
        {
          id: initialRack1Id,
          row_id: initialRow1Id,
          name: "Rack A1",
          position_in_row: 1,
          width: 2,
          depth: 1,
          height: 2.5,
          max_shelves: 5,
          shelves: [
            { id: uuidv4(), rack_id: initialRack1Id, name: "Shelf A1.1", position_in_rack: 1, width: 2, depth: 1, max_weight: 20 },
            { id: uuidv4(), rack_id: initialRack1Id, name: "Shelf A1.2", position_in_rack: 2, width: 2, depth: 1, max_weight: 20 },
          ],
        },
      ],
    },
    {
      id: initialRow2Id,
      farm_id: initialFarmId,
      name: "Row B",
      position_x: 10,
      position_y: 15,
      length: 40,
      orientation: "horizontal",
      racks: [
        {
          id: initialRack2Id,
          row_id: initialRow2Id,
          name: "Rack B1",
          position_in_row: 1,
          width: 2,
          depth: 1,
          height: 2.5,
          max_shelves: 5,
          shelves: [
            { id: uuidv4(), rack_id: initialRack2Id, name: "Shelf B1.1", position_in_rack: 1, width: 2, depth: 1, max_weight: 20 },
          ],
        },
      ],
    },
  ],
};

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

  useEffect(() => {
    setInternalFarmData(farmPageData ? JSON.parse(JSON.stringify(farmPageData)) : null);
  }, [farmPageData]);

  const handleDataUpdate = (updatedData: FarmPageData) => {
    setInternalFarmData(updatedData); 
    onFarmPageDataChange(JSON.parse(JSON.stringify(updatedData))); 
  };

  const [modal, setModal] = useState<{
    type: EntityType | null;
    entity: Partial<ConfigurableEntityData> | null;
    isNew: boolean;
    parentRowId?: UUID; // For adding a new rack to a specific row
  }>({ type: null, entity: null, isNew: false });

  const [dragging, setDragging] = useState<{ type: string; id: UUID } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type?: 'farm' | 'row' | 'rack'; 
    idToDelete?: UUID;
    name?: string;
  }>({ open: false });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleRowsReorder(event: DragEndEvent) {
    const { active, over } = event;
    setDragging(null);
    if (over && active.id !== over.id) {
      setInternalFarmData(prev => {
        if (!prev?.farm.rows) return prev;
        const oldIndex = prev.farm.rows.findIndex(r => r.id === active.id);
        const newIndex = prev.farm.rows.findIndex(r => r.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return prev;
        const newRows = arrayMove(prev.farm.rows, oldIndex, newIndex);
        const updatedData = { ...prev, farm: { ...prev.farm, rows: newRows } };
        handleDataUpdate(updatedData);
        toast.success('Row reordered');
        return updatedData;
      });
    }
  }

  function handleRacksReorder(rowId: UUID, event: DragEndEvent) {
    const { active, over } = event;
    setDragging(null);
    if (over && active.id !== over.id) {
      setInternalFarmData(prev => {
        if (!prev?.farm.rows) return prev;
        const newRows = prev.farm.rows.map(row => {
          if (row.id !== rowId || !row.racks) return row;
          const oldIndex = row.racks.findIndex(rack => rack.id === active.id);
          const newIndex = row.racks.findIndex(rack => rack.id === over.id);
          if (oldIndex === -1 || newIndex === -1) return row;
          return { ...row, racks: arrayMove(row.racks, oldIndex, newIndex) };
        });
        const updatedData = { ...prev, farm: { ...prev.farm, rows: newRows } };
        handleDataUpdate(updatedData);
        toast.success('Rack reordered');
        return updatedData;
      });
    }
  }

  function openModal(
    type: EntityType,
    entityData: Partial<ConfigurableEntityData> | Farm | Row | Rack, 
    isNewCreation: boolean,
    parentRowId?: UUID
  ) {
    let modalEntity: Partial<ConfigurableEntityData> = entityData;
    if (isNewCreation && type === 'row') {
        // Ensure internalFarmData and internalFarmData.farm exist before accessing id
        const farmId = internalFarmData?.farm?.id;
        if (farmId) {
            modalEntity = { ...entityData, farm_id: farmId } as Partial<RowFormData>;
        } else {
            toast.error("Cannot add row: Farm data is missing.");
            return; // Early exit if no farm context
        }
    } else if (isNewCreation && type === 'rack' && parentRowId) {
        modalEntity = { ...entityData, row_id: parentRowId } as Partial<RackFormData>;
    }
    setModal({ type, entity: modalEntity, isNew: isNewCreation, parentRowId });
  }

  function closeModal() {
    setModal({ type: null, entity: null, isNew: false });
  }

  function saveModal(formValues: Record<string, any>) {
    const { type, isNew, parentRowId } = modal;
    
    if (!type || !internalFarmData || !internalFarmData.farm) {
        toast.error("Cannot save: Farm data is not available.");
        closeModal();
        return;
    }

    const updatedData: FarmPageData = JSON.parse(JSON.stringify(internalFarmData));
    let dataDidChange = false;
    
    // Cast formValues to the specific type based on modal.type
    // This assumes EntityEditModal correctly provides data aligning with these types.
    let currentFormValues: ConfigurableEntityData;
    switch (type) {
        case 'farm': currentFormValues = formValues as FarmFormData; break;
        case 'row': currentFormValues = formValues as RowFormData; break;
        case 'rack': currentFormValues = formValues as RackFormData; break;
        case 'shelf': currentFormValues = formValues as ShelfFormData; break;
        // case 'fan': currentFormValues = formValues as FanFormData; break;
        // case 'sensorDevice': currentFormValues = formValues as SensorDeviceFormData; break;
        default: 
            toast.error(`Cannot save: Unknown entity type '${type}'`);
            closeModal();
            return;
    }

    if (type === "farm") {
      const farmFormData = currentFormValues as FarmFormData;
      updatedData.farm = {
        ...updatedData.farm, 
        ...farmFormData,    
      };
      dataDidChange = true;
      toast.success('Farm updated');
    } else if (type === "row") {
      const rowFormData = currentFormValues as RowFormData;
      if (isNew) {
        const newRow: Row = {
          ...rowFormData,
          id: uuidv4() as UUID,
          farm_id: updatedData.farm.id,
          racks: [],
        };
        updatedData.farm.rows = [...(updatedData.farm.rows || []), newRow];
        dataDidChange = true;
        toast.success('Row added');
      } else if (modal.entity && (modal.entity as Row).id) { 
        const existingRowId = (modal.entity as Row).id;
        const originalRows = updatedData.farm.rows || [];
        updatedData.farm.rows = originalRows.map(r => 
          r.id === existingRowId ? { ...r, ...rowFormData, id: r.id, farm_id: r.farm_id } : r
        );
        dataDidChange = JSON.stringify(updatedData.farm.rows) !== JSON.stringify(originalRows);
        if (dataDidChange) toast.success('Row updated');
      }
    } else if (type === "rack") {
      const rackFormData = currentFormValues as RackFormData;
      if (isNew && parentRowId) {
        const newRack: Rack = {
          ...rackFormData,
          id: uuidv4() as UUID,
          row_id: parentRowId,
          shelves: [],
        };
        const originalRows = updatedData.farm.rows || [];
        updatedData.farm.rows = originalRows.map(row => {
          if (row.id === parentRowId) {
            return { ...row, racks: [...(row.racks || []), newRack] };
          }
          return row;
        });
        dataDidChange = JSON.stringify(updatedData.farm.rows) !== JSON.stringify(originalRows);
        if (dataDidChange) toast.success('Rack added');
      } else if (!isNew && modal.entity && (modal.entity as Rack).id) { 
        const existingRackId = (modal.entity as Rack).id;
        const targetRowId = (modal.entity as Rack).row_id;
        const originalRows = updatedData.farm.rows || [];
        updatedData.farm.rows = originalRows.map(row => {
          if (row.id === targetRowId) {
            return {
              ...row,
              racks: row.racks?.map(rk => 
                rk.id === existingRackId ? { ...rk, ...rackFormData, id: rk.id, row_id: rk.row_id } : rk
              )
            };
          }
          return row;
        });
        dataDidChange = JSON.stringify(updatedData.farm.rows) !== JSON.stringify(originalRows);
        if (dataDidChange) toast.success('Rack updated');
      }
    } else if (type === "shelf") {
      // Shelf logic is deferred for TopDownFarmView
      toast('Shelf editing is handled in Rack Detail view.'); 
    }

    if (dataDidChange) {
        handleDataUpdate(updatedData);
    }
    closeModal();
  }

  function addRow() {
    if (!internalFarmData) return;
    openModal("row", 
      { name: "New Row", orientation: "horizontal", length: 10, position_x: 0, position_y: 0 }, 
      true 
    );
  }
  
  function addRack(rowId: UUID) {
    if (!internalFarmData?.farm.rows) return;
    const parentRow = internalFarmData.farm.rows.find(r => r.id === rowId);
    if (!parentRow) return;
    openModal("rack", 
      { name: "New Rack", width: 1, depth: 1, height: 2, max_shelves: 4, position_in_row: (parentRow.racks?.length || 0) + 1 }, 
      true,
      rowId 
    );
  }

  function requestDelete(type: 'farm' | 'row' | 'rack', id: UUID, name?: string) {
    setConfirmDialog({ open: true, type, idToDelete: id, name: name || type });
  }
  
  function handleConfirmDelete() {
    const { type, idToDelete, name } = confirmDialog;
    if (!type || !idToDelete || !internalFarmData) {
      setConfirmDialog({ open: false });
      return;
    }

    const itemType = type.charAt(0).toUpperCase() + type.slice(1);
    const itemName = name || "item";
    let dataChanged = false;
    const newFarmPageData: FarmPageData = JSON.parse(JSON.stringify(internalFarmData)); 

    if (type === "farm") {
        toast.error("Farm deletion from this view is not supported.");
        setConfirmDialog({ open: false });
        return;
    }
    if (type === "row") {
      const initialCount = newFarmPageData.farm.rows?.length || 0;
      newFarmPageData.farm.rows = newFarmPageData.farm.rows?.filter(r => r.id !== idToDelete);
      dataChanged = (newFarmPageData.farm.rows?.length || 0) !== initialCount;
    } else if (type === "rack") {
      let rackRemovedFromAnyRow = false;
      newFarmPageData.farm.rows = newFarmPageData.farm.rows?.map(row => {
        const initialRackCount = row.racks?.length || 0;
        const updatedRacks = row.racks?.filter(rk => rk.id !== idToDelete);
        if ((updatedRacks?.length || 0) !== initialRackCount) {
            rackRemovedFromAnyRow = true;
        }
        return { ...row, racks: updatedRacks };
      });
      dataChanged = rackRemovedFromAnyRow;
    }
    
    if (dataChanged) {
        handleDataUpdate(newFarmPageData);
        toast.success(`${itemType} "${itemName}" deleted`);
    } else {
        toast.error(`Could not delete ${itemType} "${itemName}". Item not found.`);
    }
    setConfirmDialog({ open: false });
  }

  function handleCancelDelete() {
    setConfirmDialog({ open: false });
  }

  if (!internalFarmData || !internalFarmData.farm) {
    return <div className="text-center py-10">Loading farm configuration...</div>;
  }

  const { farm } = internalFarmData;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={(e) => setDragging({ type: e.active.data.current?.type as string, id: e.active.id as UUID })} onDragEnd={handleRowsReorder}>
      <div className="space-y-6 w-full max-w-7xl mx-auto p-4 md:p-6">
        <Card className={`${entityStyles.farm} ${editMode ? 'border-blue-500 border-2' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-x-4 py-4 px-6">
            <CardTitle 
              className={`text-xl font-semibold ${editMode ? 'cursor-pointer hover:text-blue-600' : ''}`}
              onClick={() => editMode && openModal('farm', farm as FarmFormData, false)}
            >
              Farm: {farm.name}
            </CardTitle>
            {editMode && (
              <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); openModal('farm', farm as FarmFormData, false);}}>
                <PencilIcon className="h-5 w-5" />
              </Button>
            )}
          </CardHeader>
          <CardContent className={`px-6 pb-4 ${editMode ? 'cursor-pointer' : ''}`} onClick={() => editMode && openModal('farm', farm as FarmFormData, false)}>
            <p><span className="font-medium">Location:</span> {farm.location || <span className="text-gray-500">N/A</span>}</p>
            <p><span className="font-medium">Dimensions:</span> {farm.width || 'N/A'}W x {farm.depth || 'N/A'}D</p>
          </CardContent>
        </Card>

        {editMode && (
          <div className="my-6 text-center">
            <Button onClick={addRow} className="bg-green-600 hover:bg-green-700 text-white">
              <PlusIcon className="h-5 w-5 mr-2" /> Add Row
            </Button>
          </div>
        )}
        
        <SortableContext items={farm.rows?.map(r => r.id) || []} strategy={verticalListSortingStrategy}>
          {farm.rows?.map((row) => (
            <Card key={row.id} className={`${entityStyles.row} mb-6 ${editMode ? 'border-green-500 border' : ''} ${dragging?.type === 'row' && dragging.id === row.id ? 'opacity-60 ring-2 ring-offset-2 ring-blue-500' : ''}`}>
              <CardHeader className="flex flex-row items-center justify-between space-x-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-t-lg">
                <div className="flex items-center">
                  {editMode && <Bars3Icon className="h-6 w-6 mr-3 text-gray-500 cursor-grab" />}
                  <CardTitle 
                    className={`text-lg font-medium ${editMode ? 'cursor-pointer hover:text-green-600' : ''}`}
                    onClick={() => editMode && openModal('row', row as RowFormData, false)}
                  >
                    {row.name}
                  </CardTitle>
                </div>
                {editMode && (
                  <div className="flex space-x-2">
                    <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); openModal('row', row as RowFormData, false);}}><PencilIcon className="h-5 w-5" /></Button>
                    <Button variant="destructive" size="icon" onClick={(e) => { e.stopPropagation(); requestDelete('row', row.id, row.name);}}><TrashIcon className="h-5 w-5" /></Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <p className="text-sm"><span className="font-medium">Orientation:</span> {row.orientation}, <span className="font-medium">Length:</span> {row.length}m, <span className="font-medium">Position:</span> ({row.position_x}, {row.position_y})</p>
                {editMode && (
                  <div className="pt-2">
                    <Button onClick={() => addRack(row.id)} size="sm" className="bg-lime-600 hover:bg-lime-700 text-white">
                      <PlusIcon className="h-4 w-4 mr-2" /> Add Rack to {row.name}
                    </Button>
                  </div>
                )}
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={(e) => setDragging({ type: e.active.data.current?.type as string, id: e.active.id as UUID})} onDragEnd={(e) => handleRacksReorder(row.id, e)}>
                  <SortableContext items={row.racks?.map(r => r.id) || []} strategy={horizontalListSortingStrategy}>
                    <div className="flex space-x-3 overflow-x-auto py-3 px-1">
                      {row.racks?.map((rack) => (
                        <Card 
                          key={rack.id} 
                          onClick={() => !editMode && onRackClick(rack.id)}
                          className={`min-w-[220px] max-w-[250px] flex-shrink-0 ${entityStyles.rack} ${editMode ? 'cursor-default border-lime-500 border' : 'cursor-pointer hover:shadow-lg active:shadow-xl'} ${dragging?.type === 'rack' && dragging.id === rack.id ? 'opacity-60 ring-2 ring-offset-1 ring-sky-500' : ''}`}
                        >
                          <CardHeader className="flex flex-row items-center justify-between space-x-2 p-3">
                            <div className="flex items-center min-w-0">
                              {editMode && <Bars3Icon className="h-5 w-5 mr-2 text-gray-400 cursor-grab flex-shrink-0" />}
                              <CardTitle 
                                className={`text-base font-medium truncate ${editMode ? 'cursor-pointer hover:text-lime-600' : ''}`}
                                onClick={(e) => {if(editMode){e.stopPropagation(); openModal('rack', rack as RackFormData, false, row.id);}}}
                                title={rack.name}
                              >
                                {rack.name}
                              </CardTitle>
                            </div>
                            {editMode && (
                              <div className="flex space-x-1 flex-shrink-0">
                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openModal('rack', rack as RackFormData, false, row.id);}}><PencilIcon className="h-4 w-4" /></Button>
                                <Button variant="destructive" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); requestDelete('rack', rack.id, rack.name);}}><TrashIcon className="h-4 w-4" /></Button>
                              </div>
                            )}
                          </CardHeader>
                          <CardContent className="text-xs px-3 pb-3">
                            <p><span className="font-medium">Shelves:</span> {rack.shelves?.length || 0} / {rack.max_shelves || <span className="text-gray-500">N/A</span>}</p>
                            <p><span className="font-medium">Dims:</span> {rack.width}W x {rack.depth}D x {rack.height}H</p>
                          </CardContent>
                        </Card>
                      ))}
                      {(row.racks?.length === 0 && !editMode) && <p className="text-sm text-gray-500 italic">No racks in this row.</p>}
                    </div>
                  </SortableContext>
                </DndContext>
              </CardContent>
            </Card>
          ))}
           {(farm.rows?.length === 0 && !editMode) && <p className="text-center text-gray-500 py-5 italic">No rows in this farm. Enter edit mode to add rows.</p>}
        </SortableContext>

        {modal.type && modal.entity && (
          <EntityEditModal
            open={!!modal.type}
            onClose={closeModal}
            defaultValues={modal.entity as DefaultValues<FieldValues>}
            onSave={saveModal}
            title={`${modal.isNew ? 'Create New' : 'Edit'} ${modal.type.charAt(0).toUpperCase() + modal.type.slice(1)}`}
            entityType={modal.type as EntityType}
            validationSchema={getValidationSchema(modal.type)}
          />
        )}

        <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && handleCancelDelete()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the {confirmDialog.type} &quot;{confirmDialog.name}&quot;.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelDelete}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DndContext>
  );
}