import React from "react";
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, KeyboardSensor, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import DraggableItem from "./DraggableItem";

interface Shelf { id: string; name: string; }
interface Rack { id: string; name: string; shelves: Shelf[]; }

export default function RackConfigurationForm({ rack, onShelvesReorder }: { rack: Rack; onShelvesReorder?: (newShelves: Shelf[]) => void }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [items, setItems] = React.useState<string[]>(rack.shelves.map((shelf) => shelf.id));

  React.useEffect(() => {
    setItems(rack.shelves.map((shelf) => shelf.id));
  }, [rack.shelves]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && String(active.id) !== String(over.id)) {
      const oldIndex = items.indexOf(String(active.id));
      const newIndex = items.indexOf(String(over.id));
      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
      if (onShelvesReorder) {
        const newShelves = newItems.map((id) => rack.shelves.find((shelf) => shelf.id === id) as Shelf);
        onShelvesReorder(newShelves);
      }
    }
  }

  return (
    <section className="p-6 rounded-lg bg-yellow-50 dark:bg-yellow-900 shadow flex flex-col gap-4 mb-4">
      <h2 className="text-lg font-bold text-yellow-900 dark:text-yellow-100 flex items-center gap-2">
        <span role="img" aria-label="Rack">🗄️</span> Rack: {rack.name}
      </h2>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items} strategy={horizontalListSortingStrategy}>
          <div className="flex gap-4">
            {items.map((id: string) => {
              const shelf = rack.shelves.find((s) => s.id === id);
              return shelf ? <DraggableItem key={shelf.id} id={shelf.id} label={shelf.name} type="shelf" /> : null;
            })}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}
