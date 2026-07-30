import { ConversionMode, ConversionTask, OutputFormat } from "../types";

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
      errors.push(`${file.name}：仅支持常见音频和视频文件。`);
      continue;
    }
    if (file.size === 0) {
      errors.push(`${file.name}：文件为空。`);
      continue;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      errors.push(`${file.name}：此浏览器工具不支持超过 2 GB 的文件。`);
      continue;
    }
    accepted.push(file);
  }

  if (files.length > availableSlots) {
    errors.push(`队列最多可保留 ${MAX_FILES_PER_BATCH} 个文件。`);
  }

  return { accepted, errors };
};

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} bytes`;
  const megabytes = bytes / 1024 ** 2;
  return megabytes < 1024 ? `${megabytes.toFixed(2)} MB` : `${(megabytes / 1024).toFixed(2)} GB`;
};

export const getFileBaseName = (fileName: string) => fileName.replace(/\.[^.]+$/, "") || fileName;

export const createOutputName = (baseName: string, format: OutputFormat) => {
  const safeBaseName = (baseName || "converted")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\.[^.]+$/, "")
    .trim()
    .slice(0, 120);
  return `${safeBaseName || "converted"}.${format}`;
};

export const getPreflightWarnings = (task: Pick<ConversionTask, "file" | "mode" | "targetFormat" | "options">) => {
  const warnings: string[] = [];
  const inputSize = task.file.size;
  const sourceExtension = extensionOf(task.file.name);

  if (inputSize >= 800 * 1024 * 1024) {
    warnings.push("文件较大，浏览器转换可能占用较多内存；建议关闭其他标签页。");
  }
  if (task.mode === "video" && task.targetFormat === "gif") {
    warnings.push("GIF 文件通常较大且不含音频；建议先裁剪较短片段。");
  }
  if (sourceExtension === task.targetFormat) {
    warnings.push("输入和输出格式相同，转换不会带来格式兼容性提升。");
  }
  if (typeof task.options.trimStart === "number" && typeof task.options.trimEnd === "number" && task.options.trimEnd <= task.options.trimStart) {
    warnings.push("结束时间必须大于起始时间。");
  }
  if (typeof navigator !== "undefined" && "deviceMemory" in navigator) {
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    if (memory && memory <= 4 && inputSize >= 300 * 1024 * 1024) {
      warnings.push("当前设备内存较少，大文件转换可能失败；建议使用较小文件或较低质量预设。");
    }
  }
  return warnings;
};

export const getFailureAdvice = (message: string, task: Pick<ConversionTask, "mode" | "targetFormat">) => {
  const normalizedMessage = message.toLowerCase();
  if (normalizedMessage.includes("memory") || normalizedMessage.includes("out of") || normalizedMessage.includes("abort")) {
    return "可能是浏览器内存不足。请关闭其他标签页、缩短片段或使用“小文件”预设后重试。";
  }
  if (task.mode === "video" && task.targetFormat !== "mp4") {
    return "当前格式或编码器可能不兼容。请尝试输出为 MP4，或降低分辨率与帧率后重试。";
  }
  if (task.mode !== "video" && task.targetFormat !== "mp3") {
    return "当前格式或编码器可能不兼容。请尝试输出为 MP3 后重试。";
  }
  return "请确认文件可正常播放；也可以缩短片段、降低质量预设后重新转换。";
};
