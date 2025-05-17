import React, { useState } from "react";
import EntityEditModal from "./EntityEditModal";
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, KeyboardSensor, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { PlusIcon, TrashIcon, PencilIcon, Bars3Icon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

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
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 p-4">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-400 text-white"><Bars3Icon className="w-5 h-5" /></span>
        Farm Layout
      </h1>
      <div
        className={`border-4 border-blue-300 rounded-xl p-6 min-h-[200px] relative ${entityStyles.farm}`}
        onDoubleClick={() => openModal("farm", data.farm)}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="text-xl font-bold flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-500 text-white"><Bars3Icon className="w-4 h-4" /></span>
            Farm: {data.farm.name}
          </div>
          <button className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600" onClick={addRow}>
            <PlusIcon className="w-4 h-4" /> Add Row
          </button>
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleRowsReorder} onDragStart={e => setDragging({ type: 'row', id: String(e.active.id) })}>
          <SortableContext items={data.rows.map(r => r.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-6">
              {data.rows.length === 0 && <div className="text-gray-400 italic">No rows. Add a row to get started.</div>}
              {data.rows.map((row, rowIdx) => (
                <div
                  key={row.id}
                  className={`border-2 border-green-400 rounded-lg p-4 shadow group relative ${entityStyles.row} ${dragging && dragging.type === 'row' && dragging.id === row.id ? 'scale-105 ring-4 ring-blue-400 z-10 shadow-2xl' : ''}`}
                  onDoubleClick={e => { e.stopPropagation(); openModal("row", row, rowIdx); }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white"><Bars3Icon className="w-4 h-4" /></span>
                      Row: {row.name}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                      <button className="p-1 rounded hover:bg-green-200 btn-animated" onClick={() => openModal("row", row, rowIdx)}><PencilIcon className="w-4 h-4" /></button>
                      <button className="p-1 rounded hover:bg-red-200 btn-animated" onClick={() => requestDelete('row', rowIdx, undefined, undefined, row.name)}><TrashIcon className="w-4 h-4" /></button>
                      <button className="p-1 rounded hover:bg-yellow-200 btn-animated" onClick={() => addRack(rowIdx)}><PlusIcon className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={e => handleRacksReorder(rowIdx, e)} onDragStart={e => setDragging({ type: 'rack', id: String(e.active.id) })}>
                    <SortableContext items={row.racks.map(rack => rack.id)} strategy={horizontalListSortingStrategy}>
                      <div className="flex gap-4">
                        {row.racks.length === 0 && <div className="text-gray-400 italic">No racks in this row.</div>}
                        {row.racks.map((rack, rackIdx) => (
                          <div
                            key={rack.id}
                            className={`border border-yellow-400 rounded-md p-3 shadow min-w-[180px] group relative ${entityStyles.rack} ${dragging && dragging.type === 'rack' && dragging.id === rack.id ? 'scale-105 ring-4 ring-green-400 z-10 shadow-2xl' : ''}`}
                            onDoubleClick={e => { e.stopPropagation(); openModal("rack", rack, rowIdx, rackIdx); }}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="font-medium flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow-500 text-white"><Bars3Icon className="w-3 h-3" /></span>
                                Rack: {rack.name}
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                <button className="p-1 rounded hover:bg-yellow-200 btn-animated" onClick={() => openModal("rack", rack, rowIdx, rackIdx)}><PencilIcon className="w-4 h-4" /></button>
                                <button className="p-1 rounded hover:bg-red-200 btn-animated" onClick={() => requestDelete('rack', rowIdx, rackIdx, undefined, rack.name)}><TrashIcon className="w-4 h-4" /></button>
                                <button className="p-1 rounded hover:bg-purple-200 btn-animated" onClick={() => addShelf(rowIdx, rackIdx)}><PlusIcon className="w-4 h-4" /></button>
                              </div>
                            </div>
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={e => handleShelvesReorder(rowIdx, rackIdx, e)} onDragStart={e => setDragging({ type: 'shelf', id: String(e.active.id) })}>
                              <SortableContext items={rack.shelves.map(shelf => shelf.id)} strategy={horizontalListSortingStrategy}>
                                <div className="flex gap-2">
                                  {rack.shelves.length === 0 && <div className="text-gray-400 italic">No shelves in this rack.</div>}
                                  {rack.shelves.map((shelf, shelfIdx) => (
                                    <div
                                      key={shelf.id}
                                      className={`border border-purple-400 rounded p-2 shadow min-w-[100px] text-center cursor-pointer group relative ${entityStyles.shelf} ${dragging && dragging.type === 'shelf' && dragging.id === shelf.id ? 'scale-110 ring-4 ring-purple-400 z-10 shadow-2xl' : ''}`}
                                      onDoubleClick={e => { e.stopPropagation(); openModal("shelf", shelf, rowIdx, rackIdx, shelfIdx); }}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-1"><Bars3Icon className="w-3 h-3 text-purple-500" /> Shelf: {shelf.name}</span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                          <button className="p-1 rounded hover:bg-purple-200 btn-animated" onClick={() => openModal("shelf", shelf, rowIdx, rackIdx, shelfIdx)}><PencilIcon className="w-4 h-4" /></button>
                                          <button className="p-1 rounded hover:bg-red-200 btn-animated" onClick={() => requestDelete('shelf', rowIdx, rackIdx, shelfIdx, shelf.name)}><TrashIcon className="w-4 h-4" /></button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                          </div>
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
      <EntityEditModal
        open={!!modal.type}
        onClose={closeModal}
        entity={modal.entity || { name: '', location: '' }}
        onSave={saveModal}
        title={modal.type ? `Edit ${modal.type.charAt(0).toUpperCase() + modal.type.slice(1)}` : ""}
      />
      {confirmDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="glass animate-pop rounded-lg shadow-lg p-6 min-w-[340px] relative border-2 border-red-400">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              onClick={handleCancelDelete}
              aria-label="Close"
            >
              ×
            </button>
            <div className="flex items-center gap-3 mb-4 p-2 rounded bg-red-100 dark:bg-red-800 text-red-900 dark:text-red-100">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white"><ExclamationTriangleIcon className="w-5 h-5" /></span>
              <h2 className="text-lg font-bold">Confirm Delete</h2>
            </div>
            <hr className="mb-4 border-gray-300 dark:border-gray-700" />
            <div className="mb-6 text-base text-gray-700 dark:text-gray-200">
              Are you sure you want to delete <span className="font-semibold">{confirmDialog.type ? confirmDialog.type.charAt(0).toUpperCase() + confirmDialog.type.slice(1) : ''}</span>
              {typeof confirmDialog.name === 'string' && confirmDialog.name.length > 0 ? <span> <span className="font-mono">{confirmDialog.name}</span></span> : null}?<br />
              <span className="text-red-500 font-semibold">This action cannot be undone.</span>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold"
                onClick={handleCancelDelete}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 font-semibold shadow"
                onClick={handleConfirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
