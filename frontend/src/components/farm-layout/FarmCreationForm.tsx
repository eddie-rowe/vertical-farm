import React from "react";

export default function FarmCreationForm({ farm }: { farm: { name: string; location: string } }) {
  return (
    <section className="p-6 rounded-lg bg-green-50 dark:bg-green-900 shadow flex flex-col gap-4 mb-4">
      <h2 className="text-lg font-bold text-green-900 dark:text-green-100 flex items-center gap-2">
        <span role="img" aria-label="Farm">🌱</span> Farm Details
      </h2>
      <div className="flex gap-4">
        <div className="flex flex-col">
          <label className="text-sm text-gray-700 dark:text-gray-200 font-semibold mb-1">Farm Name</label>
          <input
            className="p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-400"
            value={farm.name}
            readOnly
            aria-label="Farm Name"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-700 dark:text-gray-200 font-semibold mb-1">Location</label>
          <input
            className="p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-400"
            value={farm.location}
            readOnly
            aria-label="Farm Location"
          />
        </div>
      </div>
    </section>
  );
}
