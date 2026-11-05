import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createDb } from "../src/db";
import { testDatabaseUrl } from "./env";

/** Applies the Drizzle migrations to the test database once per `vitest run`. */
export default async function setup() {
  const db = createDb(testDatabaseUrl);

  try {
    await migrate(db, { migrationsFolder: fileURLToPath(new URL("../drizzle", import.meta.url)) });
  } catch (cause) {
    throw new Error("Failed to migrate the test database. Is Postgres running? (docker compose up -d db)", {
      cause,
    });
  } finally {
    await db.$client.end();
  }
}
