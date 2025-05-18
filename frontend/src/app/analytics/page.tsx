"use client";
import { useState } from "react";
import { Bar, Line, Pie } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend } from "chart.js";

Chart.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend);

const chartData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  datasets: [
    {
      label: "Yield (kg)",
      data: [120, 150, 170, 140, 180, 200],
      backgroundColor: "rgba(34,197,94,0.7)",
      borderColor: "rgba(34,197,94,1)",
      borderWidth: 2,
    },
  ],
};

const lineData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  datasets: [
    {
      label: "Moisture (%)",
      data: [60, 65, 70, 68, 72, 75],
      fill: false,
      borderColor: "rgba(59,130,246,1)",
      backgroundColor: "rgba(59,130,246,0.2)",
      tension: 0.4,
    },
  ],
};

const pieData = {
  labels: ["Lettuce", "Basil", "Kale"],
  datasets: [
    {
      label: "Crop Distribution",
      data: [40, 30, 30],
      backgroundColor: [
        "rgba(34,197,94,0.7)",
        "rgba(59,130,246,0.7)",
        "rgba(168,85,247,0.7)",
      ],
      borderColor: [
        "rgba(34,197,94,1)",
        "rgba(59,130,246,1)",
        "rgba(168,85,247,1)",
      ],
      borderWidth: 2,
    },
  ],
};

export default function AnalyticsPage() {
  const [range, setRange] = useState("6m");
  return (
    <div className="flex-1 p-8 animate-pop">
      <h1 className="text-4xl font-extrabold mb-8 text-green-900 dark:text-green-100 drop-shadow-lg border-b-2 border-green-200 dark:border-green-800 pb-4">Analytics Dashboard</h1>
      <div className="flex gap-4 mb-8">
        <label className="font-medium">Time Range:</label>
        <select value={range} onChange={e => setRange(e.target.value)} className="border rounded px-3 py-1">
          <option value="1m">1 Month</option>
          <option value="3m">3 Months</option>
          <option value="6m">6 Months</option>
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Yield (Bar Chart)</h2>
          <Bar data={chartData} />
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Moisture (Line Chart)</h2>
          <Line data={lineData} />
        </div>
      </div>
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-4">Crop Distribution (Pie Chart)</h2>
        <Pie data={pieData} />
      </div>
    </div>
  );
}
