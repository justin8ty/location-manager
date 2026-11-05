import {
  type CreateLocationRequest,
  createLocationRequestSchema,
  type Location,
  latitudeSchema,
  longitudeSchema,
  type UpdateLocationRequest,
} from "@location-manager/shared";
import type { LatLngTuple } from "leaflet";
import { z } from "zod";

/** The add-location form's fields, as typed (or filled in by clicking the map). */
export interface LocationDraft {
  name: string;
  latitude: string;
  longitude: string;
}

export type DraftErrors = Partial<Record<keyof LocationDraft, string>>;

export const EMPTY_DRAFT: LocationDraft = { name: "", latitude: "", longitude: "" };

/** A saved location as form fields. Coordinates keep their full precision, so saving unchanged fields changes nothing. */
export function draftFromLocation(location: Location): LocationDraft {
  return { name: location.name, latitude: String(location.latitude), longitude: String(location.longitude) };
}

/** The fields of `input` that differ from the saved location, or null when nothing changed. */
export function locationChanges(location: Location, input: CreateLocationRequest): UpdateLocationRequest | null {
  const changes: UpdateLocationRequest = {};

  if (input.name !== location.name) changes.name = input.name;

  if (input.latitude !== location.latitude) changes.latitude = input.latitude;

  if (input.longitude !== location.longitude) changes.longitude = input.longitude;

  return Object.keys(changes).length > 0 ? changes : null;
}

// An empty field is missing, not zero.
function parseNumber(text: string): number | undefined {
  const trimmed = text.trim();

  return trimmed === "" ? undefined : Number(trimmed);
}

export function parseDraft(draft: LocationDraft) {
  return createLocationRequestSchema.safeParse({
    name: draft.name,
    latitude: parseNumber(draft.latitude),
    longitude: parseNumber(draft.longitude),
  });
}

export function draftErrors(draft: LocationDraft): DraftErrors {
  const result = parseDraft(draft);

  if (result.success) return {};

  const { fieldErrors } = z.flattenError(result.error);

  return { name: fieldErrors.name?.[0], latitude: fieldErrors.latitude?.[0], longitude: fieldErrors.longitude?.[0] };
}

/** Where the draft would be placed, once both coordinates are valid. */
export function draftPosition(draft: LocationDraft): LatLngTuple | null {
  const latitude = latitudeSchema.safeParse(parseNumber(draft.latitude));
  const longitude = longitudeSchema.safeParse(parseNumber(draft.longitude));

  if (!latitude.success || !longitude.success) return null;

  return [latitude.data, longitude.data];
}
