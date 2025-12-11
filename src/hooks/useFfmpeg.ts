import { useCallback, useMemo, useRef, useState } from "react";
import { FFmpeg } from "../vendor/ffmpeg/classes.js";
import { AdvancedOptions, ConversionTask, OutputFormat } from "../types";

type ProgressHandler = (value: number) => void;

type CoreSource =
  | { base: string; label: string }
  | { coreURL: string; wasmURL: string; workerURL: string; label: string };

const CORE_VERSION = "0.12.10";
const CORE_PACKAGE = "@ffmpeg/core-mt";

const buildCoreSources = (): CoreSource[] => {
  const sources: CoreSource[] = [];
  const customBase = import.meta.env.VITE_FFMPEG_BASE_URL?.trim();
  if (customBase) {
    sources.push({
      base: customBase.replace(/\/$/, ""),
      label: "custom ffmpeg base"
    });
  }
  sources.push(
    { base: `https://unpkg.com/${CORE_PACKAGE}@${CORE_VERSION}/dist/esm`, label: "unpkg esm" },
    { base: `https://cdn.jsdelivr.net/npm/${CORE_PACKAGE}@${CORE_VERSION}/dist/esm`, label: "jsdelivr esm" }
  );
  return sources;
};

const checkAssetReachability = async (
  coreURL: string,
  wasmURL: string,
  workerURL: string
): Promise<{ ok: boolean; errors: string[] }> => {
  const errors: string[] = [];
  
  // eslint-disable-next-line no-console
  console.log("[useFfmpeg] Checking asset reachability:", { coreURL, wasmURL, workerURL });
  
  for (const [name, url] of [
    ["core", coreURL],
    ["wasm", wasmURL],
    ["worker", workerURL]
  ] as const) {
    try {
      const res = await fetch(url, { method: "HEAD", mode: "cors" });
      // eslint-disable-next-line no-console
      console.log(`[useFfmpeg] ${name} reachability: ${res.status} ${res.statusText}`);
      if (!res.ok) {
        errors.push(`${name}: HTTP ${res.status} ${res.statusText} (${url})`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // eslint-disable-next-line no-console
      console.error(`[useFfmpeg] ${name} reachability error:`, msg);
      errors.push(`${name}: ${msg} (${url})`);
    }
  }
  
  return { ok: errors.length === 0, errors };
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

const buildArgs = (
  inputName: string,
  outputName: string,
  task: ConversionTask
): string[] => {
  const args: string[] = ["-i", inputName];
  const opts: AdvancedOptions = task.options;

  if (typeof opts.trimStart === "number") {
    args.push("-ss", `${opts.trimStart}`);
  }
  if (typeof opts.trimEnd === "number" && typeof opts.trimStart === "number") {
    const duration = Math.max(opts.trimEnd - opts.trimStart, 0);
    args.push("-t", `${duration}`);
  }
  if (opts.volume && opts.volume !== 1) {
    args.push("-filter:a", `volume=${opts.volume}`);
  }
  const audioBitrate = opts.audioBitrate ?? opts.bitrate;
  if (audioBitrate) {
    args.push("-b:a", `${audioBitrate}k`);
  }
  if (opts.sampleRate) {
    args.push("-ar", `${opts.sampleRate}`);
  }
  if (opts.channels) {
    args.push("-ac", `${opts.channels}`);
  }
  if (task.mode === "audio" || task.mode === "extract") {
    args.push("-vn");
  }
  if (task.mode === "video") {
    if (opts.videoBitrate) {
      args.push("-b:v", `${opts.videoBitrate}k`);
    }
    if (opts.fps) {
      args.push("-r", `${opts.fps}`);
    }
    if (opts.resolution && opts.resolution !== "original") {
      args.push("-s", opts.resolution);
    }
    if (opts.vbr) {
      args.push("-q:v", "2");
    } else if (opts.videoBitrate) {
      args.push("-minrate", `${opts.videoBitrate}k`, "-maxrate", `${opts.videoBitrate}k`);
    }
  }

  args.push("-y", outputName);
  return args;
};

export const useFfmpeg = () => {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (isReady || isLoading) return;
    setIsLoading(true);
    // eslint-disable-next-line no-console
    console.log("[useFfmpeg] Load initiated");
    try {
      let loaded = false;
      const failures: { label: string; coreURL: string; wasmURL: string; workerURL: string; reachability?: string[]; error: unknown }[] = [];
      const CORE_SOURCES = buildCoreSources();
      
      // eslint-disable-next-line no-console
      console.log("[useFfmpeg] CORE_SOURCES:", CORE_SOURCES);
      
      for (const source of CORE_SOURCES) {
        try {
          const ffmpeg = new FFmpeg();
          const coreURL = "base" in source ? `${source.base}/ffmpeg-core.js` : source.coreURL;
          const wasmURL = "base" in source ? `${source.base}/ffmpeg-core.wasm` : source.wasmURL;
          const workerURL =
            "base" in source ? `${source.base}/ffmpeg-core.worker.js` : source.workerURL;
          
          // eslint-disable-next-line no-console
          console.log(`[useFfmpeg] Attempting load from ${source.label}:`, { coreURL, wasmURL, workerURL });
          
          // Pre-check asset reachability before attempting to load
          const reachability = await checkAssetReachability(coreURL, wasmURL, workerURL);
          if (!reachability.ok) {
            // eslint-disable-next-line no-console
            console.warn(
              `Asset reachability check failed for ${source.label}:`,
              reachability.errors
            );
          }
          
          ffmpeg.on("log", ({ message }) => {
            // Always log FFmpeg debug messages to help diagnose load issues
            // eslint-disable-next-line no-console
            console.debug("[ffmpeg]", message);
          });
          // eslint-disable-next-line no-console
          console.log(`[useFfmpeg] Calling ffmpeg.load for ${source.label}`);
          await ffmpeg.load({
            coreURL,
            wasmURL,
            workerURL
          });
          // eslint-disable-next-line no-console
          console.log(`[useFfmpeg] Successfully loaded from ${source.label}`);
          ffmpegRef.current = ffmpeg;
          loaded = true;
          break;
        } catch (err) {
          const reachability = await checkAssetReachability(
            "base" in source ? `${source.base}/ffmpeg-core.js` : source.coreURL,
            "base" in source ? `${source.base}/ffmpeg-core.wasm` : source.wasmURL,
            "base" in source ? `${source.base}/ffmpeg-core.worker.js` : source.workerURL
          );
          failures.push({
            label: "base" in source ? source.base : source.label,
            coreURL: "base" in source ? `${source.base}/ffmpeg-core.js` : source.coreURL,
            wasmURL: "base" in source ? `${source.base}/ffmpeg-core.wasm` : source.wasmURL,
            workerURL: "base" in source ? `${source.base}/ffmpeg-core.worker.js` : source.workerURL,
            reachability: reachability.errors,
            error: err
          });
          // eslint-disable-next-line no-console
          console.error("FFmpeg load failed from", "base" in source ? source.base : source.label, {
            error: err,
            reachability: reachability.errors
          });
        }
      }
      if (!loaded) {
        const lastFailure = failures.at(-1);
        // eslint-disable-next-line no-console
        console.error("[useFfmpeg] ALL LOAD ATTEMPTS FAILED. Failures:", failures);
        if (lastFailure) {
          // eslint-disable-next-line no-console
          console.error("[useFfmpeg] Last attempt:", {
            label: lastFailure.label,
            coreURL: lastFailure.coreURL,
            reachability: lastFailure.reachability,
            error: lastFailure.error instanceof Error ? lastFailure.error.message : String(lastFailure.error)
          });
        }
        // Mark as error but don't set lastError - let convert() try CDN fallbacks
        return;
      }
      setIsReady(true);
      setLastError(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const convert = useCallback(
    async (task: ConversionTask, onProgress?: ProgressHandler) => {
      if (!ffmpegRef.current) {
        // eslint-disable-next-line no-console
        console.log("[useFfmpeg] FFmpeg not initialized, attempting load...");
        await load();
      }
      const ffmpeg = ffmpegRef.current;
      if (!ffmpeg) {
        const errMsg = "FFmpeg not initialized after load attempt";
        // eslint-disable-next-line no-console
        console.error("[useFfmpeg]", errMsg, { isReady, isLoading, lastError });
        throw new Error(errMsg);
      }

      ffmpeg.off?.("progress", () => undefined);
      ffmpeg.on("progress", ({ progress }: { progress: number }) => {
        if (onProgress) onProgress(Math.round(progress * 100));
      });

      const inputName = `input-${task.id}`;
      const outputName = `output-${task.id}.${task.targetFormat}`;

      const data = new Uint8Array(await task.file.arrayBuffer());
      await ffmpeg.writeFile(inputName, data);
      const args = buildArgs(inputName, outputName, task);
      await ffmpeg.exec(args);
      const outputData = await ffmpeg.readFile(outputName);

      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);

      const blob = new Blob([outputData as any], { type: mimeByFormat[task.targetFormat] });
      const url = URL.createObjectURL(blob);

      return { url, size: blob.size };
    },
    [load]
  );

  const cancel = useCallback(async () => {
    if (ffmpegRef.current) {
      try {
        ffmpegRef.current.terminate();
        ffmpegRef.current = null;
        setIsReady(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to cancel task.";
        setLastError(message);
      }
    }
  }, []);

  return useMemo(
    () => ({
      convert,
      cancel,
      load,
      isLoading,
      isReady,
      lastError
    }),
    [cancel, convert, isLoading, isReady, lastError, load]
  );
};
