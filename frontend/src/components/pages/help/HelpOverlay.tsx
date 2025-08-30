"use client";
import { useState } from "react";

const helpSteps = [
  {
    title: "Dashboard Overview",
    content:
      "This is your main dashboard. Here you can see quick stats, recent activity, and notifications.",
  },
  {
    title: "Navigation Sidebar",
    content:
      "Use the sidebar to access analytics, data tables, settings, and more.",
  },
  {
    title: "Quick Actions",
    content:
      "Perform common tasks like configuring your layout or adding new rows from the quick actions section.",
  },
  {
    title: "Need More Help?",
    content:
      "Visit the Help page or contact support for more detailed guidance.",
  },
];

export default function HelpOverlay({ onClose }: { onClose?: () => void }) {
  const [step, setStep] = useState(0);
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 max-w-md w-full animate-pop">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-2">
            {helpSteps[step].title}
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {helpSteps[step].content}
          </p>
          <div className="flex gap-2 mb-4">
            {helpSteps.map((_, i) => (
              <div
                key={`step-${i}`}
                className={`h-2 w-8 rounded-full ${i <= step ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"}`}
              ></div>
            ))}
          </div>
        </div>
        <div className="flex justify-between">
          <button
            className="btn-animated px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            Back
          </button>
          {step < helpSteps.length - 1 ? (
            <button
              className="btn-animated px-4 py-2 rounded bg-green-500 hover:bg-green-600 text-white font-semibold"
              onClick={() =>
                setStep((s) => Math.min(helpSteps.length - 1, s + 1))
              }
            >
              Next
            </button>
          ) : (
            <button
              className="btn-animated px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white font-semibold"
              onClick={onClose}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
