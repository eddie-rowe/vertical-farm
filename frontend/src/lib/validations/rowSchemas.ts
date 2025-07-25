import { z } from "zod";

export const RowSchema = z.object({
  id: z.string().uuid().optional(),
  farm_id: z.string(),
  name: z.string().min(2, "Row name must be at least 2 characters.").max(50),
  position_x: z.number().optional(),
  position_y: z.number().optional(),
  length: z.number().positive("Length must be a positive number.").optional(),
  orientation: z.enum(["horizontal", "vertical"]),
});

export type RowFormData = z.infer<typeof RowSchema>;
