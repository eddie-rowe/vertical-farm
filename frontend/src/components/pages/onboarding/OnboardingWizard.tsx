"use client";
import { useState } from "react";

const steps = [
  {
    title: "Welcome to Vertical Farm Manager!",
    description: "Let's get your farm set up in a few easy steps.",
  },
  {
    title: "Configure Your Layout",
    description: "Add rows, racks, and shelves to match your real farm.",
  },
  {
    title: "Connect Sensors",
    description: "Link your IoT sensors for real-time monitoring.",
  },
  {
    title: "Invite Team Members",
    description: "Collaborate by inviting your team to the platform.",
  },
  {
    title: "You're Ready!",
    description: "Start managing your vertical farm efficiently.",
  },
];

export default function OnboardingWizard({
  onFinish,
}: {
  onFinish?: () => void;
}) {
  const [step, setStep] = useState(0);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 max-w-md w-full animate-pop">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🌱</span>
            <h2 className="text-2xl font-bold text-green-900 dark:text-green-100">
              {steps[step].title}
            </h2>
          </div>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {steps[step].description}
          </p>
          <div className="flex gap-2 mb-4">
            {steps.map((_, i) => (
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
          {step < steps.length - 1 ? (
            <button
              className="btn-animated px-4 py-2 rounded bg-green-500 hover:bg-green-600 text-white font-semibold"
              onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
            >
              Next
            </button>
          ) : (
            <button
              className="btn-animated px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white font-semibold"
              onClick={onFinish}
            >
              Finish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
