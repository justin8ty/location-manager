import { z } from "zod";

const testEnvSchema = z
  .object({
    DATABASE_URL: z.url().optional(),
    TEST_DATABASE_URL: z.url(),
  })
  .refine((env) => env.TEST_DATABASE_URL !== env.DATABASE_URL, {
    message: "TEST_DATABASE_URL must differ from DATABASE_URL: tests truncate its tables",
    path: ["TEST_DATABASE_URL"],
  });

const result = testEnvSchema.safeParse(process.env);

if (!result.success) {
  throw new Error(`Invalid test environment:\n${z.prettifyError(result.error)}`);
}

export const testDatabaseUrl = result.data.TEST_DATABASE_URL;
