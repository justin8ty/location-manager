import { z } from "zod";
import { locationIconSchema } from "./location-icon";

export const locationNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(100, "Name must be at most 100 characters");

export const latitudeSchema = z
  .number({ error: (issue) => (issue.input === undefined ? "Latitude is required" : "Latitude must be a number") })
  .min(-90, "Latitude must be between -90 and 90")
  .max(90, "Latitude must be between -90 and 90");

export const longitudeSchema = z
  .number({ error: (issue) => (issue.input === undefined ? "Longitude is required" : "Longitude must be a number") })
  .min(-180, "Longitude must be between -180 and 180")
  .max(180, "Longitude must be between -180 and 180");

/** Without an icon, the server suggests one from the name. */
export const createLocationRequestSchema = z.object({
  name: locationNameSchema,
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  icon: locationIconSchema.optional(),
});

export type CreateLocationRequest = z.infer<typeof createLocationRequestSchema>;

export const updateLocationRequestSchema = createLocationRequestSchema
  .partial()
  .refine(
    (update) =>
      update.name !== undefined ||
      update.latitude !== undefined ||
      update.longitude !== undefined ||
      update.icon !== undefined,
    "Provide at least one of name, latitude, longitude or icon",
  );

export type UpdateLocationRequest = z.infer<typeof updateLocationRequestSchema>;

export const locationSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  icon: locationIconSchema,
  createdAt: z.iso.datetime(),
});

export type Location = z.infer<typeof locationSchema>;

export const locationResponseSchema = z.object({ location: locationSchema });

export type LocationResponse = z.infer<typeof locationResponseSchema>;

export const locationsResponseSchema = z.object({ locations: z.array(locationSchema) });

export type LocationsResponse = z.infer<typeof locationsResponseSchema>;

export const uploadResponseSchema = z.object({
  /** How many places were added. */
  count: z.number().int(),
  /** Rows left out because the user already had a place with the same name and coordinates. */
  skipped: z.number().int(),
  locations: z.array(locationSchema),
});

export type UploadResponse = z.infer<typeof uploadResponseSchema>;
