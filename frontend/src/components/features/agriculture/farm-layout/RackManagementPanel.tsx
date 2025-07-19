import React from "react";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import DraggableItem from "./DraggableItem";

interface Shelf {
  id: string;
  name: string;
}
interface Rack {
  id: string;
  name: string;
  shelves: Shelf[];
}

type RackManagementPanelProps = {
  racks: Rack[];
  onRacksReorder?: (newRacks: Rack[]) => void;
  key?: React.Key;
};

export default function RackManagementPanel({
  racks,
  onRacksReorder,
}: RackManagementPanelProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const [items, setItems] = React.useState<string[]>(
    racks.map((rack) => rack.id),
  );

  React.useEffect(() => {
    setItems(racks.map((rack) => rack.id));
  }, [racks]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && String(active.id) !== String(over.id)) {
      const oldIndex = items.indexOf(String(active.id));
      const newIndex = items.indexOf(String(over.id));
      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
      if (onRacksReorder) {
        const newRacks = newItems.map(
          (id) => racks.find((rack) => rack.id === id) as Rack,
        );
        onRacksReorder(newRacks);
      }
    }
  }

  return (
    <section className="p-4 rounded-lg bg-green-50 dark:bg-green-900 shadow flex flex-col gap-4 mb-4">
      <h3 className="text-md font-bold text-green-900 dark:text-green-100 flex items-center gap-2">
        <span role="img" aria-label="Rack">
          🗄️
        </span>{" "}
        Racks
      </h3>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="flex gap-4">
            {items.map((id: string) => {
              const rack = racks.find((r) => r.id === id);
              return rack ? (
                <DraggableItem
                  key={rack.id}
                  id={rack.id}
                  label={rack.name}
                  type="rack"
                />
              ) : null;
            })}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}
