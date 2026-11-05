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

// Each row binds 4 parameters; PostgreSQL allows 65535 per statement.
const INSERT_BATCH_SIZE = 1000;

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

/** Saves all the locations in one transaction: either every one is saved or none is. */
export async function createLocations(
  db: Db,
  userId: string,
  inputs: CreateLocationRequest[],
): Promise<Location[]> {
  return db.transaction(async (tx) => {
    const created: Location[] = [];

    for (let start = 0; start < inputs.length; start += INSERT_BATCH_SIZE) {
      const batch = inputs.slice(start, start + INSERT_BATCH_SIZE).map((input) => ({ ...input, userId }));
      const rows = await tx.insert(locations).values(batch).returning(locationColumns);
      created.push(...rows.map(toLocation));
    }

    return created;
  });
}

/** Deletes one of the user's locations. Throws NOT_FOUND if it doesn't exist or belongs to someone else. */
export async function deleteLocation(db: Db, userId: string, id: string): Promise<void> {
  const deleted = await db
    .delete(locations)
    .where(and(eq(locations.id, id), eq(locations.userId, userId)))
    .returning({ id: locations.id });

  if (deleted.length === 0) throw new AppError("NOT_FOUND", "Location not found");
}
