import type { CreateLocationRequest, Location } from "@location-manager/shared";
import { and, asc, eq } from "drizzle-orm";
import type { Db } from "../db";
import { locations } from "../db/schema";
import { AppError } from "../errors";

const locationColumns = {
  id: locations.id,
  name: locations.name,
  latitude: locations.latitude,
  longitude: locations.longitude,
  createdAt: locations.createdAt,
};

type StoredLocation = Omit<Location, "createdAt"> & { createdAt: Date };

function toLocation(stored: StoredLocation): Location {
  return { ...stored, createdAt: stored.createdAt.toISOString() };
}

/** The user's locations, oldest first. */
export async function listLocations(db: Db, userId: string): Promise<Location[]> {
  const rows = await db
    .select(locationColumns)
    .from(locations)
    .where(eq(locations.userId, userId))
    .orderBy(asc(locations.createdAt));

  return rows.map(toLocation);
}

export async function createLocation(db: Db, userId: string, input: CreateLocationRequest): Promise<Location> {
  const [row] = await db
    .insert(locations)
    .values({ ...input, userId })
    .returning(locationColumns);

  if (!row) throw new Error("Location insert returned no row");

  return toLocation(row);
}

/** Deletes one of the user's locations. Throws NOT_FOUND if it doesn't exist or belongs to someone else. */
export async function deleteLocation(db: Db, userId: string, id: string): Promise<void> {
  const deleted = await db
    .delete(locations)
    .where(and(eq(locations.id, id), eq(locations.userId, userId)))
    .returning({ id: locations.id });

  if (deleted.length === 0) throw new AppError("NOT_FOUND", "Location not found");
}
