import {
  type CreateLocationRequest,
  type Location,
  suggestLocationIcon,
  type UpdateLocationRequest,
} from "@location-manager/shared";
import { and, asc, eq } from "drizzle-orm";
import type { Db } from "../db";
import { locations } from "../db/schema";
import { AppError } from "../errors";

const locationColumns = {
  id: locations.id,
  name: locations.name,
  latitude: locations.latitude,
  longitude: locations.longitude,
  icon: locations.icon,
  createdAt: locations.createdAt,
};

// Each row binds 5 parameters; PostgreSQL allows 65535 per statement.
const INSERT_BATCH_SIZE = 1000;

type StoredLocation = Omit<Location, "createdAt"> & { createdAt: Date };

function toLocation(stored: StoredLocation): Location {
  return { ...stored, createdAt: stored.createdAt.toISOString() };
}

function newRow(userId: string, input: CreateLocationRequest) {
  return { ...input, icon: input.icon ?? suggestLocationIcon(input.name), userId };
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
    .values(newRow(userId, input))
    .returning(locationColumns);

  if (!row) throw new Error("Location insert returned no row");

  return toLocation(row);
}

/** What identifies a place for import: the same name at the same coordinates. */
function duplicateKey({ name, latitude, longitude }: Pick<CreateLocationRequest, "name" | "latitude" | "longitude">) {
  return JSON.stringify([name, latitude, longitude]);
}

export interface CreatedLocations {
  created: Location[];
  /** Inputs left out as duplicates of an existing place, or of an earlier input. */
  skipped: number;
}

/**
 * Saves the locations in one transaction: either every new one is saved or none is. An input that matches a
 * place the user already has (or an earlier input) is skipped, so importing a file twice adds nothing.
 */
export async function createLocations(
  db: Db,
  userId: string,
  inputs: CreateLocationRequest[],
): Promise<CreatedLocations> {
  return db.transaction(async (tx) => {
    const existing = await tx
      .select({ name: locations.name, latitude: locations.latitude, longitude: locations.longitude })
      .from(locations)
      .where(eq(locations.userId, userId));

    const known = new Set(existing.map(duplicateKey));

    const fresh = inputs.filter((input) => {
      const key = duplicateKey(input);

      if (known.has(key)) return false;

      known.add(key);

      return true;
    });

    const created: Location[] = [];

    for (let start = 0; start < fresh.length; start += INSERT_BATCH_SIZE) {
      const batch = fresh.slice(start, start + INSERT_BATCH_SIZE).map((input) => newRow(userId, input));
      const rows = await tx.insert(locations).values(batch).returning(locationColumns);
      created.push(...rows.map(toLocation));
    }

    return { created, skipped: inputs.length - fresh.length };
  });
}

/** Updates the given fields of one of the user's locations. Throws NOT_FOUND if it doesn't exist or belongs to someone else. */
export async function updateLocation(
  db: Db,
  userId: string,
  id: string,
  changes: UpdateLocationRequest,
): Promise<Location> {
  const [row] = await db
    .update(locations)
    .set(changes)
    .where(and(eq(locations.id, id), eq(locations.userId, userId)))
    .returning(locationColumns);

  if (!row) throw new AppError("NOT_FOUND", "Location not found");

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
