import React, { useState } from "react";
import EntityEditModal from "@/components/farm-layout/EntityEditModal";
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
  CardDescription,
  CardFooter,
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
} from "@/components/ui/alert-dialog"

interface Shelf { id: string; name: string; }
interface Rack { id: string; name: string; shelves: Shelf[]; }
interface Row { id: string; name: string; racks: Rack[]; }
interface Farm { name: string; location: string; }
type Entity = Farm | Row | Rack | Shelf;

// Placeholder data structure for demo
const initialData: { farm: Farm; rows: Row[] } = {
  farm: { name: "Demo Farm", location: "Greenhouse 1" },
  rows: [
    {
      id: "row-1",
      name: "Row 1",
      racks: [
        {
          id: "rack-1",
          name: "Rack 1",
          shelves: [
            { id: "shelf-1", name: "Shelf 1" },
            { id: "shelf-2", name: "Shelf 2" },
          ],
        },
      ],
    },
    {
      id: "row-2",
      name: "Row 2",
      racks: [
        {
          id: "rack-2",
          name: "Rack 2",
          shelves: [
            { id: "shelf-3", name: "Shelf 3" },
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

export default function FarmLayoutConfigurator() {
  const [data, setData] = useState<{ farm: Farm; rows: Row[] }>(initialData);
  const [modal, setModal] = useState<{ type: "farm" | "row" | "rack" | "shelf" | null; entity: Entity | null; parentIdx?: number; childIdx?: number; grandIdx?: number }>({ type: null, entity: null });
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
          }),
        };
      });
      return { ...prev, rows: newRows };
    });
  }
  }

  // Modal open/save handlers
  function openModal(type: "farm" | "row" | "rack" | "shelf", entity: Entity, parentIdx?: number, childIdx?: number, grandIdx?: number) {
    setModal({ type, entity, parentIdx, childIdx, grandIdx });
  }
  function closeModal() {
    setModal({ type: null, entity: null });
  }
  function saveModal(updated: Entity) {
    if (modal.type === "farm") {
      setData(prev => ({ ...prev, farm: { ...prev.farm, ...updated } }));
      toast.success('Farm updated');
    } else if (modal.type === "row" && typeof modal.parentIdx === "number") {
      setData(prev => {
        const newRows = prev.rows.map((row, idx) => idx === modal.parentIdx ? { ...row, ...updated } : row);
        toast.success('Row updated');
        return { ...prev, rows: newRows };
      });
    } else if (modal.type === "rack" && typeof modal.parentIdx === "number" && typeof modal.childIdx === "number") {
      setData(prev => {
        const newRows = prev.rows.map((row, rIdx) => {
          if (rIdx !== modal.parentIdx) return row;
          return {
            ...row,
            racks: row.racks.map((rack, rkIdx) => rkIdx === modal.childIdx ? { ...rack, ...updated } : rack),
          };
        });
        toast.success('Rack updated');
        return { ...prev, rows: newRows };
      });
    } else if (modal.type === "shelf" && typeof modal.parentIdx === "number" && typeof modal.childIdx === "number" && typeof modal.grandIdx === "number") {
      setData(prev => {
        const newRows = prev.rows.map((row, rIdx) => {
          if (rIdx !== modal.parentIdx) return row;
          return {
            ...row,
            racks: row.racks.map((rack, rkIdx) => {
              if (rkIdx !== modal.childIdx) return rack;
              return {
                ...rack,
                shelves: rack.shelves.map((shelf, sIdx) => sIdx === modal.grandIdx ? { ...shelf, ...updated } : shelf),
              };
            }),
          };
        });
        toast.success('Shelf updated');
        return { ...prev, rows: newRows };
      });
    }
    closeModal();
  }

  // Add handlers for add/delete
  function addRow() {
    setData(prev => ({
      ...prev,
      rows: [...prev.rows, { id: `row-${Date.now()}`, name: 'New Row', racks: [] }],
    }));
    toast.success('Row added');
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
  function addRack(rowIdx: number) {
    setData(prev => {
      const newRows = prev.rows.map((row, idx) => idx === rowIdx ? { ...row, racks: [...row.racks, { id: `rack-${Date.now()}`, name: 'New Rack', shelves: [] }] } : row);
      toast.success('Rack added');
      return { ...prev, rows: newRows };
    });
  }
  function addShelf(rowIdx: number, rackIdx: number) {
    setData(prev => {
      const newRows = prev.rows.map((row, rIdx) => rIdx === rowIdx ? {
        ...row,
        racks: row.racks.map((rack, rkIdx) => rkIdx === rackIdx ? { ...rack, shelves: [...rack.shelves, { id: `shelf-${Date.now()}`, name: 'New Shelf' }] } : rack),
      } : row);
      toast.success('Shelf added');
      return { ...prev, rows: newRows };
    });
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => openModal("farm", data.farm)}>
                    <PencilIcon className="w-4 h-4" />
                    <span className="sr-only">Edit Farm</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit Farm</TooltipContent>
              </Tooltip>
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
                              <Button variant="ghost" size="icon" onClick={() => openModal("row", row, rowIdx)}>
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
                                          <Button variant="ghost" size="icon" onClick={() => openModal("rack", rack, rowIdx, rackIdx)}>
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
                                                    <Button variant="ghost" size="icon" onClick={() => openModal("shelf", shelf, rowIdx, rackIdx, shelfIdx)}>
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
        <EntityEditModal
          open={!!modal.type}
          entity={modal.entity}
          onSave={saveModal}
          onClose={closeModal}
          title={`Edit ${modal.type.charAt(0).toUpperCase() + modal.type.slice(1)}`}
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
                Are you sure you want to delete {confirmDialog.type} "{confirmDialog.name || ''}"? This action cannot be undone.
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
