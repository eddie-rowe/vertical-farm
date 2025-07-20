"use client";

import { Edit, Trash2, Clock, Droplets, Sun } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GrowRecipe } from "@/types/grow-recipes";

interface GrowRecipeCardProps {
  recipe: GrowRecipe;
  onEdit: (recipe: GrowRecipe) => void;
  onDelete: (recipe: GrowRecipe) => void;
}

export function GrowRecipeCard({
  recipe,
  onEdit,
  onDelete,
}: GrowRecipeCardProps) {
  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPythiumRiskColor = (risk: string | null) => {
    switch (risk) {
      case "Low":
        return "bg-green-100 text-green-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "High":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1">{recipe.name}</CardTitle>
            <p className="text-sm text-gray-600">
              {recipe.species?.name || "Unknown Species"}
            </p>
          </div>
          <div className="flex gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(recipe)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit recipe</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(recipe)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete recipe</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-600">
              {recipe.total_grow_days || recipe.grow_days || "-"} days
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Sun className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-600">
              {recipe.light_hours_per_day || "-"}h light
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Droplets className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-600">
              {recipe.water_frequency || "Custom"}
            </span>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {recipe.difficulty && (
            <Badge className={getDifficultyColor(recipe.difficulty)}>
              {recipe.difficulty}
            </Badge>
          )}
          {recipe.pythium_risk && (
            <Badge className={getPythiumRiskColor(recipe.pythium_risk)}>
              Pythium: {recipe.pythium_risk}
            </Badge>
          )}
        </div>

        {/* Recipe Source */}
        {recipe.recipe_source && (
          <div className="text-xs text-gray-500">
            Source: {recipe.recipe_source}
          </div>
        )}

        {/* Yield Information */}
        {recipe.average_yield && (
          <div className="text-sm">
            <span className="text-gray-600">Expected Yield: </span>
            <span className="font-medium">
              {recipe.average_yield}g per tray
            </span>
          </div>
        )}

        {/* Growing Phases */}
        {(recipe.germination_days || recipe.light_days) && (
          <div className="text-xs text-gray-600">
            <div className="grid grid-cols-2 gap-2">
              {recipe.germination_days && (
                <div>Germination: {recipe.germination_days} days</div>
              )}
              {recipe.light_days && (
                <div>Light phase: {recipe.light_days} days</div>
              )}
            </div>
          </div>
        )}

        {/* Storage Info */}
        {recipe.fridge_storage_temp && (
          <div className="text-xs text-gray-600">
            Storage: {recipe.fridge_storage_temp}°C
          </div>
        )}
      </CardContent>
    </Card>
  );
}
