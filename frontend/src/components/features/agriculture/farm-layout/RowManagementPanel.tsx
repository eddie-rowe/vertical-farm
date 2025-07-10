import React from "react";
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, KeyboardSensor, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import DraggableItem from "./DraggableItem";

interface Shelf { id: string; name: string; }
interface Rack { id: string; name: string; shelves: Shelf[]; }
interface Row { id: string; name: string; racks: Rack[]; }

export default function RowManagementPanel({ rows, onRowsReorder }: { rows: Row[]; onRowsReorder?: (newRows: Row[]) => void }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [items, setItems] = React.useState<string[]>(rows.map((row) => row.id));

  React.useEffect(() => {
    setItems(rows.map((row) => row.id));
  }, [rows]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && String(active.id) !== String(over.id)) {
      const oldIndex = items.indexOf(String(active.id));
      const newIndex = items.indexOf(String(over.id));
      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
      if (onRowsReorder) {
        const newRows = newItems.map((id) => rows.find((row) => row.id === id) as Row);
        onRowsReorder(newRows);
      }
    }
  }

  return (
    <section className="p-6 rounded-lg bg-blue-50 dark:bg-blue-900 shadow flex flex-col gap-4 mb-4">
      <h2 className="text-lg font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
        <span role="img" aria-label="Row">🪴</span> Rows
      </h2>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="flex gap-4">
            {items.map((id: string) => {
              const row = rows.find((r) => r.id === id);
              return row ? <DraggableItem key={row.id} id={row.id} label={row.name} type="row" /> : null;
            })}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}
