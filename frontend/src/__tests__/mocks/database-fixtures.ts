/**
 * Realistic database fixtures for testing
 * Provides comprehensive test data that mirrors production scenarios
 * 
 * @group test-fixtures
 * @group mocks
 */

import type { GrowWithDetails, CreateGrowInput } from '@/services/domain/farm/GrowService';
import type { GrowStatus } from '@/types/automation/grow';
import type { Farm, Shelf } from '@/types/farm/layout';
import type { Species, GrowRecipe, GrowDifficulty, PythiumRisk } from '@/types/farm/recipes';

/**
 * Species fixtures representing common vertical farming crops
 */
export const mockSpeciesFixtures: Species[] = [
  {
    id: 'species-lettuce-1',
    name: 'Butterhead Lettuce',
    description: 'Soft, buttery leaves perfect for salads',
    scientific_name: 'Lactuca sativa var. capitata',
    category: 'leafy_greens',
    image: '🥬',
    is_active: true,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'species-lettuce-2',
    name: 'Romaine Lettuce',
    description: 'Crisp, elongated leaves with robust flavor',
    scientific_name: 'Lactuca sativa var. longifolia',
    category: 'leafy_greens',
    image: '🥬',
    is_active: true,
    created_at: '2024-01-02T00:00:00.000Z',
    updated_at: '2024-01-02T00:00:00.000Z',
  },
  {
    id: 'species-basil-1',
    name: 'Sweet Basil',
    description: 'Classic Italian basil for cooking',
    scientific_name: 'Ocimum basilicum',
    category: 'herbs',
    image: '🌿',
    is_active: true,
    created_at: '2024-01-03T00:00:00.000Z',
    updated_at: '2024-01-03T00:00:00.000Z',
  },
  {
    id: 'species-basil-2',
    name: 'Thai Basil',
    description: 'Aromatic variety with anise-like flavor',
    scientific_name: 'Ocimum basilicum var. thyrsiflora',
    category: 'herbs',
    image: '🌿',
    is_active: true,
    created_at: '2024-01-04T00:00:00.000Z',
    updated_at: '2024-01-04T00:00:00.000Z',
  },
  {
    id: 'species-kale-1',
    name: 'Curly Kale',
    description: 'Nutrient-dense leafy green with curly leaves',
    scientific_name: 'Brassica oleracea var. acephala',
    category: 'leafy_greens',
    image: '🥬',
    is_active: true,
    created_at: '2024-01-05T00:00:00.000Z',
    updated_at: '2024-01-05T00:00:00.000Z',
  },
  {
    id: 'species-spinach-1',
    name: 'Baby Spinach',
    description: 'Tender young spinach leaves',
    scientific_name: 'Spinacia oleracea',
    category: 'leafy_greens',
    image: '🥬',
    is_active: true,
    created_at: '2024-01-06T00:00:00.000Z',
    updated_at: '2024-01-06T00:00:00.000Z',
  },
  {
    id: 'species-arugula-1',
    name: 'Wild Arugula',
    description: 'Peppery greens with distinctive flavor',
    scientific_name: 'Eruca vesicaria',
    category: 'leafy_greens',
    image: '🥬',
    is_active: true,
    created_at: '2024-01-07T00:00:00.000Z',
    updated_at: '2024-01-07T00:00:00.000Z',
  },
  {
    id: 'species-cilantro-1',
    name: 'Cilantro',
    description: 'Fresh herb for Mexican and Asian cuisine',
    scientific_name: 'Coriandrum sativum',
    category: 'herbs',
    image: '🌿',
    is_active: true,
    created_at: '2024-01-08T00:00:00.000Z',
    updated_at: '2024-01-08T00:00:00.000Z',
  },
  {
    id: 'species-mint-1',
    name: 'Spearmint',
    description: 'Refreshing mint variety',
    scientific_name: 'Mentha spicata',
    category: 'herbs',
    image: '🌿',
    is_active: true,
    created_at: '2024-01-09T00:00:00.000Z',
    updated_at: '2024-01-09T00:00:00.000Z',
  },
  {
    id: 'species-tomato-1',
    name: 'Cherry Tomato',
    description: 'Small, sweet tomatoes perfect for snacking',
    scientific_name: 'Solanum lycopersicum var. cerasiforme',
    category: 'fruiting',
    image: '🍅',
    is_active: false, // Temporarily disabled for testing
    created_at: '2024-01-10T00:00:00.000Z',
    updated_at: '2024-01-10T00:00:00.000Z',
  },
];

/**
 * Grow recipe fixtures with realistic growing parameters
 */
export const mockGrowRecipeFixtures: GrowRecipe[] = [
  {
    id: 'recipe-butterhead-standard',
    species_id: 'species-lettuce-1',
    name: 'Butterhead Standard',
    grow_days: 35,
    light_hours_per_day: 14,
    watering_frequency_hours: 4,
    target_temperature_min: 16,
    target_temperature_max: 22,
    target_humidity_min: 65,
    target_humidity_max: 80,
    target_ph_min: 5.5,
    target_ph_max: 6.5,
    target_ec_min: 1.2,
    target_ec_max: 1.8,
    average_yield: 180, // grams per head
    sowing_rate: 95,
    recipe_source: 'Cornell CEA Program',
    germination_days: 3,
    light_days: 32,
    total_grow_days: 35,
    top_coat: 'none',
    pythium_risk: 'low' as PythiumRisk,
    water_intake: 2.5,
    water_frequency: 'every_4_hours',
    lighting: {
      schedule: 'standard',
      intensity: 'medium',
      spectrum: 'full_spectrum',
    },
    fridge_storage_temp: 2,
    difficulty: 'Easy' as GrowDifficulty,
    custom_parameters: {
      harvest_method: 'whole_head',
      post_harvest_handling: 'immediate_cooling',
    },
    priority: 'high',
    is_active: true,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'recipe-butterhead-quick',
    species_id: 'species-lettuce-1',
    name: 'Butterhead Quick Harvest',
    grow_days: 28,
    light_hours_per_day: 16,
    watering_frequency_hours: 3,
    target_temperature_min: 18,
    target_temperature_max: 24,
    target_humidity_min: 70,
    target_humidity_max: 85,
    target_ph_min: 5.8,
    target_ph_max: 6.2,
    target_ec_min: 1.4,
    target_ec_max: 2.0,
    average_yield: 150,
    sowing_rate: 90,
    recipe_source: 'Speed Growing Protocol v2',
    germination_days: 2,
    light_days: 26,
    total_grow_days: 28,
    top_coat: 'vermiculite',
    pythium_risk: 'medium' as PythiumRisk,
    water_intake: 3.2,
    water_frequency: 'every_3_hours',
    lighting: {
      schedule: 'intensive',
      intensity: 'high',
      spectrum: 'red_blue_enhanced',
    },
    fridge_storage_temp: 1,
    difficulty: 'Medium' as GrowDifficulty,
    custom_parameters: {
      harvest_method: 'baby_leaf',
      growth_stage_monitoring: 'daily',
    },
    priority: 'medium',
    is_active: true,
    created_at: '2024-01-02T00:00:00.000Z',
    updated_at: '2024-01-02T00:00:00.000Z',
  },
  {
    id: 'recipe-romaine-standard',
    species_id: 'species-lettuce-2',
    name: 'Romaine Standard',
    grow_days: 42,
    light_hours_per_day: 14,
    watering_frequency_hours: 4,
    target_temperature_min: 15,
    target_temperature_max: 21,
    target_humidity_min: 60,
    target_humidity_max: 75,
    target_ph_min: 5.5,
    target_ph_max: 6.5,
    target_ec_min: 1.0,
    target_ec_max: 1.6,
    average_yield: 220,
    sowing_rate: 85,
    recipe_source: 'Traditional Hydroponic Method',
    germination_days: 4,
    light_days: 38,
    total_grow_days: 42,
    top_coat: 'none',
    pythium_risk: 'low' as PythiumRisk,
    water_intake: 2.8,
    water_frequency: 'every_4_hours',
    lighting: {
      schedule: 'standard',
      intensity: 'medium',
      spectrum: 'full_spectrum',
    },
    fridge_storage_temp: 2,
    difficulty: 'Easy' as GrowDifficulty,
    custom_parameters: {
      harvest_method: 'whole_head',
      head_formation_monitoring: 'weekly',
    },
    priority: 'high',
    is_active: true,
    created_at: '2024-01-03T00:00:00.000Z',
    updated_at: '2024-01-03T00:00:00.000Z',
  },
  {
    id: 'recipe-basil-intensive',
    species_id: 'species-basil-1',
    name: 'Sweet Basil Intensive',
    grow_days: 45,
    light_hours_per_day: 16,
    watering_frequency_hours: 6,
    target_temperature_min: 20,
    target_temperature_max: 28,
    target_humidity_min: 55,
    target_humidity_max: 70,
    target_ph_min: 5.8,
    target_ph_max: 6.8,
    target_ec_min: 1.2,
    target_ec_max: 1.8,
    average_yield: 85, // grams fresh weight
    sowing_rate: 75,
    recipe_source: 'Mediterranean Herb Protocol',
    germination_days: 5,
    light_days: 40,
    total_grow_days: 45,
    top_coat: 'perlite',
    pythium_risk: 'medium' as PythiumRisk,
    water_intake: 2.0,
    water_frequency: 'every_6_hours',
    lighting: {
      schedule: 'intensive',
      intensity: 'high',
      spectrum: 'red_heavy',
    },
    fridge_storage_temp: 4,
    difficulty: 'Hard' as GrowDifficulty,
    custom_parameters: {
      harvest_method: 'successive_pinching',
      essential_oil_optimization: true,
      pruning_schedule: 'bi_weekly',
    },
    priority: 'medium',
    is_active: true,
    created_at: '2024-01-04T00:00:00.000Z',
    updated_at: '2024-01-04T00:00:00.000Z',
  },
  {
    id: 'recipe-kale-baby',
    species_id: 'species-kale-1',
    name: 'Baby Kale Harvest',
    grow_days: 25,
    light_hours_per_day: 14,
    watering_frequency_hours: 4,
    target_temperature_min: 12,
    target_temperature_max: 18,
    target_humidity_min: 70,
    target_humidity_max: 85,
    target_ph_min: 6.0,
    target_ph_max: 7.0,
    target_ec_min: 1.5,
    target_ec_max: 2.2,
    average_yield: 120,
    sowing_rate: 80,
    recipe_source: 'Superfood Greens Program',
    germination_days: 3,
    light_days: 22,
    total_grow_days: 25,
    top_coat: 'coconut_coir',
    pythium_risk: 'low' as PythiumRisk,
    water_intake: 3.5,
    water_frequency: 'every_4_hours',
    lighting: {
      schedule: 'standard',
      intensity: 'medium',
      spectrum: 'blue_enhanced',
    },
    fridge_storage_temp: 1,
    difficulty: 'Medium' as GrowDifficulty,
    custom_parameters: {
      harvest_method: 'cut_and_come_again',
      nutrient_density_focus: true,
    },
    priority: 'high',
    is_active: true,
    created_at: '2024-01-05T00:00:00.000Z',
    updated_at: '2024-01-05T00:00:00.000Z',
  },
  {
    id: 'recipe-spinach-standard',
    species_id: 'species-spinach-1',
    name: 'Baby Spinach Standard',
    grow_days: 30,
    light_hours_per_day: 12,
    watering_frequency_hours: 4,
    target_temperature_min: 10,
    target_temperature_max: 16,
    target_humidity_min: 75,
    target_humidity_max: 90,
    target_ph_min: 6.0,
    target_ph_max: 7.5,
    target_ec_min: 1.8,
    target_ec_max: 2.5,
    average_yield: 100,
    sowing_rate: 90,
    recipe_source: 'Cool Season Greens Protocol',
    germination_days: 2,
    light_days: 28,
    total_grow_days: 30,
    top_coat: 'none',
    pythium_risk: 'high' as PythiumRisk,
    water_intake: 4.0,
    water_frequency: 'every_4_hours',
    lighting: {
      schedule: 'extended_photoperiod',
      intensity: 'low',
      spectrum: 'cool_white',
    },
    fridge_storage_temp: 0,
    difficulty: 'Hard' as GrowDifficulty,
    custom_parameters: {
      harvest_method: 'baby_leaf',
      cold_tolerance_training: true,
      disease_monitoring: 'daily',
    },
    priority: 'medium',
    is_active: true,
    created_at: '2024-01-06T00:00:00.000Z',
    updated_at: '2024-01-06T00:00:00.000Z',
  },
];

/**
 * Farm layout fixtures with realistic multi-level growing systems
 */
export const mockFarmFixtures: Farm[] = [
  {
    id: 'farm-alpha-1',
    name: 'Farm Alpha',
    location: 'Building A - Level 1',
    description: 'Primary growing facility with 6-tier vertical systems',
    address: '123 Vertical Farm Drive, AgTech City, AC 12345',
    manager_id: 'user-manager-1',
    total_area: 2000, // square feet
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    rows: [
      {
        id: 'row-alpha-a',
        name: 'Row A',
        farm_id: 'farm-alpha-1',
        position_x: 0,
        position_y: 0,
        width: 20,
        length: 50,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        racks: [
          {
            id: 'rack-alpha-a1',
            name: 'Rack A1',
            row_id: 'row-alpha-a',
            position_x: 0,
            height: 2.5,
            power_capacity: 3000, // watts
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z',
            shelves: Array.from({ length: 6 }, (_, i) => ({
              id: `shelf-alpha-a1-${i + 1}`,
              name: `A1-S${i + 1}`,
              rack_id: 'rack-alpha-a1',
              level: i + 1,
              dimensions: {
                width: 2.4,
                depth: 1.2,
                height: 0.4,
              },
              max_plants: 24,
              lighting_type: 'LED_full_spectrum',
              irrigation_type: 'NFT',
              created_at: '2024-01-01T00:00:00.000Z',
              updated_at: '2024-01-01T00:00:00.000Z',
            })),
          },
          {
            id: 'rack-alpha-a2',
            name: 'Rack A2',
            row_id: 'row-alpha-a',
            position_x: 2.5,
            height: 2.5,
            power_capacity: 3000,
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z',
            shelves: Array.from({ length: 6 }, (_, i) => ({
              id: `shelf-alpha-a2-${i + 1}`,
              name: `A2-S${i + 1}`,
              rack_id: 'rack-alpha-a2',
              level: i + 1,
              dimensions: {
                width: 2.4,
                depth: 1.2,
                height: 0.4,
              },
              max_plants: 24,
              lighting_type: 'LED_full_spectrum',
              irrigation_type: 'NFT',
              created_at: '2024-01-01T00:00:00.000Z',
              updated_at: '2024-01-01T00:00:00.000Z',
            })),
          },
        ],
      },
      {
        id: 'row-alpha-b',
        name: 'Row B',
        farm_id: 'farm-alpha-1',
        position_x: 0,
        position_y: 25,
        width: 20,
        length: 50,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        racks: [
          {
            id: 'rack-alpha-b1',
            name: 'Rack B1',
            row_id: 'row-alpha-b',
            position_x: 0,
            height: 2.5,
            power_capacity: 3000,
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z',
            shelves: Array.from({ length: 6 }, (_, i) => ({
              id: `shelf-alpha-b1-${i + 1}`,
              name: `B1-S${i + 1}`,
              rack_id: 'rack-alpha-b1',
              level: i + 1,
              dimensions: {
                width: 2.4,
                depth: 1.2,
                height: 0.4,
              },
              max_plants: 24,
              lighting_type: 'LED_full_spectrum',
              irrigation_type: 'DWC', // Deep Water Culture
              created_at: '2024-01-01T00:00:00.000Z',
              updated_at: '2024-01-01T00:00:00.000Z',
            })),
          },
        ],
      },
    ],
  },
  {
    id: 'farm-beta-1',
    name: 'Farm Beta',
    location: 'Building B - Research Wing',
    description: 'Research and development facility for testing new varieties',
    address: '456 Innovation Blvd, AgTech City, AC 12346',
    manager_id: 'user-manager-2',
    total_area: 800,
    created_at: '2024-01-02T00:00:00.000Z',
    updated_at: '2024-01-02T00:00:00.000Z',
    rows: [
      {
        id: 'row-beta-r',
        name: 'Research Row',
        farm_id: 'farm-beta-1',
        position_x: 0,
        position_y: 0,
        width: 15,
        length: 30,
        created_at: '2024-01-02T00:00:00.000Z',
        updated_at: '2024-01-02T00:00:00.000Z',
        racks: [
          {
            id: 'rack-beta-r1',
            name: 'Research Rack R1',
            row_id: 'row-beta-r',
            position_x: 0,
            height: 2.0,
            power_capacity: 2000,
            created_at: '2024-01-02T00:00:00.000Z',
            updated_at: '2024-01-02T00:00:00.000Z',
            shelves: Array.from({ length: 4 }, (_, i) => ({
              id: `shelf-beta-r1-${i + 1}`,
              name: `R1-S${i + 1}`,
              rack_id: 'rack-beta-r1',
              level: i + 1,
              dimensions: {
                width: 1.8,
                depth: 1.0,
                height: 0.4,
              },
              max_plants: 16,
              lighting_type: 'LED_adjustable_spectrum',
              irrigation_type: 'aeroponics',
              created_at: '2024-01-02T00:00:00.000Z',
              updated_at: '2024-01-02T00:00:00.000Z',
            })),
          },
        ],
      },
    ],
  },
  {
    id: 'farm-gamma-1',
    name: 'Farm Gamma',
    location: 'Building C - Production Scale',
    description: 'Large-scale commercial production facility',
    address: '789 Scale Drive, AgTech City, AC 12347',
    manager_id: 'user-manager-3',
    total_area: 5000,
    created_at: '2024-01-03T00:00:00.000Z',
    updated_at: '2024-01-03T00:00:00.000Z',
    rows: [
      {
        id: 'row-gamma-1a',
        name: 'Production Row 1A',
        farm_id: 'farm-gamma-1',
        position_x: 0,
        position_y: 0,
        width: 25,
        length: 100,
        created_at: '2024-01-03T00:00:00.000Z',
        updated_at: '2024-01-03T00:00:00.000Z',
        racks: Array.from({ length: 8 }, (_, rackIndex) => ({
          id: `rack-gamma-1a-${rackIndex + 1}`,
          name: `Rack 1A${rackIndex + 1}`,
          row_id: 'row-gamma-1a',
          position_x: rackIndex * 3,
          height: 3.0,
          power_capacity: 4000,
          created_at: '2024-01-03T00:00:00.000Z',
          updated_at: '2024-01-03T00:00:00.000Z',
          shelves: Array.from({ length: 8 }, (_, shelfIndex) => ({
            id: `shelf-gamma-1a-${rackIndex + 1}-${shelfIndex + 1}`,
            name: `1A${rackIndex + 1}-S${shelfIndex + 1}`,
            rack_id: `rack-gamma-1a-${rackIndex + 1}`,
            level: shelfIndex + 1,
            dimensions: {
              width: 3.0,
              depth: 1.5,
              height: 0.35,
            },
            max_plants: 36,
            lighting_type: 'LED_high_efficiency',
            irrigation_type: 'NFT',
            created_at: '2024-01-03T00:00:00.000Z',
            updated_at: '2024-01-03T00:00:00.000Z',
          })),
        })),
      },
    ],
  },
];

/**
 * Grow fixtures representing various stages of grow cycles
 */
export const mockGrowFixtures: GrowWithDetails[] = [
  {
    id: 'grow-active-1',
    name: 'Butterhead Batch A1',
    grow_recipe_id: 'recipe-butterhead-standard',
    shelf_id: 'shelf-alpha-a1-1',
    user_id: 'user-grower-1',
    start_date: '2024-01-15',
    estimated_harvest_date: '2024-02-19',
    status: 'active' as GrowStatus,
    notes: 'First batch of the season, monitoring closely',
    is_active: true,
    yield_actual: null,
    yield_unit: 'grams',
    automation_enabled: true,
    current_stage: 'vegetative',
    progress_percentage: 65,
    created_at: '2024-01-15T00:00:00.000Z',
    updated_at: '2024-02-01T00:00:00.000Z',
    grow_recipe: {
      id: 'recipe-butterhead-standard',
      name: 'Butterhead Standard',
      species_id: 'species-lettuce-1',
      total_grow_days: 35,
      difficulty: 'Easy',
      species: {
        id: 'species-lettuce-1',
        name: 'Butterhead Lettuce',
        image: '🥬',
      },
    },
    shelf: {
      id: 'shelf-alpha-a1-1',
      name: 'A1-S1',
      rack_id: 'rack-alpha-a1',
      rack: {
        id: 'rack-alpha-a1',
        name: 'Rack A1',
        row_id: 'row-alpha-a',
        row: {
          id: 'row-alpha-a',
          name: 'Row A',
          farm_id: 'farm-alpha-1',
          farm: {
            id: 'farm-alpha-1',
            name: 'Farm Alpha',
          },
        },
      },
    },
  },
  {
    id: 'grow-planned-1',
    name: 'Romaine Batch B1',
    grow_recipe_id: 'recipe-romaine-standard',
    shelf_id: 'shelf-alpha-a1-2',
    user_id: 'user-grower-1',
    start_date: '2024-02-05',
    estimated_harvest_date: '2024-03-19',
    status: 'planned' as GrowStatus,
    notes: 'Scheduled to start next week',
    is_active: true,
    yield_actual: null,
    yield_unit: 'grams',
    automation_enabled: true,
    current_stage: 'planning',
    progress_percentage: 0,
    created_at: '2024-01-28T00:00:00.000Z',
    updated_at: '2024-01-28T00:00:00.000Z',
    grow_recipe: {
      id: 'recipe-romaine-standard',
      name: 'Romaine Standard',
      species_id: 'species-lettuce-2',
      total_grow_days: 42,
      difficulty: 'Easy',
      species: {
        id: 'species-lettuce-2',
        name: 'Romaine Lettuce',
        image: '🥬',
      },
    },
    shelf: {
      id: 'shelf-alpha-a1-2',
      name: 'A1-S2',
      rack_id: 'rack-alpha-a1',
      rack: {
        id: 'rack-alpha-a1',
        name: 'Rack A1',
        row_id: 'row-alpha-a',
        row: {
          id: 'row-alpha-a',
          name: 'Row A',
          farm_id: 'farm-alpha-1',
          farm: {
            id: 'farm-alpha-1',
            name: 'Farm Alpha',
          },
        },
      },
    },
  },
  {
    id: 'grow-harvested-1',
    name: 'Basil Batch Research-1',
    grow_recipe_id: 'recipe-basil-intensive',
    shelf_id: 'shelf-beta-r1-1',
    user_id: 'user-researcher-1',
    start_date: '2023-12-01',
    estimated_harvest_date: '2024-01-15',
    actual_harvest_date: '2024-01-12',
    status: 'harvested' as GrowStatus,
    notes: 'Excellent yield and quality, exceeded expectations',
    is_active: false,
    yield_actual: 92,
    yield_unit: 'grams',
    automation_enabled: false,
    current_stage: 'harvested',
    progress_percentage: 100,
    created_at: '2023-12-01T00:00:00.000Z',
    updated_at: '2024-01-12T00:00:00.000Z',
    grow_recipe: {
      id: 'recipe-basil-intensive',
      name: 'Sweet Basil Intensive',
      species_id: 'species-basil-1',
      total_grow_days: 45,
      difficulty: 'Hard',
      species: {
        id: 'species-basil-1',
        name: 'Sweet Basil',
        image: '🌿',
      },
    },
    shelf: {
      id: 'shelf-beta-r1-1',
      name: 'R1-S1',
      rack_id: 'rack-beta-r1',
      rack: {
        id: 'rack-beta-r1',
        name: 'Research Rack R1',
        row_id: 'row-beta-r',
        row: {
          id: 'row-beta-r',
          name: 'Research Row',
          farm_id: 'farm-beta-1',
          farm: {
            id: 'farm-beta-1',
            name: 'Farm Beta',
          },
        },
      },
    },
  },
];

/**
 * Create grow input fixtures for testing grow creation
 */
export const mockCreateGrowInputFixtures: CreateGrowInput[] = [
  {
    name: 'Butterhead Test Batch',
    grow_recipe_id: 'recipe-butterhead-standard',
    shelf_id: 'shelf-alpha-a1-3',
    start_date: '2024-02-10',
    estimated_harvest_date: '2024-03-17',
    notes: 'Test batch for quality control',
    automation_enabled: true,
  },
  {
    name: 'Kale Baby Leaf Trial',
    grow_recipe_id: 'recipe-kale-baby',
    shelf_id: 'shelf-alpha-a1-4',
    start_date: '2024-02-12',
    estimated_harvest_date: '2024-03-09',
    notes: 'Testing baby leaf harvest timing',
    automation_enabled: false,
  },
  {
    name: 'Spinach Cold Weather Test',
    grow_recipe_id: 'recipe-spinach-standard',
    shelf_id: 'shelf-alpha-a2-1',
    start_date: '2024-02-15',
    estimated_harvest_date: '2024-03-17',
    notes: 'Testing cold tolerance in controlled conditions',
    automation_enabled: true,
  },
];

/**
 * Error scenarios for testing error handling
 */
export const mockErrorScenarios = {
  networkError: new Error('Network connection failed'),
  authenticationError: new Error('Authentication required'),
  validationError: new Error('Invalid input data'),
  constraintError: {
    code: '23505',
    message: 'duplicate key value violates unique constraint',
  },
  notFoundError: {
    code: 'PGRST116',
    message: 'The result contains 0 rows',
  },
  serverError: new Error('Internal server error'),
};

/**
 * Performance test datasets
 */
export const generateLargeDatasets = {
  species: (count: number): Species[] =>
    Array.from({ length: count }, (_, i) => ({
      ...mockSpeciesFixtures[0],
      id: `species-perf-${i}`,
      name: `Performance Test Species ${i}`,
    })),

  recipes: (count: number): GrowRecipe[] =>
    Array.from({ length: count }, (_, i) => ({
      ...mockGrowRecipeFixtures[0],
      id: `recipe-perf-${i}`,
      name: `Performance Test Recipe ${i}`,
    })),

  grows: (count: number): GrowWithDetails[] =>
    Array.from({ length: count }, (_, i) => ({
      ...mockGrowFixtures[0],
      id: `grow-perf-${i}`,
      name: `Performance Test Grow ${i}`,
    })),

  shelves: (rackCount: number, shelvesPerRack: number): Shelf[] => {
    const shelves: Shelf[] = [];
    for (let r = 0; r < rackCount; r++) {
      for (let s = 0; s < shelvesPerRack; s++) {
        shelves.push({
          id: `shelf-perf-${r}-${s}`,
          name: `Perf-R${r}-S${s}`,
          rack_id: `rack-perf-${r}`,
          level: s + 1,
          dimensions: {
            width: 2.4,
            depth: 1.2,
            height: 0.4,
          },
          max_plants: 24,
          lighting_type: 'LED_full_spectrum',
          irrigation_type: 'NFT',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        });
      }
    }
    return shelves;
  },
};

/**
 * Utility functions for test data manipulation
 */
export const testDataUtils = {
  /**
   * Get a species by category
   */
  getSpeciesByCategory: (category: string): Species[] =>
    mockSpeciesFixtures.filter(species => species.category === category),

  /**
   * Get recipes by difficulty
   */
  getRecipesByDifficulty: (difficulty: GrowDifficulty): GrowRecipe[] =>
    mockGrowRecipeFixtures.filter(recipe => recipe.difficulty === difficulty),

  /**
   * Get grows by status
   */
  getGrowsByStatus: (status: GrowStatus): GrowWithDetails[] =>
    mockGrowFixtures.filter(grow => grow.status === status),

  /**
   * Create a complete farm with specified shelf count
   */
  createFarmWithShelves: (farmId: string, shelfCount: number): Farm => {
    const baseShelf = mockFarmFixtures[0].rows![0].racks![0].shelves![0];
    const shelves = Array.from({ length: shelfCount }, (_, i) => ({
      ...baseShelf,
      id: `${farmId}-shelf-${i}`,
      name: `S${i + 1}`,
    }));

    return {
      ...mockFarmFixtures[0],
      id: farmId,
      rows: [
        {
          ...mockFarmFixtures[0].rows![0],
          id: `${farmId}-row-1`,
          racks: [
            {
              ...mockFarmFixtures[0].rows![0].racks![0],
              id: `${farmId}-rack-1`,
              shelves,
            },
          ],
        },
      ],
    };
  },

  /**
   * Generate realistic timestamps for testing
   */
  generateTimestamps: (baseDate: string, count: number, intervalHours: number) => {
    const base = new Date(baseDate);
    return Array.from({ length: count }, (_, i) => {
      const date = new Date(base.getTime() + i * intervalHours * 60 * 60 * 1000);
      return date.toISOString();
    });
  },
};

const databaseFixtures = {
  species: mockSpeciesFixtures,
  recipes: mockGrowRecipeFixtures,
  farms: mockFarmFixtures,
  grows: mockGrowFixtures,
  createGrowInputs: mockCreateGrowInputFixtures,
  errors: mockErrorScenarios,
  generateLarge: generateLargeDatasets,
  utils: testDataUtils,
};

export default databaseFixtures;