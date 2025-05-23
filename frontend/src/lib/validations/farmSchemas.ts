import { z } from 'zod';

export const FarmSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3, "Farm name must be at least 3 characters long.").max(50, "Farm name must be at most 50 characters long."),
  location: z.string().min(3, "Location must be at least 3 characters long.").max(100, "Location must be at most 100 characters long.").optional(),
  plan_image_url: z.string().url("Must be a valid URL.").optional().nullable(),
  width: z.number().positive("Width must be a positive number.").optional().nullable(),
  depth: z.number().positive("Depth must be a positive number.").optional().nullable(),
});

export type FarmFormData = z.infer<typeof FarmSchema>; 