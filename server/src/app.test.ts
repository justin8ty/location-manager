import { apiErrorResponseSchema } from "@location-manager/shared";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createTestApp } from "../test/app";

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
