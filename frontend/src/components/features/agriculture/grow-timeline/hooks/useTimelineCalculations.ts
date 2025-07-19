import { useMemo } from "react";
import { GrowTimelineItem, TimelinePosition } from "../types";

interface UseTimelineCalculationsProps {
  grows: GrowTimelineItem[];
  zoomLevel: number;
  timeRange: number; // days
  currentDate: Date;
}

export const useTimelineCalculations = ({
  grows,
  zoomLevel,
  timeRange,
  currentDate,
}: UseTimelineCalculationsProps) => {
  const timelineData = useMemo(() => {
    if (grows.length === 0)
      return {
        positions: new Map(),
        timelineStart: currentDate,
        timelineEnd: currentDate,
      };

    // Calculate timeline bounds
    const startDates = grows.map((grow) => new Date(grow.startDate));
    const endDates = grows.map((grow) => new Date(grow.endDate));

    const earliestStart = new Date(
      Math.min(...startDates.map((d) => d.getTime())),
    );
    const latestEnd = new Date(Math.max(...endDates.map((d) => d.getTime())));

    // Extend timeline bounds based on zoom and time range
    const timelineStart = new Date(earliestStart);
    timelineStart.setDate(timelineStart.getDate() - timeRange * 0.1); // 10% padding

    const timelineEnd = new Date(latestEnd);
    timelineEnd.setDate(timelineEnd.getDate() + timeRange * 0.1); // 10% padding

    const totalTimelineMs = timelineEnd.getTime() - timelineStart.getTime();

    // Calculate positions for each grow
    const positions = new Map<string, TimelinePosition>();

    grows.forEach((grow) => {
      const startDate = new Date(grow.startDate);
      const endDate = new Date(grow.endDate);

      const startMs = startDate.getTime() - timelineStart.getTime();
      const durationMs = endDate.getTime() - startDate.getTime();

      const leftPercent = (startMs / totalTimelineMs) * 100;
      const widthPercent = (durationMs / totalTimelineMs) * 100;

      positions.set(grow.id, {
        left: `${Math.max(0, leftPercent)}%`,
        width: `${Math.max(1, widthPercent)}%`,
      });
    });

    return { positions, timelineStart, timelineEnd };
  }, [grows, zoomLevel, timeRange, currentDate]);

  const getCurrentTimePosition = useMemo(() => {
    const { timelineStart, timelineEnd } = timelineData;
    const totalTimelineMs = timelineEnd.getTime() - timelineStart.getTime();
    const currentMs = currentDate.getTime() - timelineStart.getTime();
    const currentPercent = (currentMs / totalTimelineMs) * 100;

    return Math.max(0, Math.min(100, currentPercent));
  }, [timelineData, currentDate]);

  const getTimeAtPosition = useMemo(() => {
    return (positionPercent: number): Date => {
      const { timelineStart, timelineEnd } = timelineData;
      const totalTimelineMs = timelineEnd.getTime() - timelineStart.getTime();
      const targetMs = (positionPercent / 100) * totalTimelineMs;

      return new Date(timelineStart.getTime() + targetMs);
    };
  }, [timelineData]);

  const getPositionAtTime = useMemo(() => {
    return (date: Date): number => {
      const { timelineStart, timelineEnd } = timelineData;
      const totalTimelineMs = timelineEnd.getTime() - timelineStart.getTime();
      const targetMs = date.getTime() - timelineStart.getTime();

      return Math.max(0, Math.min(100, (targetMs / totalTimelineMs) * 100));
    };
  }, [timelineData]);

  const generateTimeMarkers = useMemo(() => {
    const { timelineStart, timelineEnd } = timelineData;
    const totalDays = Math.ceil(
      (timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24),
    );

    const markers: Array<{ date: Date; position: number; label: string }> = [];

    // Determine marker interval based on zoom level
    let intervalDays = 7; // Default to weekly
    if (zoomLevel >= 4)
      intervalDays = 1; // Daily for high zoom
    else if (zoomLevel >= 2)
      intervalDays = 3; // Every 3 days for medium zoom
    else if (zoomLevel < 1) intervalDays = 14; // Bi-weekly for low zoom

    for (let i = 0; i <= totalDays; i += intervalDays) {
      const markerDate = new Date(timelineStart);
      markerDate.setDate(markerDate.getDate() + i);

      const position = getPositionAtTime(markerDate);
      const label = markerDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        ...(intervalDays >= 7 ? { year: "2-digit" } : {}),
      });

      markers.push({ date: markerDate, position, label });
    }

    return markers;
  }, [timelineData, zoomLevel, getPositionAtTime]);

  return {
    ...timelineData,
    getCurrentTimePosition,
    getTimeAtPosition,
    getPositionAtTime,
    generateTimeMarkers,
  };
};
