"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";

interface Farm {
  id: string;
  name: string;
  location: string;
  rows?: Row[];
}

interface Row {
  id: string;
  name: string;
  farm_id: string;
  racks?: Rack[];
}

interface Rack {
  id: string;
  name: string;
  row_id: string;
  shelves?: Shelf[];
}

interface Shelf {
  id: string;
  name: string;
  rack_id: string;
  width: number;
  depth: number;
  max_weight?: number;
}

interface Species {
  id: string;
  name: string;
  description?: string;
}

interface GrowRecipe {
  id: string;
  name: string;
  species_id: string;
  species?: Species;
  grow_days?: number;
  light_hours_per_day?: number;
  germination_days?: number;
  total_grow_days?: number;
}

export default function NewGrowSetup() {
  const [selectedFarm, setSelectedFarm] = useState<string>("");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectedRacks, setSelectedRacks] = useState<Set<string>>(new Set());
  const [selectedShelves, setSelectedShelves] = useState<Set<string>>(new Set());
  const [selectedRecipe, setSelectedRecipe] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [farms, setFarms] = useState<Farm[]>([]);
  const [species, setSpecies] = useState<Species[]>([]);
  const [growRecipes, setGrowRecipes] = useState<GrowRecipe[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for demonstration - replace with actual API calls
  useEffect(() => {
    // Mock farms data
    setFarms([
      {
        id: "farm-1",
        name: "Greenhouse A",
        location: "North Wing",
        rows: [
          {
            id: "row-1",
            name: "Row A1",
            farm_id: "farm-1",
            racks: [
              {
                id: "rack-1",
                name: "Rack A1-1",
                row_id: "row-1",
                shelves: [
                  { id: "shelf-1", name: "Shelf A1-1-1", rack_id: "rack-1", width: 2, depth: 1 },
                  { id: "shelf-2", name: "Shelf A1-1-2", rack_id: "rack-1", width: 2, depth: 1 },
                ]
              }
            ]
          }
        ]
      }
    ]);

    // Mock species data
    setSpecies([
      { id: "species-1", name: "Lettuce", description: "Buttercrunch lettuce variety" },
      { id: "species-2", name: "Basil", description: "Genovese basil" },
      { id: "species-3", name: "Spinach", description: "Baby leaf spinach" },
    ]);

    // Mock grow recipes
    setGrowRecipes([
      {
        id: "recipe-1",
        name: "Quick Lettuce",
        species_id: "species-1",
        grow_days: 28,
        light_hours_per_day: 14,
        germination_days: 3,
        total_grow_days: 35,
      },
      {
        id: "recipe-2",
        name: "Premium Basil",
        species_id: "species-2",
        grow_days: 42,
        light_hours_per_day: 16,
        germination_days: 5,
        total_grow_days: 49,
      },
    ]);
  }, []);

  const selectedFarmData = farms.find(f => f.id === selectedFarm);
  const selectedRecipeData = growRecipes.find(r => r.id === selectedRecipe);
  const selectedSpeciesData = selectedRecipeData ? species.find(s => s.id === selectedRecipeData.species_id) : null;

  const handleToggleRow = (rowId: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowId)) {
      newSelected.delete(rowId);
      // Also remove all racks and shelves in this row
      const row = selectedFarmData?.rows?.find(r => r.id === rowId);
      row?.racks?.forEach(rack => {
        selectedRacks.delete(rack.id);
        rack.shelves?.forEach(shelf => selectedShelves.delete(shelf.id));
      });
    } else {
      newSelected.add(rowId);
    }
    setSelectedRows(newSelected);
  };

  const handleToggleRack = (rackId: string) => {
    const newSelected = new Set(selectedRacks);
    if (newSelected.has(rackId)) {
      newSelected.delete(rackId);
      // Also remove all shelves in this rack
      const rack = selectedFarmData?.rows?.flatMap(r => r.racks || []).find(r => r.id === rackId);
      rack?.shelves?.forEach(shelf => selectedShelves.delete(shelf.id));
    } else {
      newSelected.add(rackId);
    }
    setSelectedRacks(newSelected);
  };

  const handleToggleShelf = (shelfId: string) => {
    const newSelected = new Set(selectedShelves);
    if (newSelected.has(shelfId)) {
      newSelected.delete(shelfId);
    } else {
      newSelected.add(shelfId);
    }
    setSelectedShelves(newSelected);
  };

  const handleStartGrow = async () => {
    if (!selectedRecipe || selectedShelves.size === 0) {
      alert("Please select a recipe and at least one shelf");
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement API call to create schedules for selected shelves
      console.log("Starting grows:", {
        recipe: selectedRecipeData,
        shelves: Array.from(selectedShelves),
        startDate,
      });
      
      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert(`Successfully started ${selectedShelves.size} grows!`);
      
      // Reset form
      setSelectedShelves(new Set());
      setSelectedRacks(new Set());
      setSelectedRows(new Set());
      setSelectedRecipe("");
    } catch (error) {
      console.error("Error starting grows:", error);
      alert("Failed to start grows. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Start New Grow
          </CardTitle>
          <CardDescription>
            Select locations and assign grow recipes to start new cultivation cycles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Farm and Recipe Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="farm-select">Farm</Label>
              <Select value={selectedFarm} onValueChange={setSelectedFarm}>
                <SelectTrigger id="farm-select">
                  <SelectValue placeholder="Select farm" />
                </SelectTrigger>
                <SelectContent>
                  {farms.map(farm => (
                    <SelectItem key={farm.id} value={farm.id}>
                      {farm.name} - {farm.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="recipe-select">Grow Recipe</Label>
              <Select value={selectedRecipe} onValueChange={setSelectedRecipe}>
                <SelectTrigger id="recipe-select">
                  <SelectValue placeholder="Select grow recipe" />
                </SelectTrigger>
                                 <SelectContent>
                   {growRecipes.map(recipe => {
                     const recipeSpecies = species.find(s => s.id === recipe.species_id);
                     return (
                       <SelectItem key={recipe.id} value={recipe.id}>
                         {recipe.name} ({recipeSpecies?.name}) - {recipe.total_grow_days || recipe.grow_days}d
                       </SelectItem>
                     );
                   })}
                 </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>

          {/* Recipe Details */}
          {selectedRecipeData && selectedSpeciesData && (
            <Card className="bg-green-50 dark:bg-green-950">
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Species:</span> {selectedSpeciesData.name}
                  </div>
                  <div>
                    <span className="font-medium">Total Days:</span> {selectedRecipeData.total_grow_days || selectedRecipeData.grow_days}
                  </div>
                  <div>
                    <span className="font-medium">Light Hours:</span> {selectedRecipeData.light_hours_per_day}/day
                  </div>
                  <div>
                    <span className="font-medium">Germination:</span> {selectedRecipeData.germination_days} days
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Location Selection */}
          {selectedFarmData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Growing Locations</CardTitle>
                <CardDescription>
                  Choose rows, racks, or individual shelves for this grow
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedFarmData.rows?.map(row => (
                    <Card key={row.id} className="bg-gray-50 dark:bg-gray-900">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Checkbox
                            checked={selectedRows.has(row.id)}
                            onCheckedChange={() => handleToggleRow(row.id)}
                          />
                          <h4 className="font-medium">{row.name}</h4>
                          <Badge variant="outline">{row.racks?.length || 0} racks</Badge>
                        </div>
                        
                        <div className="ml-6 space-y-3">
                          {row.racks?.map(rack => (
                            <div key={rack.id} className="space-y-2">
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={selectedRacks.has(rack.id)}
                                  onCheckedChange={() => handleToggleRack(rack.id)}
                                />
                                <span className="font-medium text-sm">{rack.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {rack.shelves?.length || 0} shelves
                                </Badge>
                              </div>
                              
                              <div className="ml-6 grid grid-cols-2 md:grid-cols-4 gap-2">
                                {rack.shelves?.map(shelf => (
                                  <div key={shelf.id} className="flex items-center gap-2 text-sm">
                                    <Checkbox
                                      checked={selectedShelves.has(shelf.id)}
                                      onCheckedChange={() => handleToggleShelf(shelf.id)}
                                    />
                                    <span>{shelf.name}</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {shelf.width}×{shelf.depth}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary and Action */}
          <Card className="bg-blue-50 dark:bg-blue-950">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">
                    Selected: {selectedShelves.size} shelves
                    {selectedRecipeData && (
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                        for {selectedRecipeData.name}
                      </span>
                    )}
                  </p>
                  {selectedRecipeData && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Estimated harvest: {new Date(new Date(startDate).getTime() + (selectedRecipeData.total_grow_days || selectedRecipeData.grow_days || 0) * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleStartGrow}
                  disabled={!selectedRecipe || selectedShelves.size === 0 || isLoading}
                  className="min-w-32"
                >
                  {isLoading ? "Starting..." : `Start ${selectedShelves.size} Grows`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
} 