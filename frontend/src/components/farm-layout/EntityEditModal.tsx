import React, { useState } from "react";
import { Bars3Icon } from '@heroicons/react/24/outline';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle asChild>
            <div className={`flex items-center gap-3 p-2 rounded ${entityStyles[type]}`}>
              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${iconBg[type]} text-white`}><Bars3Icon className="w-5 h-5" /></span>
              <h2 className="text-lg font-bold">{title}</h2>
            </div>
          </DialogTitle>
        </DialogHeader>
        <hr className="my-4 border-gray-300 dark:border-gray-700" />
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
        <DialogFooter className="mt-8">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(form)}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
