import { ConversionMode } from "../types";

export const MAX_FILES_PER_BATCH = 20;
export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024 * 1024;

const audioExtensions = new Set([
  "mp3",
  "wav",
  "flac",
  "aac",
  "ogg",
  "oga",
  "m4a",
  "opus",
  "wma",
  "aiff"
]);

const videoExtensions = new Set(["mp4", "webm", "mkv", "mov", "avi", "flv", "wmv"]);

const extensionOf = (fileName: string) => fileName.split(".").pop()?.toLowerCase() ?? "";

export const getConversionMode = (file: File): ConversionMode | null => {
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("video/")) return "video";

  const extension = extensionOf(file.name);
  if (audioExtensions.has(extension)) return "audio";
  if (videoExtensions.has(extension)) return "video";
  return null;
};

export const validateFiles = (files: File[], existingCount: number) => {
  const accepted: File[] = [];
  const errors: string[] = [];
  const availableSlots = Math.max(MAX_FILES_PER_BATCH - existingCount, 0);

  for (const file of files.slice(0, availableSlots)) {
    if (!getConversionMode(file)) {
      errors.push(`${file.name}: only supported audio and video files can be added.`);
      continue;
    }
    if (file.size === 0) {
      errors.push(`${file.name}: the file is empty.`);
      continue;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      errors.push(`${file.name}: files larger than 2 GB are not supported in this browser tool.`);
      continue;
    }
    accepted.push(file);
  }

  if (files.length > availableSlots) {
    errors.push(`A queue can contain at most ${MAX_FILES_PER_BATCH} files.`);
  }

  return { accepted, errors };
};

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} bytes`;
  const megabytes = bytes / 1024 ** 2;
  return megabytes < 1024 ? `${megabytes.toFixed(2)} MB` : `${(megabytes / 1024).toFixed(2)} GB`;
};
