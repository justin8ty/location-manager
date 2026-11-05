import { readFileSync } from "node:fs";
import {
  apiErrorResponseSchema,
  type Location,
  locationsResponseSchema,
  uploadResponseSchema,
} from "@location-manager/shared";
import { strToU8, zipSync } from "fflate";
import request, { type Agent, type Response } from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestApp, signedInAgent } from "./app";
import { resetDb } from "./db";

const sampleZip = readFileSync(new URL("../../samples/locations.zip", import.meta.url));

function zipOf(text: string) {
  return Buffer.from(zipSync({ "locations.txt": strToU8(text) }));
}

function upload(agent: Agent, file: Buffer, fileName = "locations.zip") {
  return agent.post("/api/locations/upload").attach("file", file, fileName);
}

function errorOf(res: Response) {
  return apiErrorResponseSchema.parse(res.body).error;
}

async function listLocations(agent: Agent) {
  const res = await agent.get("/api/locations");
  expect(res.status).toBe(200);

  return locationsResponseSchema.parse(res.body).locations;
}

// Rows saved in one transaction share a createdAt, so their listed order is arbitrary.
function idsOf(locations: Location[]) {
  return locations.map((location) => location.id).toSorted();
}

beforeEach(resetDb);

describe("POST /api/locations/upload", () => {
  it("requires a session", async () => {
    const res = await request(createTestApp()).post("/api/locations/upload").attach("file", sampleZip, "locations.zip");

    expect(res.status).toBe(401);
    expect(errorOf(res).code).toBe("UNAUTHENTICATED");
  });

  it("saves every location in the sample ZIP for the uploader only", async () => {
    const alice = await signedInAgent("alice@example.com");
    const bob = await signedInAgent("bob@example.com");

    const res = await upload(alice, sampleZip);

    expect(res.status).toBe(201);

    const body = uploadResponseSchema.parse(res.body);
    expect(body.count).toBe(7);
    expect(body.locations[0]).toMatchObject({ name: "Suria KLCC", latitude: 3.157324409, longitude: 101.7121981 });
    expect(idsOf(await listLocations(alice))).toEqual(idsOf(body.locations));
    expect(await listLocations(bob)).toEqual([]);
  });

  it("saves more rows than PostgreSQL can bind in one statement", async () => {
    const alice = await signedInAgent("alice@example.com");
    const rowCount = 20_000;
    const rows = Array.from({ length: rowCount }, (_, i) => `Place ${i},${(i % 180) - 89},${(i % 360) - 179}`);

    const res = await upload(alice, zipOf(rows.join("\n")));

    expect(res.status).toBe(201);
    expect(uploadResponseSchema.parse(res.body).count).toBe(rowCount);
    expect(await listLocations(alice)).toHaveLength(rowCount);
  });

  it("saves nothing when any row is invalid", async () => {
    const alice = await signedInAgent("alice@example.com");

    const res = await upload(alice, zipOf("Name,Latitude,Longitude\nSuria KLCC,3.157,101.712\nNowhere,300,101\n"));

    expect(res.status).toBe(400);

    expect(errorOf(res).code).toBe("INVALID_ROWS");
    expect(await listLocations(alice)).toEqual([]);
  });

  it("requires a file", async () => {
    const alice = await signedInAgent("alice@example.com");

    const res = await alice.post("/api/locations/upload");

    expect(res.status).toBe(400);
    expect(errorOf(res).code).toBe("FILE_REQUIRED");
  });

  it("rejects a file not named .zip, even with ZIP contents", async () => {
    const alice = await signedInAgent("alice@example.com");

    const res = await upload(alice, sampleZip, "locations.txt");

    expect(res.status).toBe(400);
    expect(errorOf(res).code).toBe("NOT_ZIP");
  });

  it("rejects a ZIP over 5 MB", async () => {
    const alice = await signedInAgent("alice@example.com");

    const res = await upload(alice, Buffer.alloc(5 * 1024 * 1024 + 1));

    expect(res.status).toBe(413);
    expect(errorOf(res).code).toBe("FILE_TOO_LARGE");
  });

  it("rejects a file sent in another field", async () => {
    const alice = await signedInAgent("alice@example.com");

    const res = await alice.post("/api/locations/upload").attach("upload", sampleZip, "locations.zip");

    expect(res.status).toBe(400);
    expect(errorOf(res).code).toBe("VALIDATION_ERROR");
  });
});
