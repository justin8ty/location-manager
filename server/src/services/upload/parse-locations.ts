import {
  type CreateLocationRequest,
  latitudeSchema,
  locationNameSchema,
  longitudeSchema,
} from "@location-manager/shared";
import type { z } from "zod";
import { AppError } from "../../errors";

const MAX_REPORTED_ROWS = 5;

// Plain decimals only: `Number()` would also accept "", "0x1F", "1e3" and "Infinity".
const DECIMAL_PATTERN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;

type RowResult = { ok: true; location: CreateLocationRequest } | { ok: false; problem: string };

function toNumber(field: string): number {
  return DECIMAL_PATTERN.test(field) ? Number(field) : Number.NaN;
}

function firstMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid value";
}

/** The first line is a header if neither of its last two fields is a number, e.g. "Name, Latitude, Longitude". */
function isHeader(line: string): boolean {
  return line
    .split(",")
    .slice(-2)
    .every((field) => !DECIMAL_PATTERN.test(field.trim()));
}

/** The last two fields are latitude and longitude; everything before them is the name, commas included. */
function parseRow(line: string): RowResult {
  const fields = line.split(",");

  if (fields.length < 3) {
    return { ok: false, problem: "Expected a name, latitude and longitude separated by commas" };
  }

  const [latitudeText = "", longitudeText = ""] = fields.slice(-2).map((field) => field.trim());
  const name = locationNameSchema.safeParse(fields.slice(0, -2).join(","));
  const latitude = latitudeSchema.safeParse(toNumber(latitudeText));
  const longitude = longitudeSchema.safeParse(toNumber(longitudeText));

  if (name.success && latitude.success && longitude.success) {
    return { ok: true, location: { name: name.data, latitude: latitude.data, longitude: longitude.data } };
  }

  const problems: string[] = [];

  if (!name.success) problems.push(firstMessage(name.error));

  if (!latitude.success) problems.push(`${firstMessage(latitude.error)}, got "${latitudeText}"`);

  if (!longitude.success) problems.push(`${firstMessage(longitude.error)}, got "${longitudeText}"`);

  return { ok: false, problem: problems.join("; ") };
}

/**
 * Parses "name, latitude, longitude" lines (SPEC: TXT Format). All-or-nothing: throws INVALID_ROWS
 * listing the first invalid rows by their line number in the file, or NO_LOCATIONS if there are no data rows.
 */
export function parseLocationsText(text: string): CreateLocationRequest[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  const locations: CreateLocationRequest[] = [];
  const invalidRows: string[] = [];
  let isFirstLine = true;

  for (const [index, line] of lines.entries()) {
    if (line.trim() === "") continue;

    const mayBeHeader = isFirstLine;
    isFirstLine = false;

    if (mayBeHeader && isHeader(line)) continue;

    const row = parseRow(line);

    if (row.ok) {
      locations.push(row.location);
    } else {
      invalidRows.push(`Line ${index + 1}: ${row.problem}`);
    }
  }

  if (invalidRows.length > 0) {
    const summary = invalidRows.length === 1 ? "1 row is invalid" : `${invalidRows.length} rows are invalid`;

    throw new AppError("INVALID_ROWS", `${summary}, so nothing was saved`, invalidRows.slice(0, MAX_REPORTED_ROWS));
  }

  if (locations.length === 0) throw new AppError("NO_LOCATIONS", "The file contains no locations");

  return locations;
}
