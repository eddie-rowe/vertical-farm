"use client";

import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  TimeScale,
  Tooltip,
  Legend,
  Filler,
  Title,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  TimeScale,
  Tooltip,
  Legend,
  Filler,
  Title,
);

// Configure better defaults for our charts
ChartJS.defaults.font.family = "Inter, system-ui, sans-serif";
ChartJS.defaults.color = "#6b7280"; // gray-500 for better readability

// React component that handles Chart.js registration
const ChartRegistration: React.FC = () => {
  // This component doesn't render anything, it just ensures Chart.js is registered
  return null;
};

export default ChartRegistration;
export { ChartJS };
