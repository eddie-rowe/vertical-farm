import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function DraggableItem({ id, label, type }: { id: string; label: string; type: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    boxShadow: isDragging ? "0 4px 16px rgba(0,0,0,0.15)" : undefined,
    opacity: isDragging ? 0.7 : 1,
    minWidth: 100,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 px-4 py-2 rounded shadow cursor-grab bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 transition select-none ${isDragging ? "ring-2 ring-blue-400" : ""}`}
      aria-label={`Draggable ${type}: ${label}`}
      {...attributes}
      {...listeners}
    >
      <span className="text-xl" aria-hidden>
        {type === "row" && "🪴"}
        {type === "rack" && "🗄️"}
        {type === "shelf" && "🧺"}
      </span>
      <span className="font-semibold text-gray-900 dark:text-gray-100">{label}</span>
      <span className="ml-auto text-xs text-gray-400 dark:text-gray-500" aria-label="Grab handle">⠿</span>
    </div>
  );
}
