import {
  createLocationRequestSchema,
  type LocationResponse,
  type LocationsResponse,
  type UploadResponse,
  updateLocationRequestSchema,
} from "@location-manager/shared";
import { type Request, Router } from "express";
import { z } from "zod";
import type { Db } from "../db";
import { AppError } from "../errors";
import { authenticatedUserId, requireAuth } from "../middleware/require-auth";
import { receiveZip, uploadedZip } from "../middleware/zip-upload";
import { createLocation, createLocations, deleteLocation, listLocations, updateLocation } from "../services/locations";
import type { Sessions } from "../services/session";
import { extractTextFile } from "../services/upload/extract-text-file";
import { parseLocationsText } from "../services/upload/parse-locations";
import { parseBody } from "../validation";

const locationIdSchema = z.uuid();

/** A malformed id can't name an existing location, so it is NOT_FOUND rather than a validation error. */
function locationIdParam(req: Request): string {
  const id = locationIdSchema.safeParse(req.params.id);

  if (!id.success) throw new AppError("NOT_FOUND", "Location not found");

  return id.data;
}

export function createLocationsRouter(db: Db, sessions: Sessions) {
  const router = Router();
  router.use(requireAuth(sessions));

  router.get("/", async (req, res) => {
    const body: LocationsResponse = { locations: await listLocations(db, authenticatedUserId(req)) };
    res.json(body);
  });

  router.post("/", async (req, res) => {
    const input = parseBody(req, createLocationRequestSchema);
    const body: LocationResponse = { location: await createLocation(db, authenticatedUserId(req), input) };
    res.status(201).json(body);
  });

  router.post("/upload", receiveZip, async (req, res) => {
    const inputs = parseLocationsText(extractTextFile(uploadedZip(req)));
    const locations = await createLocations(db, authenticatedUserId(req), inputs);
    const body: UploadResponse = { count: locations.length, locations };
    res.status(201).json(body);
  });

  router.patch("/:id", async (req, res) => {
    const id = locationIdParam(req);
    const changes = parseBody(req, updateLocationRequestSchema);
    const body: LocationResponse = { location: await updateLocation(db, authenticatedUserId(req), id, changes) };
    res.json(body);
  });

  router.delete("/:id", async (req, res) => {
    await deleteLocation(db, authenticatedUserId(req), locationIdParam(req));
    res.status(204).end();
  });

  return router;
}
