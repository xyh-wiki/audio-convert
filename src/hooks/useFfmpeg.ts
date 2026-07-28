import { useCallback, useMemo, useRef, useState } from "react";
import { FFmpeg } from "../vendor/ffmpeg/classes.js";
import { AdvancedOptions, ConversionTask, OutputFormat } from "../types";

type ProgressHandler = (value: number) => void;

type CoreSource = { base: string; label: string };

const makeLocalBase = () => {
  const base = (import.meta.env.BASE_URL ?? "/").replace(/\/?$/, "/");
  const origin = typeof window === "undefined" ? "http://localhost" : window.location.origin;
  return new URL("ffmpeg/esm/", new URL(base, origin)).href.replace(/\/$/, "");
};

const buildCoreSources = (): CoreSource[] => {
  const customBase = import.meta.env.VITE_FFMPEG_BASE_URL?.trim();
  return [
    ...(customBase
      ? [{ base: customBase.replace(/\/?$/, ""), label: "custom ffmpeg assets" }]
      : []),
    { base: makeLocalBase(), label: "local ffmpeg assets" }
  ];
};

const mimeByFormat: Record<OutputFormat, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  flac: "audio/flac",
  aac: "audio/aac",
  ogg: "audio/ogg",
  oga: "audio/ogg",
  m4a: "audio/mp4",
  opus: "audio/ogg; codecs=opus",
  wma: "audio/x-ms-wma",
  alac: "audio/alac",
  aiff: "audio/aiff",
  mp4: "video/mp4",
  webm: "video/webm",
  mkv: "video/x-matroska",
  mov: "video/quicktime",
  avi: "video/x-msvideo",
  flv: "video/x-flv",
  wmv: "video/x-ms-wmv"
};

const buildArgs = (inputName: string, outputName: string, task: ConversionTask): string[] => {
  const args: string[] = ["-i", inputName];
  const options: AdvancedOptions = task.options;

  if (typeof options.trimStart === "number") args.push("-ss", `${options.trimStart}`);
  if (typeof options.trimEnd === "number" && typeof options.trimStart === "number") {
    args.push("-t", `${Math.max(options.trimEnd - options.trimStart, 0)}`);
  }
  if (options.volume && options.volume !== 1) args.push("-filter:a", `volume=${options.volume}`);

  const audioBitrate = options.audioBitrate ?? options.bitrate;
  if (audioBitrate) args.push("-b:a", `${audioBitrate}k`);
  if (options.sampleRate) args.push("-ar", `${options.sampleRate}`);
  if (options.channels) args.push("-ac", `${options.channels}`);
  if (task.mode === "audio" || task.mode === "extract") args.push("-vn");

  if (task.mode === "video") {
    if (options.videoBitrate) args.push("-b:v", `${options.videoBitrate}k`);
    if (options.fps) args.push("-r", `${options.fps}`);
    if (options.resolution && options.resolution !== "original") args.push("-s", options.resolution);
    if (options.vbr) args.push("-q:v", "2");
    else if (options.videoBitrate) {
      args.push("-minrate", `${options.videoBitrate}k`, "-maxrate", `${options.videoBitrate}k`);
    }
  }

  return [...args, "-y", outputName];
};

export const useFfmpeg = () => {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const progressListenerRef = useRef<((event: { progress: number }) => void) | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (ffmpegRef.current || isLoading) return;
    setIsLoading(true);
    const failures: string[] = [];

    try {
      for (const source of buildCoreSources()) {
        const ffmpeg = new FFmpeg();
        try {
          await ffmpeg.load({
            coreURL: `${source.base}/ffmpeg-core.js`,
            wasmURL: `${source.base}/ffmpeg-core.wasm`
          });
          ffmpegRef.current = ffmpeg;
          setIsReady(true);
          setLastError(null);
          return;
        } catch (error) {
          ffmpeg.terminate();
          failures.push(`${source.label}: ${error instanceof Error ? error.message : "load failed"}`);
        }
      }

      const message = "Unable to load the local FFmpeg core. Refresh the page and try again.";
      setLastError(failures.length ? `${message} ${failures.join("; ")}` : message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const convert = useCallback(
    async (task: ConversionTask, onProgress?: ProgressHandler) => {
      if (!ffmpegRef.current) await load();
      const ffmpeg = ffmpegRef.current;
      if (!ffmpeg) throw new Error("FFmpeg is not initialized.");

      if (progressListenerRef.current) ffmpeg.off?.("progress", progressListenerRef.current);
      const progressListener = ({ progress }: { progress: number }) => onProgress?.(Math.round(progress * 100));
      progressListenerRef.current = progressListener;
      ffmpeg.on("progress", progressListener);

      const inputName = `input-${task.id}`;
      const outputName = `output-${task.id}.${task.targetFormat}`;
      try {
        await ffmpeg.writeFile(inputName, new Uint8Array(await task.file.arrayBuffer()));
        await ffmpeg.exec(buildArgs(inputName, outputName, task));
        const outputData = await ffmpeg.readFile(outputName);
        const blob = new Blob([outputData as BlobPart], { type: mimeByFormat[task.targetFormat] });
        return { url: URL.createObjectURL(blob), size: blob.size };
      } finally {
        await Promise.allSettled([ffmpeg.deleteFile(inputName), ffmpeg.deleteFile(outputName)]);
      }
    },
    [load]
  );

  const cancel = useCallback(async () => {
    if (!ffmpegRef.current) return;
    ffmpegRef.current.terminate();
    ffmpegRef.current = null;
    progressListenerRef.current = null;
    setIsReady(false);
  }, []);

  return useMemo(
    () => ({ convert, cancel, load, isLoading, isReady, lastError }),
    [cancel, convert, isLoading, isReady, lastError, load]
  );
};
