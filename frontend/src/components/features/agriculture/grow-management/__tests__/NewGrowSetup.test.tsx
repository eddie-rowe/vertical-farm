/**
 * Comprehensive integration tests for NewGrowSetup component
 * Tests React 19 features, service integration, and complete workflow
 * 
 * @group integration
 * @group components
 * @group new-grow-setup
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import '@testing-library/jest-dom';

import { FarmService } from '@/services/domain/farm/FarmService';
import { GrowRecipeService } from '@/services/domain/farm/GrowRecipeService';
import { GrowService } from '@/services/domain/farm/GrowService';
import { SpeciesService } from '@/services/domain/farm/SpeciesService';

import NewGrowSetup from '../NewGrowSetup';

// Mock the services
jest.mock('@/services/domain/farm/FarmService');
jest.mock('@/services/domain/farm/SpeciesService');
jest.mock('@/services/domain/farm/GrowRecipeService');
jest.mock('@/services/domain/farm/GrowService');

// Mock hooks
jest.mock('@/hooks', () => ({
  useFarmSearch: jest.fn(() => ({
    searchTerm: '',
    setSearchTerm: jest.fn(),
    clearSearch: jest.fn(),
    filterItems: jest.fn((items) => items),
    hasSearch: false,
  })),
  useFarmFilters: jest.fn(() => ({
    filters: [],
    setFilter: jest.fn(),
    removeFilter: jest.fn(),
    clearAllFilters: jest.fn(),
    getActiveFilterChips: jest.fn(() => []),
    filterItems: jest.fn((items) => items),
    hasActiveFilters: false,
  })),
}));

// Mock React 19 features
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useOptimistic: jest.fn((initialState, updateFn) => [initialState, jest.fn()]),
  useTransition: jest.fn(() => [false, jest.fn()]),
}));

// Test data fixtures
const mockFarms = [
  {
    id: 'farm-1',
    name: 'Farm Alpha',
    location: 'Building A',
    status: 'online',
    capacity: { used: 20, total: 100 },
    image: '🏢',
    rows: [
      {
        id: 'row-1',
        name: 'Row A',
        racks: [
          {
            id: 'rack-1',
            name: 'Rack A1',
            shelves: [
              {
                id: 'shelf-1',
                name: 'A1-S1',
                status: 'available',
                dimensions: { width: 2, depth: 1, height: 0.5 },
              },
              {
                id: 'shelf-2',
                name: 'A1-S2',
                status: 'available',
                dimensions: { width: 2, depth: 1, height: 0.5 },
              },
              {
                id: 'shelf-3',
                name: 'A1-S3',
                status: 'occupied',
                dimensions: { width: 2, depth: 1, height: 0.5 },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'farm-2',
    name: 'Farm Beta',
    location: 'Building B',
    status: 'offline',
    capacity: { used: 5, total: 50 },
    image: '🌿',
    rows: [],
  },
];

const mockSpecies = [
  {
    id: 'species-1',
    name: 'Lettuce',
    scientific_name: 'Lactuca sativa',
    category: 'leafy_greens',
    image: '🥬',
    is_active: true,
  },
  {
    id: 'species-2',
    name: 'Basil',
    scientific_name: 'Ocimum basilicum',
    category: 'herbs',
    image: '🌿',
    is_active: true,
  },
];

const mockGrowRecipes = [
  {
    id: 'recipe-1',
    species_id: 'species-1',
    name: 'Lettuce Standard',
    difficulty: 'Easy',
    total_grow_days: 30,
    light_hours_per_day: 16,
    is_active: true,
    species: mockSpecies[0],
  },
  {
    id: 'recipe-2',
    species_id: 'species-2',
    name: 'Basil Intensive',
    difficulty: 'Hard',
    total_grow_days: 45,
    light_hours_per_day: 14,
    is_active: true,
    species: mockSpecies[1],
  },
  {
    id: 'recipe-3',
    species_id: 'species-1',
    name: 'Lettuce Quick',
    difficulty: 'Medium',
    total_grow_days: 21,
    light_hours_per_day: 18,
    is_active: false,
  },
];

describe('NewGrowSetup Component', () => {
  // Mock service instances
  const mockFarmService = {
    getAll: jest.fn(),
  };
  const mockSpeciesService = {
    getActiveSpecies: jest.fn(),
  };
  const mockGrowRecipeService = {
    getActiveRecipes: jest.fn(),
  };
  const mockGrowService = {
    startMultipleGrows: jest.fn(),
  };

  // Mock React 19 hooks
  const mockSetOptimistic = jest.fn();
  const mockStartTransition = jest.fn();

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Mock service instances
    (FarmService.getInstance as jest.Mock).mockReturnValue(mockFarmService);
    (SpeciesService.getInstance as jest.Mock).mockReturnValue(mockSpeciesService);
    (GrowRecipeService.getInstance as jest.Mock).mockReturnValue(mockGrowRecipeService);
    (GrowService.getInstance as jest.Mock).mockReturnValue(mockGrowService);

    // Mock React 19 hooks
    const mockReact = require('react');
    mockReact.useOptimistic.mockReturnValue([[], mockSetOptimistic]);
    mockReact.useTransition.mockReturnValue([false, mockStartTransition]);

    // Setup successful service responses
    mockFarmService.getAll.mockResolvedValue(mockFarms);
    mockSpeciesService.getActiveSpecies.mockResolvedValue(mockSpecies);
    mockGrowRecipeService.getActiveRecipes.mockResolvedValue(mockGrowRecipes);
    mockGrowService.startMultipleGrows.mockResolvedValue([
      {
        id: 'new-grow-1',
        name: 'Test Grow',
        status: 'planned',
      },
    ]);
  });

  describe('Initial Loading and Data Fetching', () => {
    it('should display loading state initially', async () => {
      render(<NewGrowSetup />);

      expect(screen.getByText('Loading grow setup wizard...')).toBeInTheDocument();
      expect(screen.getByRole('generic', { name: /loading/i })).toBeInTheDocument();
    });

    it('should load all required data on mount', async () => {
      render(<NewGrowSetup />);

      await waitFor(() => {
        expect(mockFarmService.getAll).toHaveBeenCalled();
        expect(mockSpeciesService.getActiveSpecies).toHaveBeenCalled();
        expect(mockGrowRecipeService.getActiveRecipes).toHaveBeenCalled();
      });

      expect(screen.queryByText('Loading grow setup wizard...')).not.toBeInTheDocument();
    });

    it('should handle loading errors gracefully', async () => {
      mockFarmService.getAll.mockRejectedValue(new Error('Failed to load farms'));

      render(<NewGrowSetup />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load farms')).toBeInTheDocument();
      });

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      fireEvent.click(dismissButton);

      expect(screen.queryByText('Failed to load farms')).not.toBeInTheDocument();
    });

    it('should display farms after successful loading', async () => {
      render(<NewGrowSetup />);

      await waitFor(() => {
        expect(screen.getByText('Farm Alpha')).toBeInTheDocument();
        expect(screen.getByText('Farm Beta')).toBeInTheDocument();
      });
    });
  });

  describe('Wizard Navigation', () => {
    it('should start at farm selection step', async () => {
      render(<NewGrowSetup />);

      await waitFor(() => {
        expect(screen.getByText('Choose Your Farm')).toBeInTheDocument();
        expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
      });
    });

    it('should show progress correctly', async () => {
      render(<NewGrowSetup />);

      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow', '25'); // 25% for step 1 of 4
      });
    });

    it('should disable next button when no farm selected', async () => {
      render(<NewGrowSetup />);

      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /next/i });
        expect(nextButton).toBeDisabled();
      });
    });

    it('should enable next button when farm selected', async () => {
      render(<NewGrowSetup />);

      await waitFor(() => {
        const farmCard = screen.getByText('Farm Alpha').closest('button');
        fireEvent.click(farmCard!);

        const nextButton = screen.getByRole('button', { name: /next/i });
        expect(nextButton).not.toBeDisabled();
      });
    });

    it('should navigate through all steps successfully', async () => {
      const user = userEvent.setup();
      render(<NewGrowSetup />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Farm Alpha')).toBeInTheDocument();
      });

      // Step 1: Select farm
      const farmCard = screen.getByText('Farm Alpha').closest('button');
      await user.click(farmCard!);
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Step 2: Select recipe
      await waitFor(() => {
        expect(screen.getByText('Choose Your Recipe')).toBeInTheDocument();
      });

      const recipeCard = screen.getByText('Lettuce Standard').closest('button');
      await user.click(recipeCard!);
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Step 3: Select location
      await waitFor(() => {
        expect(screen.getByText('Select Growing Locations')).toBeInTheDocument();
      });

      const shelfButton = screen.getByText('A1-S1').closest('button');
      await user.click(shelfButton!);
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Step 4: Confirm setup
      await waitFor(() => {
        expect(screen.getByText('Confirm Your Setup')).toBeInTheDocument();
      });
    });

    it('should allow navigation back to previous steps', async () => {
      const user = userEvent.setup();
      render(<NewGrowSetup />);

      // Navigate to step 2
      await waitFor(() => {
        const farmCard = screen.getByText('Farm Alpha').closest('button');
        user.click(farmCard!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Navigate back to step 1
      await user.click(screen.getByRole('button', { name: /previous/i }));

      await waitFor(() => {
        expect(screen.getByText('Choose Your Farm')).toBeInTheDocument();
      });
    });

    it('should allow direct step navigation for completed steps', async () => {
      const user = userEvent.setup();
      render(<NewGrowSetup />);

      // Navigate to step 2
      await waitFor(() => {
        const farmCard = screen.getByText('Farm Alpha').closest('button');
        user.click(farmCard!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Click on step 1 in progress bar
      const step1Button = screen.getByText('Select Farm').closest('button');
      await user.click(step1Button!);

      await waitFor(() => {
        expect(screen.getByText('Choose Your Farm')).toBeInTheDocument();
      });
    });
  });

  describe('Farm Selection', () => {
    it('should display all available farms', async () => {
      render(<NewGrowSetup />);

      await waitFor(() => {
        expect(screen.getByText('Farm Alpha')).toBeInTheDocument();
        expect(screen.getByText('Farm Beta')).toBeInTheDocument();
      });
    });

    it('should show farm status and capacity', async () => {
      render(<NewGrowSetup />);

      await waitFor(() => {
        expect(screen.getByText('online')).toBeInTheDocument();
        expect(screen.getByText('offline')).toBeInTheDocument();
        expect(screen.getByText('20/100 shelves')).toBeInTheDocument();
        expect(screen.getByText('5/50 shelves')).toBeInTheDocument();
      });
    });

    it('should disable farms in maintenance', async () => {
      const maintenanceFarm = {
        ...mockFarms[0],
        id: 'farm-maintenance',
        name: 'Farm Maintenance',
        status: 'maintenance',
      };
      
      mockFarmService.getAll.mockResolvedValue([...mockFarms, maintenanceFarm]);

      render(<NewGrowSetup />);

      await waitFor(() => {
        const maintenanceCard = screen.getByText('Farm Maintenance').closest('button');
        expect(maintenanceCard).toBeDisabled();
      });
    });

    it('should highlight selected farm', async () => {
      const user = userEvent.setup();
      render(<NewGrowSetup />);

      await waitFor(() => {
        const farmCard = screen.getByText('Farm Alpha').closest('button');
        user.click(farmCard!);

        expect(farmCard).toHaveClass('border-green-500');
      });
    });
  });

  describe('Recipe Selection with Search and Filtering', () => {
    it('should display all active recipes', async () => {
      const user = userEvent.setup();
      render(<NewGrowSetup />);

      // Navigate to recipe step
      await waitFor(() => {
        const farmCard = screen.getByText('Farm Alpha').closest('button');
        user.click(farmCard!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText('Lettuce Standard')).toBeInTheDocument();
        expect(screen.getByText('Basil Intensive')).toBeInTheDocument();
        // Should not show inactive recipe
        expect(screen.queryByText('Lettuce Quick')).not.toBeInTheDocument();
      });
    });

    it('should display recipe details correctly', async () => {
      const user = userEvent.setup();
      render(<NewGrowSetup />);

      // Navigate to recipe step
      await waitFor(() => {
        const farmCard = screen.getByText('Farm Alpha').closest('button');
        user.click(farmCard!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText('Easy')).toBeInTheDocument(); // Difficulty
        expect(screen.getByText('30 days')).toBeInTheDocument(); // Duration
        expect(screen.getByText('16h light')).toBeInTheDocument(); // Light hours
      });
    });

    it('should show search and filter controls', async () => {
      const user = userEvent.setup();
      render(<NewGrowSetup />);

      // Navigate to recipe step
      await waitFor(() => {
        const farmCard = screen.getByText('Farm Alpha').closest('button');
        user.click(farmCard!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search recipes by name...')).toBeInTheDocument();
        expect(screen.getByText('Difficulty')).toBeInTheDocument();
        expect(screen.getByText('Species')).toBeInTheDocument();
        expect(screen.getByText('Duration')).toBeInTheDocument();
      });
    });

    it('should handle empty recipe results', async () => {
      mockGrowRecipeService.getActiveRecipes.mockResolvedValue([]);

      const user = userEvent.setup();
      render(<NewGrowSetup />);

      // Navigate to recipe step
      await waitFor(() => {
        const farmCard = screen.getByText('Farm Alpha').closest('button');
        user.click(farmCard!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText('No recipes found')).toBeInTheDocument();
        expect(screen.getByText('No recipes are available at the moment.')).toBeInTheDocument();
      });
    });

    it('should show estimated yields and profits', async () => {
      const user = userEvent.setup();
      render(<NewGrowSetup />);

      // Navigate to recipe step
      await waitFor(() => {
        const farmCard = screen.getByText('Farm Alpha').closest('button');
        user.click(farmCard!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText(/heads per shelf/)).toBeInTheDocument(); // Yield estimate
        expect(screen.getByText(/\$.*per shelf/)).toBeInTheDocument(); // Profit estimate
      });
    });
  });

  describe('Location Selection', () => {
    it('should display farm layout with rows, racks, and shelves', async () => {
      const user = userEvent.setup();
      render(<NewGrowSetup />);

      // Navigate to location step
      await waitFor(() => {
        const farmCard = screen.getByText('Farm Alpha').closest('button');
        user.click(farmCard!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        const recipeCard = screen.getByText('Lettuce Standard').closest('button');
        user.click(recipeCard!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText('Row A')).toBeInTheDocument();
        expect(screen.getByText('Rack A1')).toBeInTheDocument();
        expect(screen.getByText('A1-S1')).toBeInTheDocument();
        expect(screen.getByText('A1-S2')).toBeInTheDocument();
      });
    });

    it('should show shelf status indicators', async () => {
      const user = userEvent.setup();
      render(<NewGrowSetup />);

      // Navigate to location step
      await waitFor(() => {
        const farmCard = screen.getByText('Farm Alpha').closest('button');
        user.click(farmCard!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        const recipeCard = screen.getByText('Lettuce Standard').closest('button');
        user.click(recipeCard!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText('Available')).toBeInTheDocument();
        expect(screen.getByText('Occupied')).toBeInTheDocument();
        expect(screen.getByText('Maintenance')).toBeInTheDocument();
      });
    });

    it('should allow selecting multiple shelves', async () => {
      const user = userEvent.setup();
      render(<NewGrowSetup />);

      // Navigate to location step
      await waitFor(() => {
        const farmCard = screen.getByText('Farm Alpha').closest('button');
        user.click(farmCard!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        const recipeCard = screen.getByText('Lettuce Standard').closest('button');
        user.click(recipeCard!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        const shelf1 = screen.getByText('A1-S1').closest('button');
        const shelf2 = screen.getByText('A1-S2').closest('button');
        
        user.click(shelf1!);
        user.click(shelf2!);

        expect(screen.getByText('2')).toBeInTheDocument(); // Selected count
      });
    });

    it('should prevent selecting occupied shelves', async () => {
      const user = userEvent.setup();
      render(<NewGrowSetup />);

      // Navigate to location step
      await waitFor(() => {
        const farmCard = screen.getByText('Farm Alpha').closest('button');
        user.click(farmCard!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        const recipeCard = screen.getByText('Lettuce Standard').closest('button');
        user.click(recipeCard!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        const occupiedShelf = screen.getByText('A1-S3').closest('button');
        expect(occupiedShelf).toBeDisabled();
      });
    });

    it('should show shelf dimensions', async () => {
      const user = userEvent.setup();
      render(<NewGrowSetup />);

      // Navigate to location step and make selections
      await waitFor(() => {
        const farmCard = screen.getByText('Farm Alpha').closest('button');
        user.click(farmCard!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        const recipeCard = screen.getByText('Lettuce Standard').closest('button');
        user.click(recipeCard!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText('2×1m')).toBeInTheDocument();
      });
    });
  });

  describe('Confirmation Step', () => {
    it('should display complete setup summary', async () => {
      const user = userEvent.setup();
      render(<NewGrowSetup />);

      // Navigate through all steps
      await waitFor(() => {
        const farmCard = screen.getByText('Farm Alpha').closest('button');
        user.click(farmCard!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        const recipeCard = screen.getByText('Lettuce Standard').closest('button');
        user.click(recipeCard!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        const shelf = screen.getByText('A1-S1').closest('button');
        user.click(shelf!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText('Farm Alpha')).toBeInTheDocument();
        expect(screen.getByText('Lettuce Standard')).toBeInTheDocument();
        expect(screen.getByText('🥬 Lettuce')).toBeInTheDocument();
        expect(screen.getByText('1 selected')).toBeInTheDocument();
      });
    });

    it('should allow editing start date', async () => {
      const user = userEvent.setup();
      render(<NewGrowSetup />);

      // Navigate to confirmation step
      await waitFor(() => {
        const farmCard = screen.getByText('Farm Alpha').closest('button');
        user.click(farmCard!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        const recipeCard = screen.getByText('Lettuce Standard').closest('button');
        user.click(recipeCard!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        const shelf = screen.getByText('A1-S1').closest('button');
        user.click(shelf!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        const dateInput = screen.getByLabelText('Start Date');
        expect(dateInput).toBeInTheDocument();
        user.clear(dateInput);
        user.type(dateInput, '2024-02-01');
      });
    });

    it('should show timeline and estimates', async () => {
      const user = userEvent.setup();
      render(<NewGrowSetup />);

      // Navigate to confirmation step
      await waitFor(() => {
        const farmCard = screen.getByText('Farm Alpha').closest('button');
        user.click(farmCard!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        const recipeCard = screen.getByText('Lettuce Standard').closest('button');
        user.click(recipeCard!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        const shelf = screen.getByText('A1-S1').closest('button');
        user.click(shelf!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText('30 days')).toBeInTheDocument(); // Duration
        expect(screen.getByText(/Harvest Date:/)).toBeInTheDocument();
        expect(screen.getByText(/Expected Yield:/)).toBeInTheDocument();
        expect(screen.getByText(/Profit Estimate:/)).toBeInTheDocument();
      });
    });
  });

  describe('Grow Creation with React 19 Features', () => {
    it('should use optimistic updates when starting grows', async () => {
      const user = userEvent.setup();
      render(<NewGrowSetup />);

      // Complete the wizard
      await waitFor(() => {
        const farmCard = screen.getByText('Farm Alpha').closest('button');
        user.click(farmCard!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        const recipeCard = screen.getByText('Lettuce Standard').closest('button');
        user.click(recipeCard!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        const shelf = screen.getByText('A1-S1').closest('button');
        user.click(shelf!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Start the grows
      const startButton = screen.getByRole('button', { name: /start 1 grows/i });
      await user.click(startButton);

      // Verify optimistic update was called
      expect(mockStartTransition).toHaveBeenCalled();
      expect(mockSetOptimistic).toHaveBeenCalled();
    });

    it('should show optimistic success message', async () => {
      // Mock optimistic state to have pending grows
      const mockReact = require('react');
      mockReact.useOptimistic.mockReturnValue([
        [{ name: 'Test Grow', shelf_id: 'shelf-1' }],
        mockSetOptimistic,
      ]);

      render(<NewGrowSetup />);

      await waitFor(() => {
        expect(screen.getByText('Starting 1 new grows... This will complete shortly.')).toBeInTheDocument();
      });
    });

    it('should handle grow creation success', async () => {
      const user = userEvent.setup();
      render(<NewGrowSetup />);

      // Complete the wizard
      await waitFor(() => {
        const farmCard = screen.getByText('Farm Alpha').closest('button');
        user.click(farmCard!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        const recipeCard = screen.getByText('Lettuce Standard').closest('button');
        user.click(recipeCard!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        const shelf = screen.getByText('A1-S1').closest('button');
        user.click(shelf!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Mock successful service call
      mockGrowService.startMultipleGrows.mockResolvedValue([
        {
          id: 'grow-1',
          name: 'Lettuce Standard - 1/1/2024',
          status: 'planned',
        },
      ]);

      const startButton = screen.getByRole('button', { name: /start 1 grows/i });
      await user.click(startButton);

      await waitFor(() => {
        expect(mockGrowService.startMultipleGrows).toHaveBeenCalledWith([
          expect.objectContaining({
            name: expect.stringContaining('Lettuce Standard'),
            grow_recipe_id: 'recipe-1',
            shelf_id: 'shelf-1',
            automation_enabled: true,
          }),
        ]);
      });
    });

    it('should handle grow creation failure', async () => {
      const user = userEvent.setup();
      render(<NewGrowSetup />);

      // Complete the wizard
      await waitFor(() => {
        const farmCard = screen.getByText('Farm Alpha').closest('button');
        user.click(farmCard!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        const recipeCard = screen.getByText('Lettuce Standard').closest('button');
        user.click(recipeCard!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        const shelf = screen.getByText('A1-S1').closest('button');
        user.click(shelf!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Mock failed service call
      mockGrowService.startMultipleGrows.mockRejectedValue(new Error('Failed to create grows'));

      const startButton = screen.getByRole('button', { name: /start 1 grows/i });
      await user.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to create grows')).toBeInTheDocument();
      });

      // Should reset optimistic state on error
      expect(mockSetOptimistic).toHaveBeenCalledWith([]);
    });

    it('should show loading state during creation', async () => {
      const user = userEvent.setup();
      render(<NewGrowSetup />);

      // Complete the wizard
      await waitFor(() => {
        const farmCard = screen.getByText('Farm Alpha').closest('button');
        user.click(farmCard!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        const recipeCard = screen.getByText('Lettuce Standard').closest('button');
        user.click(recipeCard!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        const shelf = screen.getByText('A1-S1').closest('button');
        user.click(shelf!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Mock pending transition
      const mockReact = require('react');
      mockReact.useTransition.mockReturnValue([true, mockStartTransition]);

      render(<NewGrowSetup />);

      await waitFor(() => {
        expect(screen.getByText('Creating...')).toBeInTheDocument();
      });
    });

    it('should reset form after successful creation', async () => {
      const user = userEvent.setup();
      render(<NewGrowSetup />);

      // Complete the wizard
      await waitFor(() => {
        const farmCard = screen.getByText('Farm Alpha').closest('button');
        user.click(farmCard!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        const recipeCard = screen.getByText('Lettuce Standard').closest('button');
        user.click(recipeCard!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        const shelf = screen.getByText('A1-S1').closest('button');
        user.click(shelf!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));

      const startButton = screen.getByRole('button', { name: /start 1 grows/i });
      await user.click(startButton);

      // Wait for successful completion
      await waitFor(() => {
        expect(mockGrowService.startMultipleGrows).toHaveBeenCalled();
      });

      // Should reset to first step
      await waitFor(() => {
        expect(screen.getByText('Choose Your Farm')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility and UX', () => {
    it('should have proper ARIA labels and roles', async () => {
      render(<NewGrowSetup />);

      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      });
    });

    it('should provide helpful instruction text for each step', async () => {
      render(<NewGrowSetup />);

      await waitFor(() => {
        expect(screen.getByText('Select a farm to continue')).toBeInTheDocument();
      });
    });

    it('should validate form completion before allowing progression', async () => {
      const user = userEvent.setup();
      render(<NewGrowSetup />);

      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /next/i });
        expect(nextButton).toBeDisabled();

        // Select farm and verify button is enabled
        const farmCard = screen.getByText('Farm Alpha').closest('button');
        user.click(farmCard!);
        expect(nextButton).not.toBeDisabled();
      });
    });

    it('should show contextual help text for complex steps', async () => {
      const user = userEvent.setup();
      render(<NewGrowSetup />);

      // Navigate to location step
      await waitFor(() => {
        const farmCard = screen.getByText('Farm Alpha').closest('button');
        user.click(farmCard!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        const recipeCard = screen.getByText('Lettuce Standard').closest('button');
        user.click(recipeCard!);
      });
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText('Select at least one shelf to continue')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Considerations', () => {
    it('should handle large datasets efficiently', async () => {
      // Mock large datasets
      const largeFarmList = Array.from({ length: 50 }, (_, i) => ({
        ...mockFarms[0],
        id: `farm-${i}`,
        name: `Farm ${i}`,
      }));
      
      const largeRecipeList = Array.from({ length: 100 }, (_, i) => ({
        ...mockGrowRecipes[0],
        id: `recipe-${i}`,
        name: `Recipe ${i}`,
      }));

      mockFarmService.getAll.mockResolvedValue(largeFarmList);
      mockGrowRecipeService.getActiveRecipes.mockResolvedValue(largeRecipeList);

      const startTime = Date.now();
      render(<NewGrowSetup />);

      await waitFor(() => {
        expect(screen.getByText('Farm 0')).toBeInTheDocument();
      });

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(2000); // Should render in under 2 seconds
    });

    it('should not re-render unnecessarily', async () => {
      const renderSpy = jest.fn();
      const TestWrapper = () => {
        renderSpy();
        return <NewGrowSetup />;
      };

      render(<TestWrapper />);

      await waitFor(() => {
        expect(screen.getByText('Farm Alpha')).toBeInTheDocument();
      });

      // Component should only render once after initial data load
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });
  });
});