export type ConversionMode = "audio" | "video" | "extract";

export type AudioFormat =
  | "mp3"
  | "wav"
  | "flac"
  | "aac"
  | "ogg"
  | "oga"
  | "m4a"
  | "opus"
  | "wma"
  | "alac"
  | "aiff";

export type VideoFormat = "mp4" | "webm" | "mkv" | "mov" | "avi" | "flv" | "wmv";

export type OutputFormat = AudioFormat | VideoFormat;

export type PresetId = "high" | "balanced" | "small";

export type PresetConfig = {
  id: PresetId;
  label: string;
  description: string;
  bitrate?: number;
  audioBitrate?: number;
  sampleRate?: number;
  videoBitrate?: number;
  resolution?: "1080" | "720" | "480";
};

export type AdvancedOptions = {
  bitrate?: number;
  audioBitrate?: number;
  sampleRate?: number;
  channels?: 1 | 2;
  videoBitrate?: number;
  fps?: number;
  resolution?: string;
  trimStart?: number;
  trimEnd?: number;
  volume?: number;
  vbr?: boolean;
};

export type ConversionTask = {
  id: string;
  file: File;
  mode: ConversionMode;
  targetFormat: OutputFormat;
  preset: PresetId;
  options: AdvancedOptions;
  status: "idle" | "queued" | "processing" | "completed" | "error" | "canceled";
  progress: number;
  message?: string;
  outputUrl?: string;
  outputName?: string;
  sizeBefore?: number;
  sizeAfter?: number;
};
