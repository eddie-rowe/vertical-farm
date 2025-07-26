"use client";

import { Calendar, Download, TrendingUp, Award, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HistoricalGrow {
  id: string;
  shelf_name: string;
  farm_name: string;
  recipe_name: string;
  species_name: string;
  start_date: string;
  end_date: string;
  status: "completed" | "aborted";
  yield_kg?: number;
  duration_days: number;
  target_duration_days: number;
  notes?: string;
}

interface GrowHistoryViewProps {
  searchTerm: string;
}

export default function GrowHistoryView({ searchTerm }: GrowHistoryViewProps) {
  const [historicalGrows, setHistoricalGrows] = useState<HistoricalGrow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("all");
  const [sortBy, setSortBy] = useState("end_date");

  // Mock data for demonstration
  useEffect(() => {
    const mockHistory: HistoricalGrow[] = [
      {
        id: "hist-1",
        shelf_name: "Shelf A1-1-1",
        farm_name: "Greenhouse A",
        recipe_name: "Quick Lettuce",
        species_name: "Lettuce",
        start_date: "2023-12-01",
        end_date: "2024-01-05",
        status: "completed",
        yield_kg: 2.3,
        duration_days: 35,
        target_duration_days: 35,
        notes: "Excellent harvest - exceeded yield expectations",
      },
      {
        id: "hist-2",
        shelf_name: "Shelf A1-1-2",
        farm_name: "Greenhouse A",
        recipe_name: "Premium Basil",
        species_name: "Basil",
        start_date: "2023-11-15",
        end_date: "2024-01-08",
        status: "completed",
        yield_kg: 1.8,
        duration_days: 54,
        target_duration_days: 49,
        notes: "Good quality, slightly longer than expected",
      },
      {
        id: "hist-3",
        shelf_name: "Shelf B1-1-1",
        farm_name: "Greenhouse A",
        recipe_name: "Quick Lettuce",
        species_name: "Lettuce",
        start_date: "2023-11-01",
        end_date: "2023-12-10",
        status: "aborted",
        duration_days: 39,
        target_duration_days: 35,
        notes: "Pest infestation - had to abort",
      },
    ];

    setHistoricalGrows(mockHistory);
    setIsLoading(false);
  }, []);

  const filteredGrows = historicalGrows.filter((grow) => {
    const matchesSearch =
      !searchTerm ||
      grow.species_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grow.recipe_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grow.shelf_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grow.farm_name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const sortedGrows = [...filteredGrows].sort((a, b) => {
    switch (sortBy) {
      case "yield":
        return (b.yield_kg || 0) - (a.yield_kg || 0);
      case "duration":
        return b.duration_days - a.duration_days;
      case "species":
        return a.species_name.localeCompare(b.species_name);
      default: // end_date
        return new Date(b.end_date).getTime() - new Date(a.end_date).getTime();
    }
  });

  // Analytics calculations
  const totalGrows = filteredGrows.length;
  const completedGrows = filteredGrows.filter((g) => g.status === "completed");
  const totalYield = completedGrows.reduce(
    (sum, grow) => sum + (grow.yield_kg || 0),
    0,
  );
  const averageYield =
    completedGrows.length > 0 ? totalYield / completedGrows.length : 0;
  const successRate =
    totalGrows > 0 ? (completedGrows.length / totalGrows) * 100 : 0;

  const exportData = () => {
    const csvContent = [
      "Shelf,Farm,Recipe,Species,Start Date,End Date,Status,Yield (kg),Duration (days),Target Duration,Notes",
      ...sortedGrows.map(
        (grow) =>
          `${grow.shelf_name},${grow.farm_name},${grow.recipe_name},${grow.species_name},${grow.start_date},${grow.end_date},${grow.status},${grow.yield_kg || ""},${grow.duration_days},${grow.target_duration_days},"${grow.notes || ""}"`,
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "grow-history.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading grow history...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Grows
                </p>
                <p className="text-2xl font-bold">{totalGrows}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Yield
                </p>
                <p className="text-2xl font-bold">{totalYield.toFixed(1)} kg</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg Yield
                </p>
                <p className="text-2xl font-bold">
                  {averageYield.toFixed(1)} kg
                </p>
              </div>
              <Award className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Success Rate
                </p>
                <p className="text-2xl font-bold">{successRate.toFixed(0)}%</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="year">Last year</SelectItem>
                  <SelectItem value="6months">Last 6 months</SelectItem>
                  <SelectItem value="3months">Last 3 months</SelectItem>
                  <SelectItem value="month">Last month</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="end_date">End Date</SelectItem>
                  <SelectItem value="yield">Yield</SelectItem>
                  <SelectItem value="duration">Duration</SelectItem>
                  <SelectItem value="species">Species</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={exportData}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Historical Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Grow History</CardTitle>
          <CardDescription>
            Historical data from completed and aborted grows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Location</th>
                  <th className="text-left p-2 font-medium">Species</th>
                  <th className="text-left p-2 font-medium">Recipe</th>
                  <th className="text-left p-2 font-medium">Duration</th>
                  <th className="text-left p-2 font-medium">Yield</th>
                  <th className="text-left p-2 font-medium">Status</th>
                  <th className="text-left p-2 font-medium">End Date</th>
                </tr>
              </thead>
              <tbody>
                {sortedGrows.map((grow) => (
                  <tr
                    key={grow.id}
                    className="border-b hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{grow.shelf_name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {grow.farm_name}
                        </div>
                      </div>
                    </td>
                    <td className="p-2">{grow.species_name}</td>
                    <td className="p-2">{grow.recipe_name}</td>
                    <td className="p-2">
                      <div>
                        <div>{grow.duration_days} days</div>
                        {grow.duration_days !== grow.target_duration_days && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Target: {grow.target_duration_days} days
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      {grow.yield_kg ? `${grow.yield_kg} kg` : "-"}
                    </td>
                    <td className="p-2">
                      <Badge
                        className={
                          grow.status === "completed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }
                      >
                        {grow.status}
                      </Badge>
                    </td>
                    <td className="p-2">
                      {new Date(grow.end_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {sortedGrows.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No historical grows found matching your criteria.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
