"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";

// Dynamic imports for Chart.js components to remove from vendor bundle
const Bar = dynamic(
  () => import("react-chartjs-2").then((mod) => ({ default: mod.Bar })),
  {
    loading: () => (
      <div className="h-64 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    ),
    ssr: false,
  },
);

const Line = dynamic(
  () => import("react-chartjs-2").then((mod) => ({ default: mod.Line })),
  {
    loading: () => (
      <div className="h-64 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    ),
    ssr: false,
  },
);

const Doughnut = dynamic(
  () => import("react-chartjs-2").then((mod) => ({ default: mod.Doughnut })),
  {
    loading: () => (
      <div className="h-64 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    ),
    ssr: false,
  },
);

// Chart.js registration - also dynamically imported
const ChartRegistration = dynamic(() => import("./ChartRegistration"), {
  ssr: false,
});

interface DynamicChartProps {
  type: "bar" | "line" | "doughnut";
  data: any;
  options?: any;
  className?: string;
}

const DynamicChart: React.FC<DynamicChartProps> = ({
  type,
  data,
  options,
  className,
}) => {
  const ChartComponent = React.useMemo(() => {
    switch (type) {
      case "bar":
        return Bar;
      case "line":
        return Line;
      case "doughnut":
        return Doughnut;
      default:
        return Bar;
    }
  }, [type]);

  return (
    <div className={className}>
      <ChartRegistration />
      <Suspense
        fallback={
          <div className="h-64 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        }
      >
        <ChartComponent data={data} options={options} />
      </Suspense>
    </div>
  );
};

export default DynamicChart;
