import type { Request, RequestHandler } from "express";
import multer, { MulterError } from "multer";
import { AppError } from "../errors";

const MAX_ZIP_BYTES = 5 * 1024 * 1024;
const FIELD_NAME = "file";

const singleFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_ZIP_BYTES, files: 1 },
}).single(FIELD_NAME);

function toAppError(error: MulterError): AppError {
  switch (error.code) {
    case "LIMIT_FILE_SIZE":
      return new AppError("FILE_TOO_LARGE", "The ZIP file is larger than 5 MB");
    case "LIMIT_FILE_COUNT":
    case "LIMIT_UNEXPECTED_FILE":
      return new AppError("VALIDATION_ERROR", `Upload one ZIP file in the "${FIELD_NAME}" field`);
    default:
      return new AppError("VALIDATION_ERROR", error.message);
  }
}

/** Buffers a multipart upload of one file (max 5 MB) in memory; read it with `uploadedZip`. */
export const receiveZip: RequestHandler = (req, res, next) => {
  singleFile(req, res, (error?: Error | string) => {
    if (error instanceof MulterError) return next(toAppError(error));

    // With memory storage, any other error is busboy rejecting a malformed multipart body.
    if (error instanceof Error) return next(new AppError("VALIDATION_ERROR", `Malformed upload: ${error.message}`));

    next(error);
  });
};

/** The uploaded file's bytes. Throws FILE_REQUIRED if there is none, NOT_ZIP if it isn't named `.zip`. */
export function uploadedZip(req: Request): Uint8Array {
  if (!req.file) throw new AppError("FILE_REQUIRED", "Choose a ZIP file to upload");

  if (!/\.zip$/i.test(req.file.originalname)) throw new AppError("NOT_ZIP", "The file must be a .zip file");

  return req.file.buffer;
}
