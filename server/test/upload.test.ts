import { readFileSync } from "node:fs";
import {
  apiErrorResponseSchema,
  type Location,
  locationsResponseSchema,
  uploadResponseSchema,
} from "@location-manager/shared";
import { strToU8, zipSync } from "fflate";
import type { Agent, Response } from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { signedInAgent } from "./app";
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
  it("saves every location in the sample ZIP for the uploader only", async () => {
    const alice = await signedInAgent("alice@example.com");
    const bob = await signedInAgent("bob@example.com");

    const res = await upload(alice, sampleZip);

    expect(res.status).toBe(201);

    const body = uploadResponseSchema.parse(res.body);
    expect(body.count).toBe(10);
    expect(body.skipped).toBe(0);
    expect(body.locations[0]).toMatchObject({
      name: "Suria KLCC",
      latitude: 3.157324409,
      longitude: 101.7121981,
      icon: "shop",
    });
    expect(idsOf(await listLocations(alice))).toEqual(idsOf(body.locations));
    expect(await listLocations(bob)).toEqual([]);
  });

  it("skips places the user already has, so importing the same file twice adds nothing", async () => {
    const alice = await signedInAgent("alice@example.com");
    const bob = await signedInAgent("bob@example.com");
    await upload(alice, sampleZip);

    const again = await upload(alice, sampleZip);

    expect(again.status).toBe(201);
    expect(uploadResponseSchema.parse(again.body)).toMatchObject({ count: 0, skipped: 10, locations: [] });
    expect(await listLocations(alice)).toHaveLength(10);

    // Another user's places are theirs alone.
    expect(uploadResponseSchema.parse((await upload(bob, sampleZip)).body).count).toBe(10);
  });

  it("skips repeats within a file, but keeps the same name at different coordinates", async () => {
    const alice = await signedInAgent("alice@example.com");
    await upload(alice, zipOf("Cafe,3.1,101.7\n"));

    const rows = ["Cafe,3.1,101.7", "Cafe,3.2,101.7", "Shop,3.3,101.7", "Shop,3.3,101.7"];
    const res = await upload(alice, zipOf(rows.join("\n")));

    const body = uploadResponseSchema.parse(res.body);
    expect(body.count).toBe(2);
    expect(body.skipped).toBe(2);
    expect(body.locations.map((location) => [location.name, location.latitude])).toEqual([
      ["Cafe", 3.2],
      ["Shop", 3.3],
    ]);
    expect(await listLocations(alice)).toHaveLength(3);
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
});
