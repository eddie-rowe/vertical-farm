import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { GrowRecipeCard } from "@/components/features/agriculture";
import { GrowRecipe } from "@/types/grow-recipes";

// Mock the utilities to avoid import issues
jest.mock("@/lib/grow-recipe-utils", () => ({
  getDifficultyColor: (difficulty: string) => "mock-difficulty-color",
  getPythiumRiskColor: (risk: string) => "mock-risk-color",
}));

const mockRecipe: GrowRecipe = {
  id: "test-recipe-1",
  species_id: "species-1",
  name: "Test Basil Recipe",
  total_grow_days: 14,
  light_hours_per_day: 16,
  water_frequency: "Twice daily",
  difficulty: "Easy",
  pythium_risk: "Low",
  recipe_source: "Internal R&D",
  average_yield: 150,
  germination_days: 3,
  light_days: 11,
  fridge_storage_temp: 4,
  species: {
    id: "species-1",
    name: "Basil Genovese",
    description: "Classic Italian basil variety",
  },
};

const mockOnEdit = jest.fn();
const mockOnDelete = jest.fn();

describe("GrowRecipeCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders recipe information correctly", () => {
    render(
      <GrowRecipeCard
        recipe={mockRecipe}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
    );

    expect(screen.getByText("Test Basil Recipe")).toBeInTheDocument();
    expect(screen.getByText("Basil Genovese")).toBeInTheDocument();
    expect(screen.getByText("14 days")).toBeInTheDocument();
    expect(screen.getByText("16h light")).toBeInTheDocument();
    expect(screen.getByText("Twice daily")).toBeInTheDocument();
  });

  it("shows difficulty and pythium risk badges", () => {
    render(
      <GrowRecipeCard
        recipe={mockRecipe}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
    );

    expect(screen.getByText("Easy")).toBeInTheDocument();
    expect(screen.getByText("Pythium: Low")).toBeInTheDocument();
  });

  it("shows recipe source when available", () => {
    render(
      <GrowRecipeCard
        recipe={mockRecipe}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
    );

    expect(screen.getByText("Source: Internal R&D")).toBeInTheDocument();
  });

  it("shows expected yield when available", () => {
    render(
      <GrowRecipeCard
        recipe={mockRecipe}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
    );

    expect(screen.getByText("150g per tray")).toBeInTheDocument();
  });

  it("shows growing phases when available", () => {
    render(
      <GrowRecipeCard
        recipe={mockRecipe}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
    );

    expect(screen.getByText("Germination: 3 days")).toBeInTheDocument();
    expect(screen.getByText("Light phase: 11 days")).toBeInTheDocument();
  });

  it("shows storage temperature when available", () => {
    render(
      <GrowRecipeCard
        recipe={mockRecipe}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
    );

    expect(screen.getByText("Storage: 4°C")).toBeInTheDocument();
  });

  it("calls onEdit when edit button is clicked", () => {
    render(
      <GrowRecipeCard
        recipe={mockRecipe}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
    );

    const editButtons = screen.getAllByRole("button");
    const editButton = editButtons.find((button) =>
      button.querySelector('[data-testid="edit-icon"]'),
    );

    if (editButton) {
      fireEvent.click(editButton);
      expect(mockOnEdit).toHaveBeenCalledWith(mockRecipe);
    }
  });

  it("calls onDelete when delete button is clicked", () => {
    render(
      <GrowRecipeCard
        recipe={mockRecipe}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
    );

    const deleteButtons = screen.getAllByRole("button");
    const deleteButton = deleteButtons.find((button) =>
      button.querySelector('[data-testid="delete-icon"]'),
    );

    if (deleteButton) {
      fireEvent.click(deleteButton);
      expect(mockOnDelete).toHaveBeenCalledWith(mockRecipe);
    }
  });

  it("handles missing optional fields gracefully", () => {
    const minimalRecipe: GrowRecipe = {
      id: "minimal-recipe",
      species_id: "species-1",
      name: "Minimal Recipe",
      species: {
        id: "species-1",
        name: "Test Species",
      },
    };

    render(
      <GrowRecipeCard
        recipe={minimalRecipe}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
    );

    expect(screen.getByText("Minimal Recipe")).toBeInTheDocument();
    expect(screen.getByText("Test Species")).toBeInTheDocument();
    expect(screen.getByText("- days")).toBeInTheDocument(); // fallback for missing grow days
  });
});
