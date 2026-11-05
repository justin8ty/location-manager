import { type UnzipFileFilter, type UnzipFileInfo, unzipSync } from "fflate";
import { z } from "zod";
import { AppError } from "../../errors";

export const MAX_TEXT_FILE_BYTES = 1024 * 1024;

const ZIP_MAGIC_BYTES = [0x50, 0x4b, 0x03, 0x04];

// fflate reports corrupt or unsupported archives as plain Errors with a numeric `code`.
const fflateErrorSchema = z.object({ code: z.number() });

const utf8Decoder = new TextDecoder("utf-8", { fatal: true });

/** Directories and macOS metadata that archivers add on their own. */
function isArchiverNoise(name: string): boolean {
  return name.endsWith("/") || name.startsWith("__MACOSX/") || name.split("/").at(-1) === ".DS_Store";
}

function unzip(zip: Uint8Array, filter: UnzipFileFilter) {
  try {
    return unzipSync(zip, { filter });
  } catch (error) {
    if (fflateErrorSchema.safeParse(error).success) {
      throw new AppError("NOT_ZIP", "The ZIP file is corrupt or uses unsupported compression");
    }

    throw error;
  }
}

/** Lists the archive's entries from its central directory without decompressing anything. */
function listEntries(zip: Uint8Array): UnzipFileInfo[] {
  const entries: UnzipFileInfo[] = [];

  unzip(zip, (entry) => {
    entries.push(entry);

    return false;
  });

  return entries;
}

function findTextFile(entries: UnzipFileInfo[]): UnzipFileInfo {
  const files = entries.filter((entry) => !isArchiverNoise(entry.name));
  const [file] = files;

  if (!file) throw new AppError("INVALID_ZIP_CONTENTS", "The ZIP file is empty. It must contain exactly one .txt file");

  if (files.length > 1) {
    throw new AppError(
      "INVALID_ZIP_CONTENTS",
      `The ZIP file contains ${files.length} files. It must contain exactly one .txt file`,
    );
  }

  if (!/\.txt$/i.test(file.name)) {
    throw new AppError("INVALID_ZIP_CONTENTS", `The ZIP file must contain a .txt file, not "${file.name}"`);
  }

  return file;
}

function decodeUtf8(bytes: Uint8Array): string {
  try {
    return utf8Decoder.decode(bytes);
  } catch (error) {
    if (error instanceof TypeError) throw new AppError("NOT_UTF8", "The text file must be UTF-8 encoded");

    throw error;
  }
}

/**
 * Returns the text of the only file in a ZIP, which must be a UTF-8 `.txt` of at most 1 MB.
 * The size limit is checked against the entry metadata before anything is decompressed (zip-bomb guard).
 */
export function extractTextFile(zip: Uint8Array): string {
  if (!ZIP_MAGIC_BYTES.every((byte, index) => zip[index] === byte)) {
    throw new AppError("NOT_ZIP", "The file is not a ZIP archive");
  }

  const textFile = findTextFile(listEntries(zip));
  const tooLarge = new AppError("FILE_TOO_LARGE", "The text file is larger than 1 MB");

  if (textFile.originalSize > MAX_TEXT_FILE_BYTES) throw tooLarge;

  const bytes = unzip(zip, (entry) => entry.name === textFile.name)[textFile.name];

  if (!bytes) throw new Error(`Entry ${textFile.name} vanished between listing and extraction`);

  // Stored (uncompressed) entries are copied at their compressed size, which the metadata check doesn't bound.
  if (bytes.length > MAX_TEXT_FILE_BYTES) throw tooLarge;

  return decodeUtf8(bytes);
}
