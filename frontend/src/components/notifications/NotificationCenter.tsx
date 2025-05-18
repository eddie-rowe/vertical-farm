"use client";
import { useState } from "react";

const mockNotifications = [
  { id: 1, message: "Low moisture detected in Row 1", type: "alert", time: "2m ago" },
  { id: 2, message: "Harvest ready in Rack 2", type: "info", time: "1h ago" },
  { id: 3, message: "Sensor 3 battery low", type: "warning", time: "3h ago" },
];

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        className="btn-animated p-2 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open notifications"
      >
        <span className="text-xl">🔔</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-lg shadow-lg z-50 p-4 animate-pop">
          <h3 className="text-lg font-bold mb-2">Notifications</h3>
          <ul className="space-y-2">
            {mockNotifications.map((n) => (
              <li key={n.id} className={`p-2 rounded ${n.type === "alert" ? "bg-red-100 dark:bg-red-900" : n.type === "warning" ? "bg-yellow-100 dark:bg-yellow-900" : "bg-blue-100 dark:bg-blue-900"}`}>
                <div className="font-medium">{n.message}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{n.time}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
