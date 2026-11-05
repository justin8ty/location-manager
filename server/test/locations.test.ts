import {
  apiErrorResponseSchema,
  type CreateLocationRequest,
  locationResponseSchema,
  locationsResponseSchema,
  userResponseSchema,
} from "@location-manager/shared";
import request, { type Agent, type Response } from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestApp, signedInAgent } from "./app";
import { resetDb } from "./db";

const klcc: CreateLocationRequest = { name: "Suria KLCC", latitude: 3.157324409, longitude: 101.7121981 };
const zooNegara: CreateLocationRequest = { name: "Zoo Negara", latitude: 3.2105416, longitude: 101.75920504 };

function errorOf(res: Response) {
  return apiErrorResponseSchema.parse(res.body).error;
}

async function addLocation(agent: Agent, input: CreateLocationRequest) {
  const res = await agent.post("/api/locations").send(input);
  expect(res.status).toBe(201);

  return locationResponseSchema.parse(res.body).location;
}

async function listLocations(agent: Agent) {
  const res = await agent.get("/api/locations");
  expect(res.status).toBe(200);

  return locationsResponseSchema.parse(res.body).locations;
}

beforeEach(resetDb);

describe("locations API", () => {
  it("requires a session on every route", async () => {
    const app = createTestApp();

    const responses = await Promise.all([
      request(app).get("/api/locations"),
      request(app).post("/api/locations").send(klcc),
      request(app).delete("/api/locations/00000000-0000-4000-8000-000000000000"),
    ]);

    for (const res of responses) {
      expect(res.status).toBe(401);
      expect(errorOf(res).code).toBe("UNAUTHENTICATED");
    }
  });

  it("creates a location with a trimmed name and lists it", async () => {
    const alice = await signedInAgent("alice@example.com");

    const created = await addLocation(alice, { ...klcc, name: "  Suria KLCC  " });

    expect(created).toEqual({ id: expect.any(String), ...klcc, createdAt: expect.any(String) });
    expect(await listLocations(alice)).toEqual([created]);
  });

  it.each([
    { problem: "a blank name", input: { ...klcc, name: "   " } },
    { problem: "a name over 100 characters", input: { ...klcc, name: "x".repeat(101) } },
    { problem: "a latitude above 90", input: { ...klcc, latitude: 90.1 } },
    { problem: "a longitude below -180", input: { ...klcc, longitude: -180.1 } },
    { problem: "a numeric string coordinate", input: { ...klcc, latitude: "3.15" } },
    { problem: "a missing coordinate", input: { name: klcc.name, latitude: klcc.latitude } },
  ])("rejects $problem", async ({ input }) => {
    const alice = await signedInAgent("alice@example.com");

    const res = await alice.post("/api/locations").send(input);

    expect(res.status).toBe(400);
    expect(errorOf(res).code).toBe("VALIDATION_ERROR");
  });

  it("deletes a location", async () => {
    const alice = await signedInAgent("alice@example.com");
    const doomed = await addLocation(alice, klcc);
    const kept = await addLocation(alice, zooNegara);

    const res = await alice.delete(`/api/locations/${doomed.id}`);

    expect(res.status).toBe(204);
    expect(await listLocations(alice)).toEqual([kept]);

    const again = await alice.delete(`/api/locations/${doomed.id}`);
    expect(again.status).toBe(404);
    expect(errorOf(again).code).toBe("NOT_FOUND");
  });

  it("treats a malformed location id as not found", async () => {
    const alice = await signedInAgent("alice@example.com");

    const res = await alice.delete("/api/locations/not-a-uuid");

    expect(res.status).toBe(404);
    expect(errorOf(res).code).toBe("NOT_FOUND");
  });
});

describe("per-user scoping", () => {
  it("hides one user's locations from another", async () => {
    const alice = await signedInAgent("alice@example.com");
    const bob = await signedInAgent("bob@example.com");
    const alicesLocation = await addLocation(alice, klcc);
    const bobsLocation = await addLocation(bob, zooNegara);

    expect(await listLocations(alice)).toEqual([alicesLocation]);
    expect(await listLocations(bob)).toEqual([bobsLocation]);
  });

  it("ignores a userId in the request body", async () => {
    const alice = await signedInAgent("alice@example.com");
    const bob = await signedInAgent("bob@example.com");
    const aliceId = userResponseSchema.parse((await alice.get("/api/auth/me")).body).user.id;

    const res = await bob.post("/api/locations").send({ ...klcc, userId: aliceId });
    expect(res.status).toBe(201);

    const bobsLocation = locationResponseSchema.parse(res.body).location;

    expect(await listLocations(bob)).toEqual([bobsLocation]);
    expect(await listLocations(alice)).toEqual([]);
  });

  it("answers 404 when deleting another user's location and keeps it", async () => {
    const alice = await signedInAgent("alice@example.com");
    const bob = await signedInAgent("bob@example.com");
    const alicesLocation = await addLocation(alice, klcc);

    const res = await bob.delete(`/api/locations/${alicesLocation.id}`);

    expect(res.status).toBe(404);
    expect(errorOf(res).code).toBe("NOT_FOUND");
    expect(await listLocations(alice)).toEqual([alicesLocation]);
  });
});
