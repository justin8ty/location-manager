import { describe, expect, it } from "vitest";
import { appErrorFrom } from "../../../test/app-error";
import { parseLocationsText } from "./parse-locations";

function rowErrors(text: string) {
  const error = appErrorFrom(() => parseLocationsText(text));
  expect(error.code).toBe("INVALID_ROWS");

  return error.details ?? [];
}

describe("parseLocationsText", () => {
  it("parses the brief's example, skipping the header", () => {
    const text = "Name, Latitude, Longitude\nSuria KLCC,3.157324409,101.7121981\nZoo Negara,3.21054160,101.75920504\n";

    expect(parseLocationsText(text)).toEqual([
      { name: "Suria KLCC", latitude: 3.157324409, longitude: 101.7121981 },
      { name: "Zoo Negara", latitude: 3.2105416, longitude: 101.75920504 },
    ]);
  });

  it("treats the first line as data when it has no header", () => {
    expect(parseLocationsText("Suria KLCC,3.157,101.712")).toEqual([
      { name: "Suria KLCC", latitude: 3.157, longitude: 101.712 },
    ]);
  });

  it("strips a UTF-8 BOM", () => {
    expect(parseLocationsText("\uFEFFSuria KLCC,3.157,101.712")[0]?.name).toBe("Suria KLCC");
  });

  it("trims whitespace around fields", () => {
    expect(parseLocationsText("  Zoo Negara  ,  3.21 , 101.759  ")).toEqual([
      { name: "Zoo Negara", latitude: 3.21, longitude: 101.759 },
    ]);
  });

  it("ignores blank lines and accepts CRLF line endings", () => {
    const text = "Name,Latitude,Longitude\r\n\r\nA,1,2\r\n   \r\nB,-3.5,-4\r\n";

    expect(parseLocationsText(text)).toEqual([
      { name: "A", latitude: 1, longitude: 2 },
      { name: "B", latitude: -3.5, longitude: -4 },
    ]);
  });

  it("keeps commas in the name, taking the last two fields as coordinates", () => {
    expect(parseLocationsText("Pavilion, Bukit Bintang,3.149,101.713")).toEqual([
      { name: "Pavilion, Bukit Bintang", latitude: 3.149, longitude: 101.713 },
    ]);
  });

  it("rejects a row with fewer than three fields", () => {
    expect(rowErrors("A,1,2\nB,3")).toEqual([expect.stringMatching(/^Line 2: /)]);
  });

  // "" and "0x1F" would silently become 0 and 31 if parsed with Number().
  it.each(["abc", "", "0x1F"])("rejects the latitude %j as not a number", (latitude) => {
    expect(rowErrors(`A,1,2\nB,${latitude},101`)).toEqual([expect.stringMatching(/^Line 2: Latitude/)]);
  });

  it("rejects out-of-range coordinates", () => {
    expect(rowErrors("A,90.5,101\nB,3,-180.5")).toEqual([
      expect.stringMatching(/^Line 1: Latitude/),
      expect.stringMatching(/^Line 2: Longitude/),
    ]);
  });

  it("rejects an empty or over-long name", () => {
    expect(rowErrors(` ,3,101\n${"x".repeat(101)},3,101\n${"x".repeat(100)},3,101`)).toEqual([
      expect.stringMatching(/^Line 1: Name/),
      expect.stringMatching(/^Line 2: Name/),
    ]);
  });

  it("does not mistake a malformed first row for a header", () => {
    expect(rowErrors("Suria KLCC,3.157,abc\nZoo Negara,3.21,101.759")).toEqual([
      expect.stringMatching(/^Line 1: Longitude/),
    ]);
  });

  it("numbers rows by their line in the file, counting blank and header lines", () => {
    expect(rowErrors("Name,Latitude,Longitude\n\nA,1,2\n\nB,300,2")).toEqual([expect.stringMatching(/^Line 5: /)]);
  });

  it("reports only the first five invalid rows", () => {
    const text = Array.from({ length: 7 }, (_, i) => `Row ${i},999,0`).join("\n");

    expect(rowErrors(text).map((detail) => detail.split(":")[0])).toEqual(["Line 1", "Line 2", "Line 3", "Line 4", "Line 5"]);
  });

  it.each([
    { file: "an empty file", text: "" },
    { file: "a header with no rows", text: "Name, Latitude, Longitude\n" },
  ])("rejects $file with NO_LOCATIONS", ({ text }) => {
    expect(appErrorFrom(() => parseLocationsText(text)).code).toBe("NO_LOCATIONS");
  });
});
