import { z } from "zod";

export const FanSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "Fan name must be at least 2 characters.").max(50),
  model_number: z.string().optional().nullable(),
  type: z.enum(["circulation", "exhaust", "intake"]).optional().nullable(), // Added 'intake' as a common type
  size_cm: z.number().positive("Size must be positive.").optional().nullable(),
  airflow_cfm: z
    .number()
    .positive("Airflow must be positive.")
    .optional()
    .nullable(),
  power_watts: z
    .number()
    .positive("Power must be positive.")
    .optional()
    .nullable(),
  parent_type: z.enum(["rack", "row"]),
  parent_id: z.string().uuid(),
  position_x: z.number().optional().nullable(),
  position_y: z.number().optional().nullable(),
  position_z: z.number().optional().nullable(),
  orientation: z
    .enum(["up", "down", "front", "back", "left", "right"])
    .optional()
    .nullable(),
});

export type FanFormData = z.infer<typeof FanSchema>;
