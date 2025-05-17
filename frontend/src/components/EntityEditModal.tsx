import React, { useState } from "react";
import { Bars3Icon } from '@heroicons/react/24/outline';

interface Shelf { id: string; name: string; }
interface Rack { id: string; name: string; shelves: Shelf[]; }
interface Row { id: string; name: string; racks: Rack[]; }
interface Farm { name: string; location: string; }
type Entity = Farm | Row | Rack | Shelf;

interface EntityEditModalProps {
  open: boolean;
  onClose: () => void;
  entity: Entity;
  onSave: (updated: Entity) => void;
  title: string;
}

export default function EntityEditModal({ open, onClose, entity, onSave, title }: EntityEditModalProps) {
  const [form, setForm] = useState<Entity>(entity);

  React.useEffect(() => {
    setForm(entity);
  }, [entity]);

  if (!open) return null;

  // Determine entity type for color/icon
  let type: 'farm' | 'row' | 'rack' | 'shelf' = 'farm';
  if ('racks' in form) type = 'row';
  else if ('shelves' in form) type = 'rack';
  else if ('id' in form && !('racks' in form) && !('shelves' in form)) type = 'shelf';

  const entityStyles = {
    farm: 'bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100',
    row: 'bg-green-200 dark:bg-green-800 text-green-900 dark:text-green-100',
    rack: 'bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100',
    shelf: 'bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100',
  };
  const iconBg = {
    farm: 'bg-blue-500',
    row: 'bg-green-500',
    rack: 'bg-yellow-500',
    shelf: 'bg-purple-500',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="glass animate-pop rounded-lg shadow-lg p-6 min-w-[340px] relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <div className={`flex items-center gap-3 mb-4 p-2 rounded ${entityStyles[type]}`}>
          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${iconBg[type]} text-white`}><Bars3Icon className="w-5 h-5" /></span>
          <h2 className="text-lg font-bold">{title}</h2>
        </div>
        <hr className="mb-4 border-gray-300 dark:border-gray-700" />
        <div className="flex flex-col gap-3">
          {"id" in form && form.id && (
            <div>
              <label className="text-xs text-gray-500">ID</label>
              <div className="text-sm font-mono bg-gray-100 dark:bg-gray-800 rounded px-2 py-1">{form.id}</div>
            </div>
          )}
          <div>
            <label className="text-xs text-gray-500">Name</label>
            <input
              className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value } as Entity)}
            />
          </div>
          {"location" in form && (
            <div>
              <label className="text-xs text-gray-500">Location</label>
              <input
                className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value } as Entity)}
              />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-8">
          <button
            className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 font-semibold shadow"
            onClick={() => onSave(form)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
