"use client";

import {
  Edit,
  Trash2,
  Clock,
  Droplets,
  Sun,
  Copy,
  Eye,
  Star,
  Calendar,
  Thermometer,
  Beaker,
  Leaf,
  BarChart3,
  PlayCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

import { GrowRecipe } from "@/types/grow-recipes";

interface EnhancedGrowRecipeCardProps {
  recipe: GrowRecipe;
  onEdit: (recipe: GrowRecipe) => void;
  onDelete: (recipe: GrowRecipe) => void;
  onClone?: (recipe: GrowRecipe) => void;
  onPreview?: (recipe: GrowRecipe) => void;
  onStartGrow?: (recipe: GrowRecipe) => void;
  isActive?: boolean;
  successRate?: number;
}

export function EnhancedGrowRecipeCard({
  recipe,
  onEdit,
  onDelete,
  onClone,
  onPreview,
  onStartGrow,
  isActive = false,
  successRate = Math.floor(Math.random() * 30) + 70, // Mock success rate
}: EnhancedGrowRecipeCardProps) {
  const getDifficultyConfig = (difficulty: string | null) => {
    switch (difficulty) {
      case "Easy":
        return {
          color:
            "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
          icon: "🌱",
        };
      case "Medium":
        return {
          color:
            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
          icon: "🌿",
        };
      case "Hard":
        return {
          color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
          icon: "🌳",
        };
      default:
        return {
          color:
            "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
          icon: "🌿",
        };
    }
  };

  const getPythiumRiskConfig = (risk: string | null) => {
    switch (risk) {
      case "Low":
        return {
          color:
            "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
          icon: "🛡️",
        };
      case "Medium":
        return {
          color:
            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
          icon: "⚠️",
        };
      case "High":
        return {
          color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
          icon: "⚡",
        };
      default:
        return {
          color:
            "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
          icon: "❓",
        };
    }
  };

  const difficultyConfig = getDifficultyConfig(recipe.difficulty ?? null);
  const pythiumConfig = getPythiumRiskConfig(recipe.pythium_risk ?? null);
  const totalDays = recipe.total_grow_days || recipe.grow_days || 0;

  return (
    <Card
      className={`
      group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02]
      ${isActive ? "ring-2 ring-green-500 dark:ring-green-400" : ""}
      border-l-4 border-l-primary/30 hover:border-l-primary
    `}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
      )}

      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg font-semibold truncate">
                {recipe.name}
              </CardTitle>
              {isActive && (
                <Badge
                  variant="outline"
                  className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400"
                >
                  Active
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Leaf className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground truncate">
                {recipe.species?.name || "Unknown Species"}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <TooltipProvider>
              {onPreview && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onPreview(recipe)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Preview recipe</TooltipContent>
                </Tooltip>
              )}

              {onClone && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onClone(recipe)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Clone recipe</TooltipContent>
                </Tooltip>
              )}

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

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(recipe)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete recipe</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Success Rate Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-500" />
              <span className="text-muted-foreground">Success Rate</span>
            </div>
            <span className="font-medium">{successRate}%</span>
          </div>
          <Progress value={successRate} className="h-2" />
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center p-2 bg-muted/50 rounded-lg">
            <Clock className="h-4 w-4 text-muted-foreground mb-1" />
            <span className="text-xs font-medium">{totalDays || "-"}</span>
            <span className="text-xs text-muted-foreground">days</span>
          </div>
          <div className="flex flex-col items-center p-2 bg-muted/50 rounded-lg">
            <Sun className="h-4 w-4 text-muted-foreground mb-1" />
            <span className="text-xs font-medium">
              {recipe.light_hours_per_day || "-"}
            </span>
            <span className="text-xs text-muted-foreground">hrs light</span>
          </div>
          <div className="flex flex-col items-center p-2 bg-muted/50 rounded-lg">
            <Thermometer className="h-4 w-4 text-muted-foreground mb-1" />
            <span className="text-xs font-medium">
              {recipe.target_temperature_min && recipe.target_temperature_max
                ? `${recipe.target_temperature_min}-${recipe.target_temperature_max}°C`
                : "-"}
            </span>
            <span className="text-xs text-muted-foreground">temp</span>
          </div>
        </div>

        {/* Badges Row */}
        <div className="flex flex-wrap gap-2">
          {recipe.difficulty && (
            <Badge className={`text-xs ${difficultyConfig.color}`}>
              <span className="mr-1">{difficultyConfig.icon}</span>
              {recipe.difficulty}
            </Badge>
          )}
          {recipe.pythium_risk && (
            <Badge
              variant="outline"
              className={`text-xs ${pythiumConfig.color}`}
            >
              <span className="mr-1">{pythiumConfig.icon}</span>
              {recipe.pythium_risk} Risk
            </Badge>
          )}
          {recipe.recipe_source && (
            <Badge variant="secondary" className="text-xs">
              {recipe.recipe_source}
            </Badge>
          )}
        </div>

        {/* Additional Details */}
        <div className="space-y-2 text-xs text-muted-foreground">
          {recipe.average_yield && (
            <div className="flex items-center justify-between">
              <span>Expected Yield:</span>
              <span className="font-medium text-foreground">
                {recipe.average_yield}g/tray
              </span>
            </div>
          )}

          {recipe.water_frequency && (
            <div className="flex items-center justify-between">
              <span>Watering:</span>
              <span className="font-medium text-foreground">
                {recipe.water_frequency}
              </span>
            </div>
          )}

          {recipe.target_ph_min && recipe.target_ph_max && (
            <div className="flex items-center justify-between">
              <span>pH Range:</span>
              <span className="font-medium text-foreground">
                {recipe.target_ph_min} - {recipe.target_ph_max}
              </span>
            </div>
          )}
        </div>

        {/* Action Button */}
        {onStartGrow && !isActive && (
          <Button
            onClick={() => onStartGrow(recipe)}
            className="w-full mt-4"
            size="sm"
          >
            <PlayCircle className="h-4 w-4 mr-2" />
            Start New Grow
          </Button>
        )}

        {isActive && (
          <div className="flex items-center justify-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <BarChart3 className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
            <span className="text-sm text-green-700 dark:text-green-400 font-medium">
              Currently Growing
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
