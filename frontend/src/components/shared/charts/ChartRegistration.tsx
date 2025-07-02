'use client';

import { useEffect } from 'react';

const ChartRegistration = () => {
  useEffect(() => {
    // Dynamic import and registration of Chart.js components
    const registerChartJS = async () => {
      const { 
        Chart, 
        CategoryScale, 
        LinearScale, 
        TimeScale,
        BarElement, 
        PointElement, 
        LineElement, 
        ArcElement,
        Filler,
        Title,
        Tooltip, 
        Legend 
      } = await import('chart.js');

      // Import time scale adapter for time-based charts
      const { _adapters } = await import('chart.js/auto');
      
      Chart.register(
        CategoryScale,
        LinearScale,
        TimeScale,
        BarElement,
        PointElement,
        LineElement,
        ArcElement,
        Filler,
        Title,
        Tooltip,
        Legend
      );
    };

    registerChartJS();
  }, []);

  return null; // This component doesn't render anything
};

export default ChartRegistration; 