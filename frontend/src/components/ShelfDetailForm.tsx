import React from "react";

interface Shelf { id: string; name: string; }

export default function ShelfDetailForm({ shelf }: { shelf: Shelf }) {
  return (
    <section className="p-6 rounded-lg bg-purple-50 dark:bg-purple-900 shadow flex flex-col gap-4 mb-4">
      <h2 className="text-lg font-bold text-purple-900 dark:text-purple-100 flex items-center gap-2">
        <span role="img" aria-label="Shelf">🧺</span> Shelf: {shelf.name}
      </h2>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col">
          <label className="text-sm text-gray-700 dark:text-gray-200 font-semibold mb-1">Shelf Name</label>
          <input
            className="p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={shelf.name}
            readOnly
            aria-label="Shelf Name"
          />
        </div>
      </div>
    </section>
  );
}
