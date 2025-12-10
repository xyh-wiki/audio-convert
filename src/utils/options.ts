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

export const videoOutputFormats: VideoFormat[] = ["mp4", "webm", "mkv", "mov"];

export const presets: PresetConfig[] = [
  {
    id: "high",
    label: "High Quality",
    description: "Best for mastering or archiving",
    bitrate: 320,
    audioBitrate: 320,
    videoBitrate: 6000
  },
  {
    id: "balanced",
    label: "Balanced",
    description: "Great quality with moderate size",
    bitrate: 192,
    audioBitrate: 192,
    videoBitrate: 3500
  },
  {
    id: "small",
    label: "Small File",
    description: "Optimized for faster transfers",
    bitrate: 128,
    audioBitrate: 128,
    videoBitrate: 2000
  }
];

export const resolutionPresets = [
  { label: "Keep original", value: "original" },
  { label: "1080p", value: "1920x1080" },
  { label: "720p", value: "1280x720" },
  { label: "480p", value: "854x480" }
];

export const frameRatePresets = [24, 30, 60];

export const bitratePresets = [128, 192, 256, 320];

export const sampleRatePresets = [44100, 48000];
