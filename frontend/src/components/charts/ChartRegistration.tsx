'use client';

import { useEffect } from 'react';

const ChartRegistration = () => {
  useEffect(() => {
    // Dynamic import and registration of Chart.js components
    const registerChartJS = async () => {
      const { Chart, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend } = await import('chart.js');
      
      Chart.register(
        CategoryScale,
        LinearScale,
        BarElement,
        PointElement,
        LineElement,
        ArcElement,
        Tooltip,
        Legend
      );
    };

    registerChartJS();
  }, []);

  return null; // This component doesn't render anything
};

export default ChartRegistration; 