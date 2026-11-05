import { strToU8, type Zippable, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { appErrorFrom } from "../../../test/app-error";
import { extractTextFile, MAX_TEXT_FILE_BYTES } from "./extract-text-file";

const text = "Suria KLCC,3.157324409,101.7121981\n";

function errorCode(archive: Uint8Array) {
  return appErrorFrom(() => extractTextFile(archive)).code;
}

/** Rewrites the uncompressed size recorded in the (only) central directory header. */
function withDeclaredSize(archive: Uint8Array, size: number): Uint8Array {
  const forged = archive.slice();
  const view = new DataView(forged.buffer);

  for (let offset = 0; offset + 4 <= forged.length; offset++) {
    if (view.getUint32(offset, true) === 0x02014b50) {
      view.setUint32(offset + 24, size, true);

      return forged;
    }
  }

  throw new Error("No central directory header found");
}

describe("extractTextFile", () => {
  it("returns the text of a single .txt file", () => {
    expect(extractTextFile(zipSync({ "locations.txt": strToU8(text) }))).toBe(text);
  });

  it("finds the .txt file in a subfolder and ignores directories and macOS metadata", () => {
    const archive = zipSync({
      "export/": new Uint8Array(0),
      "export/locations.TXT": strToU8(text),
      "export/.DS_Store": new Uint8Array([1, 2, 3]),
      "__MACOSX/export/._locations.TXT": new Uint8Array([4, 5, 6]),
    });

    expect(extractTextFile(archive)).toBe(text);
  });

  it.each<{ contents: string; files: Zippable }>([
    { contents: "no files", files: { "export/": new Uint8Array(0), ".DS_Store": new Uint8Array([1]) } },
    { contents: "two .txt files", files: { "a.txt": strToU8(text), "b.txt": strToU8(text) } },
    { contents: "a .txt file and another file", files: { "a.txt": strToU8(text), "notes.md": strToU8("hi") } },
    { contents: "a single non-.txt file", files: { "locations.csv": strToU8(text) } },
  ])("rejects a ZIP with $contents", ({ files }) => {
    expect(errorCode(zipSync(files))).toBe("INVALID_ZIP_CONTENTS");
  });

  it("accepts a text file of exactly 1 MB", () => {
    const archive = zipSync({ "big.txt": new Uint8Array(MAX_TEXT_FILE_BYTES).fill(0x61) });

    expect(extractTextFile(archive)).toHaveLength(MAX_TEXT_FILE_BYTES);
  });

  it("rejects a text file declared over 1 MB without decompressing it", () => {
    const archive = withDeclaredSize(zipSync({ "locations.txt": strToU8(text) }), MAX_TEXT_FILE_BYTES + 1);

    expect(errorCode(archive)).toBe("FILE_TOO_LARGE");
  });

  it("rejects an uncompressed entry larger than its declared size", () => {
    const stored = zipSync({ "big.txt": new Uint8Array(MAX_TEXT_FILE_BYTES + 1).fill(0x61) }, { level: 0 });

    expect(errorCode(withDeclaredSize(stored, 10))).toBe("FILE_TOO_LARGE");
  });

  it("rejects a file that is not a ZIP", () => {
    expect(errorCode(strToU8(text))).toBe("NOT_ZIP");
  });

  it("rejects a truncated ZIP", () => {
    const archive = zipSync({ "locations.txt": strToU8(text) });

    expect(errorCode(archive.subarray(0, archive.length - 30))).toBe("NOT_ZIP");
  });

  it("rejects a text file that is not UTF-8", () => {
    const latin1 = new Uint8Array([...strToU8("Caf"), 0xe9, ...strToU8(",3.1,101.7")]);

    expect(errorCode(zipSync({ "locations.txt": latin1 }))).toBe("NOT_UTF8");
  });
});
