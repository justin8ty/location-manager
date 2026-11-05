import { sql } from "drizzle-orm";
import { createDb } from "../src/db";
import { locations, users } from "../src/db/schema";
import { testDatabaseUrl } from "./env";

export const testDb = createDb(testDatabaseUrl);

/** Empties every table; call from `beforeEach` in integration tests. */
export async function resetDb() {
  await testDb.execute(sql`TRUNCATE ${users}, ${locations} CASCADE`);
}
