import type { LoginRequest, RegisterRequest, User } from "@location-manager/shared";
import argon2 from "argon2";
import { eq } from "drizzle-orm";
import type { Db } from "../db";
import { users } from "../db/schema";
import { AppError } from "../errors";

const userColumns = { id: users.id, email: users.email };

// Verified against when the email is unknown, so login takes the same time either way.
const dummyHash = argon2.hash("dummy-password-for-timing", { type: argon2.argon2id });

/** Creates a user with an argon2id password hash. Throws EMAIL_TAKEN if the email is registered. */
export async function registerUser(db: Db, input: RegisterRequest): Promise<User> {
  const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });

  const [user] = await db
    .insert(users)
    .values({ email: input.email, passwordHash })
    .onConflictDoNothing({ target: users.email })
    .returning(userColumns);

  if (!user) throw new AppError("EMAIL_TAKEN", "An account with this email already exists");

  return user;
}

/** Returns the user whose credentials match. Throws INVALID_CREDENTIALS otherwise. */
export async function authenticateUser(db: Db, input: LoginRequest): Promise<User> {
  const [row] = await db
    .select({ ...userColumns, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, input.email));

  const passwordMatches = await argon2.verify(row?.passwordHash ?? (await dummyHash), input.password);

  if (!row || !passwordMatches) throw new AppError("INVALID_CREDENTIALS", "Invalid email or password");

  return { id: row.id, email: row.email };
}

export async function findUser(db: Db, id: string): Promise<User | null> {
  const [user] = await db.select(userColumns).from(users).where(eq(users.id, id));

  return user ?? null;
}
