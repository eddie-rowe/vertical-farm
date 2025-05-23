import { z } from 'zod';

export const SensorDeviceSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "Sensor name must be at least 2 characters.").max(50),
  model_number: z.string().optional().nullable(),
  sensor_type: z.enum([
    'temperature',
    'humidity',
    'co2',
    'ph',
    'ec', // Electrical Conductivity
    'water_level',
    'light_intensity',
    'air_flow',
    'soil_moisture', // If applicable
  ]),
  measurement_unit: z.string().optional().nullable(), // Could be refined based on sensor_type with superRefine
  data_range_min: z.number().optional().nullable(),
  data_range_max: z.number().optional().nullable(),
  accuracy: z.string().optional().nullable(),
  parent_type: z.enum(['shelf', 'rack', 'row', 'farm']), // Sensors can be in various places
  parent_id: z.string().uuid(),
  position_x: z.number().optional().nullable(),
  position_y: z.number().optional().nullable(),
  position_z: z.number().optional().nullable(),
}).refine(data => {
  if (typeof data.data_range_min === 'number' && typeof data.data_range_max === 'number') {
    return data.data_range_max >= data.data_range_min;
  }
  return true; // Pass if one or both are not numbers (or null/undefined)
}, {
  message: "Max data range must be greater than or equal to min data range when both are specified",
  path: ["data_range_max"],
});

export type SensorDeviceFormData = z.infer<typeof SensorDeviceSchema>; 