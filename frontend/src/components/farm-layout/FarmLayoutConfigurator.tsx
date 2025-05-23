import React, { useState } from "react";
import EntityEditModal, { EntityType } from "@/components/farm-layout/EntityEditModal";
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, KeyboardSensor, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { PlusIcon, TrashIcon, PencilIcon, Bars3Icon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { FanSchema, FanFormData } from "@/lib/validations/fanSchemas";
import { SensorDeviceSchema, SensorDeviceFormData } from "@/lib/validations/sensorDeviceSchemas";
import { ZodType } from "zod";

// Updated interfaces to align with Zod schemas (optional/nullable where appropriate)
interface DBShelf extends ShelfFormData { id: string; rack_id: string; } 
interface DBRack extends RackFormData { id: string; row_id: string; shelves: DBShelf[]; }
interface DBRow extends RowFormData { id: string; farm_id: string; racks: DBRack[]; }
interface DBFarm extends FarmFormData { id: string; } 

// Type for the entity being edited in the modal
type ModalFormData = FarmFormData | RowFormData | RackFormData | ShelfFormData | FanFormData | SensorDeviceFormData;
// Type for entities stored in the main 'data' state
type DataEntity = DBFarm | DBRow | DBRack | DBShelf; // Fan/Sensor not in main data tree yet

const initialFarmId = `farm-${Date.now()}`;
const initialRow1Id = `row-${Date.now()}-1`;
const initialRow2Id = `row-${Date.now()}-2`;
const initialRack1Id = `rack-${Date.now()}-1`;
const initialRack2Id = `rack-${Date.now()}-2`;

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
            { id: `shelf-${Date.now()}-1`, rack_id: initialRack1Id, name: "Shelf A1.1", position_in_rack: 1, width: 2, depth: 1, max_weight: 20 },
            { id: `shelf-${Date.now()}-2`, rack_id: initialRack1Id, name: "Shelf A1.2", position_in_rack: 2, width: 2, depth: 1, max_weight: 20 },
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
            { id: `shelf-${Date.now()}-3`, rack_id: initialRack2Id, name: "Shelf B1.1", position_in_rack: 1, width: 2, depth: 1, max_weight: 20 },
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

export default function FarmLayoutConfigurator() {
  console.log("FarmLayoutConfigurator component is rendering - Test Log");
  const [data, setData] = useState<{ farm: DBFarm; rows: DBRow[] }>(initialData);
  const [modal, setModal] = useState<{
    type: EntityType | null;
    entity: Partial<ModalFormData> | null;
    isNew: boolean;
    parentIdx?: number;
    childIdx?: number;
    grandIdx?: number;
  }>({ type: null, entity: null, isNew: false });
  const [dragging, setDragging] = useState<{ type: string; id: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type?: 'row' | 'rack' | 'shelf';
    idx?: number;
    childIdx?: number;
    grandIdx?: number;
    name?: string;
  }>({ open: false });

  // Drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Handlers for drag-and-drop at each level
  function handleRowsReorder(event: DragEndEvent) {
    const { active, over } = event;
    setDragging(null);
    if (over && String(active.id) !== String(over.id)) {
      setData(prev => {
        const oldIndex = prev.rows.findIndex(r => r.id === active.id);
        const newIndex = prev.rows.findIndex(r => r.id === over.id);
        const newRows = arrayMove(prev.rows, oldIndex, newIndex);
        toast.success('Row reordered');
        return { ...prev, rows: newRows };
      });
    }
  }
  function handleRacksReorder(rowIdx: number, event: DragEndEvent) {
    const { active, over } = event;
    setDragging(null);
    if (over && String(active.id) !== String(over.id)) {
      setData(prev => {
        const newRows = prev.rows.map((row, rIdx) => {
          if (rIdx !== rowIdx) return row;
          const oldIndex = row.racks.findIndex(rack => rack.id === active.id);
          const newIndex = row.racks.findIndex(rack => rack.id === over.id);
          toast.success('Rack reordered');
          return { ...row, racks: arrayMove(row.racks, oldIndex, newIndex) };
        });
        return { ...prev, rows: newRows };
      });
    }
  }
  function handleShelvesReorder(rowIdx: number, rackIdx: number, event: DragEndEvent) {
    const { active, over } = event;
    setDragging(null);
    if (over && String(active.id) !== String(over.id)) {
      setData(prev => {
      const newRows = prev.rows.map((row, rIdx) => {
        if (rIdx !== rowIdx) return row;
        return {
          ...row,
          racks: row.racks.map((rack, rkIdx) => {
            if (rkIdx !== rackIdx) return rack;
              const oldIndex = rack.shelves.findIndex(shelf => shelf.id === active.id);
              const newIndex = rack.shelves.findIndex(shelf => shelf.id === over.id);
              toast.success('Shelf reordered');
              return { ...rack, shelves: arrayMove(rack.shelves, oldIndex, newIndex) };
          })
        };
      });
      return { ...prev, rows: newRows };
    });
    }
  }

  // Modal open/save handlers
  function openModal(
    type: EntityType,
    entityData: DataEntity | Partial<ModalFormData>,
    isNewCreation: boolean,
    parentIdx?: number,
    childIdx?: number,
    grandIdx?: number
  ) {
    setModal({ type, entity: entityData, isNew: isNewCreation, parentIdx, childIdx, grandIdx });
  }

  function closeModal() {
    setModal({ type: null, entity: null, isNew: false });
  }

  function saveModal(formValues: ModalFormData) {
    const { type, parentIdx, childIdx, grandIdx, isNew } = modal;
    if (!type) return;

    if (type === "farm") {
      setData(prev => ({ 
        ...prev, 
        farm: { 
          id: prev.farm.id, // Preserve ID
          ...(formValues as FarmFormData), // Spread validated form data
        } as DBFarm, // Ensure result matches DBFarm structure
      }));
      toast.success('Farm updated');
    } else if (type === "row") {
      if (isNew && typeof parentIdx === 'number') { 
        const newRow: DBRow = {
          ...(formValues as RowFormData), // Spread validated form data first
          id: `row-${Date.now()}`,
          farm_id: data.farm.id, // Set parent ID
          racks: [],
        };
        setData(prev => ({ ...prev, rows: [...prev.rows.slice(0, parentIdx), newRow, ...prev.rows.slice(parentIdx)] }));
        toast.success('Row created');
      } else if (!isNew && typeof parentIdx === 'number' && data.rows[parentIdx]) {
        const existingRow = data.rows[parentIdx];
        const updatedRow: DBRow = {
          ...existingRow, // Keep existing id, farm_id, racks
          ...(formValues as RowFormData), // Override with new form values
        };
        setData(prev => {
          const newRows = [...prev.rows];
          newRows[parentIdx] = updatedRow;
          return { ...prev, rows: newRows };
        });
        toast.success('Row updated');
      }
    } else if (type === "rack" && typeof parentIdx === 'number' && data.rows[parentIdx]) {
      const parentRow = data.rows[parentIdx];
      if (isNew && typeof childIdx === 'number') {
        const newRack: DBRack = {
          ...(formValues as RackFormData), // Spread validated form data first
          id: `rack-${Date.now()}`,
          row_id: parentRow.id, // Set parent ID
          shelves: [],
        };
        setData(prev => {
          const newRows = [...prev.rows];
          const newRacks = [...parentRow.racks.slice(0, childIdx), newRack, ...parentRow.racks.slice(childIdx)];
          newRows[parentIdx] = { ...parentRow, racks: newRacks };
          return { ...prev, rows: newRows };
        });
        toast.success('Rack created');
      } else if (!isNew && typeof childIdx === 'number' && parentRow.racks[childIdx]) {
        const existingRack = parentRow.racks[childIdx];
        const updatedRack: DBRack = {
          ...existingRack, // Keep existing id, row_id, shelves
          ...(formValues as RackFormData),
        };
        setData(prev => {
          const newRows = [...prev.rows];
          const newRacks = [...parentRow.racks];
          newRacks[childIdx] = updatedRack;
          newRows[parentIdx] = { ...parentRow, racks: newRacks };
          return { ...prev, rows: newRows };
        });
        toast.success('Rack updated');
      }
    } else if (type === "shelf" && typeof parentIdx === 'number' && typeof childIdx === 'number' && data.rows[parentIdx]?.racks[childIdx]) {
      const parentRack = data.rows[parentIdx].racks[childIdx];
      if (isNew && typeof grandIdx === 'number') {
        const newShelf: DBShelf = {
          ...(formValues as ShelfFormData), // Spread validated form data first
          id: `shelf-${Date.now()}`,
          rack_id: parentRack.id, // Set parent ID
        };
        setData(prev => {
          const newRows = [...prev.rows];
          const newRacks = [...data.rows[parentIdx].racks];
          const newShelves = [...parentRack.shelves.slice(0, grandIdx), newShelf, ...parentRack.shelves.slice(grandIdx)];
          newRacks[childIdx] = { ...parentRack, shelves: newShelves };
          newRows[parentIdx] = { ...data.rows[parentIdx], racks: newRacks };
          return { ...prev, rows: newRows };
        });
        toast.success('Shelf created');
      } else if (!isNew && typeof grandIdx === 'number' && parentRack.shelves[grandIdx]) {
        const existingShelf = parentRack.shelves[grandIdx];
        const updatedShelf: DBShelf = {
          ...existingShelf, // Keep existing id, rack_id
          ...(formValues as ShelfFormData),
        };
        setData(prev => {
          const newRows = [...prev.rows];
          const newRacks = [...data.rows[parentIdx].racks];
          const newShelves = [...parentRack.shelves];
          newShelves[grandIdx] = updatedShelf;
          newRacks[childIdx] = { ...parentRack, shelves: newShelves };
          newRows[parentIdx] = { ...data.rows[parentIdx], racks: newRacks };
          return { ...prev, rows: newRows };
        });
        toast.success('Shelf updated');
      }
    }
    closeModal();
  }

  function addRow() {
    const newRowDefaults: Partial<RowFormData> = {
      name: "New Row", position_x: 0, position_y: 0, length: 10, orientation: "horizontal",
      farm_id: data.farm.id, // Pre-fill parent ID for the form default
    };
    openModal('row', newRowDefaults, true, data.rows.length);
  }

  function addRack(rowIdx: number) {
    const parentRow = data.rows[rowIdx];
    if (!parentRow) return;
    const newRackDefaults: Partial<RackFormData> = {
      name: "New Rack", position_in_row: (parentRow.racks?.length || 0) + 1,
      width: 1, depth: 1, height: 2, max_shelves: 4,
      row_id: parentRow.id, // Pre-fill parent ID
    };
    openModal('rack', newRackDefaults, true, rowIdx, parentRow.racks.length);
  }

  function addShelf(rowIdx: number, rackIdx: number) {
    const parentRack = data.rows[rowIdx]?.racks[rackIdx];
    if (!parentRack) return;
    const newShelfDefaults: Partial<ShelfFormData> = {
      name: "New Shelf", position_in_rack: (parentRack.shelves?.length || 0) + 1,
      width: parentRack.width ?? 1, depth: parentRack.depth ?? 1, max_weight: 10,
      rack_id: parentRack.id, // Pre-fill parent ID
    };
    openModal('shelf', newShelfDefaults, true, rowIdx, rackIdx, parentRack.shelves.length);
  }

  function requestDelete(type: 'row' | 'rack' | 'shelf', idx: number, childIdx?: number, grandIdx?: number, name?: string) {
    setConfirmDialog({ open: true, type, idx, childIdx, grandIdx, name });
  }
  function handleConfirmDelete() {
    const { type, idx, childIdx, grandIdx } = confirmDialog;
    if (type === 'row' && typeof idx === 'number') {
      setData(prev => ({ ...prev, rows: prev.rows.filter((_, i) => i !== idx) }));
      toast('Row deleted', { icon: '🗑️' });
    } else if (type === 'rack' && typeof idx === 'number' && typeof childIdx === 'number') {
      setData(prev => {
        const newRows = prev.rows.map((row, rIdx) => rIdx === idx ? { ...row, racks: row.racks.filter((_, i) => i !== childIdx) } : row);
        toast('Rack deleted', { icon: '🗑️' });
        return { ...prev, rows: newRows };
      });
    } else if (type === 'shelf' && typeof idx === 'number' && typeof childIdx === 'number' && typeof grandIdx === 'number') {
      setData(prev => {
        const newRows = prev.rows.map((row, rIdx) => rIdx === idx ? {
          ...row,
          racks: row.racks.map((rack, rkIdx) => rkIdx === childIdx ? { ...rack, shelves: rack.shelves.filter((_, i) => i !== grandIdx) } : rack),
        } : row);
        toast('Shelf deleted', { icon: '🗑️' });
        return { ...prev, rows: newRows };
      });
    }
    setConfirmDialog({ open: false });
  }
  function handleCancelDelete() {
    setConfirmDialog({ open: false });
  }

  return (
    <TooltipProvider>
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 p-4">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-400 text-white"><Bars3Icon className="w-5 h-5" /></span>
          Farm Layout
        </h1>
        <Card className={`${entityStyles.farm}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-500 text-white"><Bars3Icon className="w-4 h-4" /></span>
                Farm: {data.farm.name}
              </CardTitle>
              {/* <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => openModal("farm", data.farm, false)}>
                    <PencilIcon className="w-4 h-4" />
                    <span className="sr-only">Edit Farm</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit Farm</TooltipContent>
              </Tooltip> */}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end mb-4">
                <Button onClick={addRow}>
                    <PlusIcon className="w-4 h-4 mr-2" /> Add Row
                </Button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={({ active }) => setDragging({ type: 'row', id: String(active.id)})} onDragEnd={handleRowsReorder}>
              <SortableContext items={data.rows.map(r => r.id)} strategy={verticalListSortingStrategy}>
                {data.rows.map((row, rowIdx) => (
                  <Card key={row.id} className={`mb-4 min-h-[150px] relative ${entityStyles.row} ${dragging?.id === row.id && 'opacity-50'}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white"><Bars3Icon className="w-3 h-3" /></span>
                          Row {rowIdx + 1}: {row.name}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => openModal("row", row, false, rowIdx)}>
                                <PencilIcon className="w-4 h-4 text-blue-500" />
                                <span className="sr-only">Edit Row</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit Row</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => requestDelete('row', rowIdx, undefined, undefined, row.name)}>
                                <TrashIcon className="w-4 h-4 text-red-500" />
                                <span className="sr-only">Delete Row</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete Row</TooltipContent>
                          </Tooltip>
                          <Button size="sm" onClick={() => addRack(rowIdx)}>
                            <PlusIcon className="w-3 h-3 mr-1" /> Add Rack
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Racks rendering */}
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={({ active }) => setDragging({ type: 'rack', id: String(active.id)})} onDragEnd={(e) => handleRacksReorder(rowIdx, e)}>
                        <SortableContext items={row.racks.map(r => r.id)} strategy={horizontalListSortingStrategy}>
                          <div className="flex flex-wrap gap-4">
                            {row.racks.map((rack, rackIdx) => (
                              <Card key={rack.id} className={`p-3 flex-1 min-w-[200px] relative ${entityStyles.rack} ${dragging?.id === rack.id && 'opacity-50'}`}>
                                <CardHeader className="p-0 mb-2">
                                  <div className="flex items-center justify-between">
                                    <CardTitle className="text-md font-medium flex items-center gap-1">
                                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow-500 text-white text-xs"><Bars3Icon className="w-3 h-3" /></span>
                                      Rack {rackIdx + 1}: {rack.name}
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="icon" onClick={() => openModal("rack", rack, false, rowIdx, rackIdx)}>
                                            <PencilIcon className="w-4 h-4 text-blue-500" />
                                            <span className="sr-only">Edit Rack</span>
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Edit Rack</TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="icon" onClick={() => requestDelete('rack', rowIdx, rackIdx, undefined, rack.name)}>
                                            <TrashIcon className="w-4 h-4 text-red-500" />
                                            <span className="sr-only">Delete Rack</span>
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Delete Rack</TooltipContent>
                                      </Tooltip>
                                      <Button size="sm" variant="secondary" onClick={() => addShelf(rowIdx, rackIdx)}>
                                        <PlusIcon className="w-3 h-3 mr-1" /> Add Shelf
                                      </Button>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                  {/* Shelves rendering */}
                                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={({ active }) => setDragging({ type: 'shelf', id: String(active.id)})} onDragEnd={(e) => handleShelvesReorder(rowIdx, rackIdx, e)}>
                                    <SortableContext items={rack.shelves.map(s => s.id)} strategy={verticalListSortingStrategy}>
                                      {rack.shelves.map((shelf, shelfIdx) => (
                                        <Card key={shelf.id} className={`p-2 mb-2 min-h-[40px] relative bg-white/80 ${entityStyles.shelf} ${dragging?.id === shelf.id && 'opacity-50'}`}>
                                          <CardHeader className="p-0">
                                            <div className="flex items-center justify-between">
                                              <CardTitle className="text-sm flex items-center gap-1">
                                                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-purple-500 text-white text-xs"><Bars3Icon className="w-2 h-2" /></span>
                                                Shelf {shelfIdx + 1}: {shelf.name}
                                              </CardTitle>
                                              <div className="flex items-center gap-1">
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" onClick={() => openModal("shelf", shelf, false, rowIdx, rackIdx, shelfIdx)}>
                                                      <PencilIcon className="w-4 h-4 text-blue-500" />
                                                      <span className="sr-only">Edit Shelf</span>
                                                    </Button>
                                                  </TooltipTrigger>
                                                  <TooltipContent>Edit Shelf</TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" onClick={() => requestDelete('shelf', rowIdx, rackIdx, shelfIdx, shelf.name)}>
                                                      <TrashIcon className="w-4 h-4 text-red-500" />
                                                      <span className="sr-only">Delete Shelf</span>
                                                    </Button>
                                                  </TooltipTrigger>
                                                  <TooltipContent>Delete Shelf</TooltipContent>
                                                </Tooltip>
                                              </div>
                                            </div>
                                          </CardHeader>
                                        </Card>
                                      ))}
                                    </SortableContext>
                                  </DndContext>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </CardContent>
                  </Card>
                ))}
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>

      {/* Modal for editing */}
      {modal.type && modal.entity && (
        <EntityEditModal<ModalFormData>
          open={!!modal.type}
          defaultValues={modal.entity}
          onSave={saveModal}
          onClose={closeModal}
          title={`${modal.isNew ? 'Create New' : 'Edit'} ${modal.type.charAt(0).toUpperCase() + modal.type.slice(1)}`}
          entityType={modal.type}
          validationSchema={getValidationSchema(modal.type)}
        />
      )}

      {/* Confirmation Dialog for Delete */}
      {confirmDialog.open && (
        <AlertDialog open={confirmDialog.open} onOpenChange={(isOpen) => !isOpen && handleCancelDelete()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600 mr-2" />
                Confirm Deletion
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {confirmDialog.type} &quot;{confirmDialog.name || ''}&quot;? This action cannot be undone.
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
      )}
    </div>
    </TooltipProvider>
  );
}