import { apiErrorResponseSchema, healthResponseSchema } from "@location-manager/shared";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createTestApp } from "../test/app";

describe("GET /api/health", () => {
  it("returns ok", async () => {
    const res = await request(createTestApp()).get("/api/health");
    expect(res.status).toBe(200);
    expect(healthResponseSchema.parse(res.body)).toEqual({ ok: true });
  });
});

describe("error responses", () => {
  it("returns NOT_FOUND for unknown routes", async () => {
    const res = await request(createTestApp()).get("/api/nope");
    expect(res.status).toBe(404);
    expect(apiErrorResponseSchema.parse(res.body).error.code).toBe("NOT_FOUND");
  });

  it("returns VALIDATION_ERROR for malformed JSON", async () => {
    const res = await request(createTestApp())
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send("{ not json");

    expect(res.status).toBe(400);
    expect(apiErrorResponseSchema.parse(res.body).error.code).toBe("VALIDATION_ERROR");
  });
});
