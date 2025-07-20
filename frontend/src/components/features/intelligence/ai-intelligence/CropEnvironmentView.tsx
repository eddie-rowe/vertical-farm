"use client";

import React, { useState } from "react";
import { FaChartLine, FaThermometerHalf, FaTint, FaWind } from "react-icons/fa";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function CropEnvironmentView() {
  const [selectedTimeframe, setSelectedTimeframe] = useState("24h");

  // Mock data for demonstration
  const environmentalData = [
    {
      id: 1,
      location: "Row 1, Rack A",
      temperature: 22.5,
      humidity: 65,
      airflow: "Normal",
      status: "optimal",
      trend: "stable",
    },
    {
      id: 2,
      location: "Row 2, Rack B",
      temperature: 24.1,
      humidity: 58,
      airflow: "Low",
      status: "warning",
      trend: "increasing",
    },
    {
      id: 3,
      location: "Row 3, Rack C",
      temperature: 21.8,
      humidity: 72,
      airflow: "High",
      status: "optimal",
      trend: "decreasing",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "optimal":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "critical":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing":
        return "↗️";
      case "decreasing":
        return "↘️";
      case "stable":
        return "➡️";
      default:
        return "➡️";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-content">
            Crop Environment Monitoring
          </h2>
          <p className="text-content-secondary">
            Real-time environmental conditions across your growing areas
          </p>
        </div>
        <div className="flex gap-2">
          {["1h", "6h", "24h", "7d"].map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                selectedTimeframe === timeframe
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              {timeframe}
            </button>
          ))}
        </div>
      </div>

      {/* Environmental Data Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {environmentalData.map((data) => (
          <Card key={data.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-content">
                    {data.location}
                  </h3>
                  <Badge className={getStatusColor(data.status)}>
                    {data.status}
                  </Badge>
                </div>
                <div className="text-2xl">{getTrendIcon(data.trend)}</div>
              </div>

              <div className="space-y-4">
                {/* Temperature */}
                <div className="flex items-center gap-3">
                  <FaThermometerHalf className="text-red-500 text-xl" />
                  <div>
                    <div className="text-2xl font-bold text-content">
                      {data.temperature}°C
                    </div>
                    <div className="text-sm text-content-secondary">
                      Temperature
                    </div>
                  </div>
                </div>

                {/* Humidity */}
                <div className="flex items-center gap-3">
                  <FaTint className="text-blue-500 text-xl" />
                  <div>
                    <div className="text-2xl font-bold text-content">
                      {data.humidity}%
                    </div>
                    <div className="text-sm text-content-secondary">
                      Humidity
                    </div>
                  </div>
                </div>

                {/* Airflow */}
                <div className="flex items-center gap-3">
                  <FaWind className="text-green-500 text-xl" />
                  <div>
                    <div className="text-lg font-semibold text-content">
                      {data.airflow}
                    </div>
                    <div className="text-sm text-content-secondary">
                      Airflow
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart placeholder */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-sm text-content-secondary">
                  <FaChartLine />
                  <span>View detailed trends</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <FaThermometerHalf className="text-green-600 text-xl" />
              </div>
              <div>
                <div className="text-2xl font-bold text-content">22.8°C</div>
                <div className="text-sm text-content-secondary">
                  Average Temperature
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FaTint className="text-blue-600 text-xl" />
              </div>
              <div>
                <div className="text-2xl font-bold text-content">65%</div>
                <div className="text-sm text-content-secondary">
                  Average Humidity
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <FaWind className="text-green-600 text-xl" />
              </div>
              <div>
                <div className="text-2xl font-bold text-content">Normal</div>
                <div className="text-sm text-content-secondary">
                  Airflow Status
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
