import {
  type CreateLocationRequest,
  createLocationRequestSchema,
  type Location,
  type LocationIcon,
  latitudeSchema,
  longitudeSchema,
  suggestLocationIcon,
  type UpdateLocationRequest,
} from "@location-manager/shared";
import type { LatLngTuple } from "leaflet";
import { z } from "zod";

/** The composer's fields, as typed (or filled in from the map). */
export interface LocationDraft {
  name: string;
  latitude: string;
  longitude: string;
  icon: LocationIcon;
  /** The icon follows the name's suggestion until the user picks one. */
  iconSuggested: boolean;
}

type DraftField = "name" | "latitude" | "longitude";

export type DraftErrors = Partial<Record<DraftField, string>>;

export const EMPTY_DRAFT: LocationDraft = { name: "", latitude: "", longitude: "", icon: "pin", iconSuggested: true };

/** A saved location as fields. Coordinates keep their full precision, so saving unchanged fields changes nothing. */
export function draftFromLocation(location: Location): LocationDraft {
  return {
    name: location.name,
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    icon: location.icon,
    iconSuggested: false,
  };
}

export function renameDraft(draft: LocationDraft, name: string): LocationDraft {
  return { ...draft, name, icon: draft.iconSuggested ? suggestLocationIcon(name) : draft.icon };
}

/** The fields of `input` that differ from the saved location, or null when nothing changed. */
export function locationChanges(location: Location, input: CreateLocationRequest): UpdateLocationRequest | null {
  const changes: UpdateLocationRequest = {};

  if (input.name !== location.name) changes.name = input.name;

  if (input.latitude !== location.latitude) changes.latitude = input.latitude;

  if (input.longitude !== location.longitude) changes.longitude = input.longitude;

  if (input.icon !== location.icon) changes.icon = input.icon;

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
    icon: draft.icon,
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
