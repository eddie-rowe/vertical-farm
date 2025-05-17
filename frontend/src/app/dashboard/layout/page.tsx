"use client";
import FarmLayoutConfigurator from '../../../components/FarmLayoutConfigurator';

export default function LayoutPage() {
  return (
    <main className="min-h-screen p-8 bg-white dark:bg-gray-950 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Farm Layout Configuration</h1>
      <FarmLayoutConfigurator />
    </main>
  );
}
