import { z } from "zod";

export const RackSchema = z.object({
  id: z.string().uuid().optional(),
  row_id: z.string(),
  name: z.string().min(2, "Rack name must be at least 2 characters.").max(50),
  position_in_row: z
    .number()
    .int()
    .positive("Position must be a positive integer.")
    .optional(),
  width: z.number().positive("Width must be positive.").optional(),
  depth: z.number().positive("Depth must be positive.").optional(),
  height: z.number().positive("Height must be positive.").optional(),
  max_shelves: z
    .number()
    .int()
    .positive("Max shelves must be a positive integer.")
    .optional()
    .nullable(),
});

export type RackFormData = z.infer<typeof RackSchema>;
