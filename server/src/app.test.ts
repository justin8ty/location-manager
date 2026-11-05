import { healthResponseSchema } from "@location-manager/shared";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app";

describe("GET /api/health", () => {
  it("returns ok", async () => {
    const res = await request(createApp()).get("/api/health");
    expect(res.status).toBe(200);
    expect(healthResponseSchema.parse(res.body)).toEqual({ ok: true });
  });
});
