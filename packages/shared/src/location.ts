import { z } from "zod";

export const locationNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(100, "Name must be at most 100 characters");

export const latitudeSchema = z
  .number({ error: "Latitude must be a number" })
  .min(-90, "Latitude must be between -90 and 90")
  .max(90, "Latitude must be between -90 and 90");

export const longitudeSchema = z
  .number({ error: "Longitude must be a number" })
  .min(-180, "Longitude must be between -180 and 180")
  .max(180, "Longitude must be between -180 and 180");

export const createLocationRequestSchema = z.object({
  name: locationNameSchema,
  latitude: latitudeSchema,
  longitude: longitudeSchema,
});

export type CreateLocationRequest = z.infer<typeof createLocationRequestSchema>;

export const updateLocationRequestSchema = createLocationRequestSchema
  .partial()
  .refine(
    (update) => update.name !== undefined || update.latitude !== undefined || update.longitude !== undefined,
    "Provide at least one of name, latitude or longitude",
  );

export type UpdateLocationRequest = z.infer<typeof updateLocationRequestSchema>;

export const locationSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  createdAt: z.iso.datetime(),
});

export type Location = z.infer<typeof locationSchema>;

export const locationResponseSchema = z.object({ location: locationSchema });

export type LocationResponse = z.infer<typeof locationResponseSchema>;

export const locationsResponseSchema = z.object({ locations: z.array(locationSchema) });

export type LocationsResponse = z.infer<typeof locationsResponseSchema>;

export const uploadResponseSchema = z.object({
  count: z.number().int(),
  locations: z.array(locationSchema),
});

export type UploadResponse = z.infer<typeof uploadResponseSchema>;
