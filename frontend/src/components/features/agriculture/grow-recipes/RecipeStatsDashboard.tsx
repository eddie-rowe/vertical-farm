"use client";

import { TrendingUp } from "lucide-react";
import { useMemo } from "react";

import type { GrowRecipe } from "@/types/grow-recipes";

import {
  TotalRecipesCard,
  AvgSuccessRateCard,
  AvgGrowTimeCard,
  RecipeStatsCard,
} from "./RecipeStatsCard";


interface RecipeStatsDashboardProps {
  recipes: GrowRecipe[];
  isLoading?: boolean;
}

export function RecipeStatsDashboard({
  recipes,
  isLoading = false,
}: RecipeStatsDashboardProps) {
  const stats = useMemo(() => {
    if (!recipes || recipes.length === 0) {
      return {
        totalRecipes: 0,
        avgSuccessRate: 0,
        avgGrowTime: 0,
        mostPopularSpecies: "N/A",
        activeRecipes: 0,
      };
    }

    // Calculate total recipes
    const totalRecipes = recipes.length;

    // Calculate average success rate (using a mock success rate for now)
    // In a real app, this would come from actual grow data
    const avgSuccessRate = Math.round(
      recipes.reduce((sum, recipe) => {
        // Mock success rate based on difficulty (easier = higher success)
        const mockSuccessRate =
          recipe.difficulty === "Easy"
            ? 85
            : recipe.difficulty === "Medium"
              ? 75
              : 65;
        return sum + mockSuccessRate;
      }, 0) / totalRecipes,
    );

    // Calculate average grow time
    const avgGrowTime = Math.round(
      recipes.reduce((sum, recipe) => {
        // Use total_grow_days or grow_days from the recipe
        const totalDays = recipe.total_grow_days || recipe.grow_days || 42; // Default 6 weeks
        return sum + totalDays;
      }, 0) / totalRecipes,
    );

    // Find most popular species
    const speciesCount = recipes.reduce(
      (acc, recipe) => {
        const species = recipe.species?.name || "Unknown";
        acc[species] = (acc[species] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const mostPopularSpecies =
      Object.entries(speciesCount).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      "N/A";

    // Count active recipes (mock - in real app would check if any grows are currently using this recipe)
    const activeRecipes = Math.floor(totalRecipes * 0.3); // Mock: 30% are active

    return {
      totalRecipes,
      avgSuccessRate,
      avgGrowTime,
      mostPopularSpecies,
      activeRecipes,
    };
  }, [recipes]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <TotalRecipesCard
        count={stats.totalRecipes}
        trend={{ value: 12, isPositive: true }}
      />
      <AvgSuccessRateCard
        rate={stats.avgSuccessRate}
        trend={{ value: 5, isPositive: true }}
      />
      <AvgGrowTimeCard
        days={stats.avgGrowTime}
        trend={{ value: 8, isPositive: false }}
      />
      <RecipeStatsCard
        title="Most Popular"
        value={stats.mostPopularSpecies}
        subtitle={`${stats.activeRecipes} currently active`}
        icon={TrendingUp}
        variant="warning"
      />
    </div>
  );
}
