import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Enter a valid email address" }));

export const registerRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const userSchema = z.object({
  id: z.uuid(),
  email: z.string(),
});

export type User = z.infer<typeof userSchema>;

export const userResponseSchema = z.object({ user: userSchema });

export type UserResponse = z.infer<typeof userResponseSchema>;
