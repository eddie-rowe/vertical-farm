import { z } from "zod";

export const ShelfSchema = z.object({
  id: z.string().uuid().optional(),
  rack_id: z.string(),
  name: z.string().min(2, "Shelf name must be at least 2 characters.").max(50),
  position_in_rack: z
    .number()
    .int()
    .positive("Position must be a positive integer.")
    .optional(),
  width: z.number().positive("Width must be positive.").optional(),
  depth: z.number().positive("Depth must be positive.").optional(),
  max_weight: z
    .number()
    .positive("Max weight must be a positive number.")
    .optional()
    .nullable(),
});

// Placeholder for cross-field validation (e.g., shelf width <= rack width)
// This would typically be handled by a .superRefine() or at the form/service level
// export const ValidatedShelfSchema = ShelfSchema.superRefine((data, ctx) => {
//   // if (data.width > data.parentRackWidth) { // Assuming parentRackWidth is available
//   //   ctx.addIssue({
//   //     code: z.ZodIssueCode.custom,
//   //     message: "Shelf width cannot exceed rack width.",
//   //     path: ["width"],
//   //   });
//   // }
// });

export type ShelfFormData = z.infer<typeof ShelfSchema>;
