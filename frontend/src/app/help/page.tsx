"use client";
import { useState } from "react";
import HelpOverlay from "../../components/help/HelpOverlay";

export default function HelpPage() {
  const [showHelp, setShowHelp] = useState(false);
  return (
    <div className="flex-1 p-8 animate-pop max-w-2xl mx-auto">
      <h1 className="text-4xl font-extrabold mb-8 text-green-900 dark:text-green-100 drop-shadow-lg border-b-2 border-green-200 dark:border-green-800 pb-4">Help & Support</h1>
      <p className="mb-6 text-lg text-gray-700 dark:text-gray-300">Need help? Start a guided tour or contact support below.</p>
      <button className="btn-animated bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded font-semibold mb-6" onClick={() => setShowHelp(true)}>
        Start Guided Tour
      </button>
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Contact Support</h2>
        <p>Email: <a href="mailto:support@verticalfarm.com" className="underline text-blue-600">support@verticalfarm.com</a></p>
      </div>
      {showHelp && <HelpOverlay onClose={() => setShowHelp(false)} />}
    </div>
  );
}
