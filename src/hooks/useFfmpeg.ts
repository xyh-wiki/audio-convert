import { useCallback, useMemo, useRef, useState } from "react";
import { FFmpeg } from "../vendor/ffmpeg/classes.js";
import { AdvancedOptions, ConversionTask, OutputFormat } from "../types";
import coreJsAsset from "../assets/ffmpeg/esm/ffmpeg-core.js?url";
import coreWasmAsset from "../assets/ffmpeg/esm/ffmpeg-core.wasm?url";
import coreWorkerAsset from "../assets/ffmpeg/esm/ffmpeg-core.worker.js?url";

type ProgressHandler = (value: number) => void;

type CoreSource =
  | { base: string; label: string }
  | { coreURL: string; wasmURL: string; workerURL: string; label: string };

const getAbsoluteUrl = (path: string): string => {
  // 如果已经是绝对 URL，直接返回
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  
  // 获取当前协议和主机（使用 globalThis 以兼容 Node 构建环境）
  if (typeof globalThis === "undefined") {
    return path;
  }
  
  const location = (globalThis as any).location;
  if (!location || !location.origin) {
    return path;
  }
  
  const origin = location.origin;
  const base = (import.meta.env.BASE_URL ?? "/").replace(/\/?$/, "/");
  
  // 处理相对路径
  if (path.startsWith("/")) {
    return origin + path;
  }
  
  // 处理相对于 BASE_URL 的路径
  return origin + base + path;
};

const makeBase = (subdir: "esm" | "umd") => {
  const base = (import.meta.env.BASE_URL ?? "/").replace(/\/?$/, "/");
  
  if (typeof globalThis === "undefined") {
    return `/ffmpeg/${subdir}/`;
  }
  
  const location = (globalThis as any).location;
  if (!location || !location.origin) {
    return `/ffmpeg/${subdir}/`;
  }
  
  const origin = location.origin;
  const root = new URL(base, origin);
  return new URL(`ffmpeg/${subdir}/`, root).href.replace(/\/$/, "");
};

const buildCoreSources = (): CoreSource[] => {
  const localEsmBase = makeBase("esm");
  
  return [
    { 
      coreURL: getAbsoluteUrl(coreJsAsset), 
      wasmURL: getAbsoluteUrl(coreWasmAsset), 
      workerURL: getAbsoluteUrl(coreWorkerAsset), 
      label: "bundled esm assets" 
    },
    { base: localEsmBase, label: "local esm" },
    { base: "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm", label: "unpkg esm" },
    { base: "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm", label: "jsdelivr esm" }
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
    try {
      let loaded = false;
      const failures: { label: string; coreURL: string; wasmURL: string; workerURL: string; error: unknown }[] = [];
      const CORE_SOURCES = buildCoreSources();
      
      for (const source of CORE_SOURCES) {
        try {
          const ffmpeg = new FFmpeg();
          const coreURL = "base" in source ? `${source.base}/ffmpeg-core.js` : source.coreURL;
          const wasmURL = "base" in source ? `${source.base}/ffmpeg-core.wasm` : source.wasmURL;
          const workerURL =
            "base" in source ? `${source.base}/ffmpeg-core.worker.js` : source.workerURL;
          ffmpeg.on("log", ({ message }) => {
            if (import.meta.env.DEV) {
              // eslint-disable-next-line no-console
              console.debug("[ffmpeg]", message);
            }
          });
          await ffmpeg.load({
            coreURL,
            wasmURL,
            workerURL
          });
          ffmpegRef.current = ffmpeg;
          loaded = true;
          break;
        } catch (err) {
          failures.push({
            label: "base" in source ? source.base : source.label,
            coreURL: "base" in source ? `${source.base}/ffmpeg-core.js` : source.coreURL,
            wasmURL: "base" in source ? `${source.base}/ffmpeg-core.wasm` : source.wasmURL,
            workerURL: "base" in source ? `${source.base}/ffmpeg-core.worker.js` : source.workerURL,
            error: err
          });
          // eslint-disable-next-line no-console
          console.error("FFmpeg load failed from", "base" in source ? source.base : source.label, err);
        }
      }
      if (!loaded) {
        const lastErr = failures.at(-1)?.error;
        const msg =
          lastErr instanceof Error
            ? lastErr.message
            : "Unable to load FFmpeg core. Check network or local assets.";
        // eslint-disable-next-line no-console
        console.error("FFmpeg load failures:", failures);
        setLastError(msg);
        throw new Error(msg);
      }
      setIsReady(true);
      setLastError(null);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isReady]);

  const convert = useCallback(
    async (task: ConversionTask, onProgress?: ProgressHandler) => {
      if (!ffmpegRef.current) {
        await load();
      }
      const ffmpeg = ffmpegRef.current;
      if (!ffmpeg) throw new Error("FFmpeg not initialized");

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
