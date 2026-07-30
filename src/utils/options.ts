import { AudioFormat, PresetConfig, VideoFormat } from "../types";

export const audioInputFormats: AudioFormat[] = [
  "mp3",
  "wav",
  "flac",
  "aac",
  "ogg",
  "oga",
  "m4a",
  "opus",
  "wma",
  "alac",
  "aiff"
];

export const audioOutputFormats: AudioFormat[] = [
  "mp3",
  "wav",
  "flac",
  "aac",
  "ogg",
  "m4a",
  "opus"
];

export const videoInputFormats: VideoFormat[] = [
  "mp4",
  "webm",
  "mkv",
  "mov",
  "avi",
  "flv",
  "wmv"
];

export const videoOutputFormats: VideoFormat[] = ["mp4", "webm", "mkv", "mov", "gif"];

export const presets: PresetConfig[] = [
  {
    id: "high",
    label: "高质量",
    description: "适合归档或保留更多细节",
    bitrate: 320,
    audioBitrate: 320,
    videoBitrate: 6000
  },
  {
    id: "balanced",
    label: "均衡",
    description: "质量与体积的日常平衡",
    bitrate: 192,
    audioBitrate: 192,
    videoBitrate: 3500
  },
  {
    id: "small",
    label: "小文件",
    description: "适合传输和节省空间",
    bitrate: 128,
    audioBitrate: 128,
    videoBitrate: 2000
  }
];

export const resolutionPresets = [
  { label: "保持原始", value: "original" },
  { label: "1080p", value: "1920x1080" },
  { label: "720p", value: "1280x720" },
  { label: "480p", value: "854x480" }
];

export const frameRatePresets = [24, 30, 60];

export const bitratePresets = [128, 192, 256, 320];

export const sampleRatePresets = [44100, 48000];
