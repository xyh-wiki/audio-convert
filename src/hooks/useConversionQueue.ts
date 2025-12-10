import { useCallback, useEffect, useMemo, useState } from "react";
import { nanoid } from "../utils/nanoid";
import { ConversionTask, OutputFormat, PresetId } from "../types";
import { useFfmpeg } from "./useFfmpeg";
import { presets } from "../utils/options";

type AddTaskArgs = {
  file: File;
  mode: ConversionTask["mode"];
  targetFormat: OutputFormat;
  preset?: PresetId;
  options?: ConversionTask["options"];
};

export const useConversionQueue = () => {
  const [tasks, setTasks] = useState<ConversionTask[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { convert, cancel, isReady, isLoading, lastError } = useFfmpeg();

  // eslint-disable-next-line no-console
  console.log("[useConversionQueue] Hook initialized, isReady:", isReady, "isLoading:", isLoading);

  const addTask = useCallback(
    ({ file, mode, targetFormat, preset = "balanced", options = {} }: AddTaskArgs) => {
      const basePreset = presets.find((p) => p.id === preset);
      const mergedOptions = { ...basePreset, ...options };
      const task: ConversionTask = {
        id: nanoid(),
        file,
        mode,
        targetFormat,
        preset,
        options: {
          bitrate: mergedOptions.bitrate,
          audioBitrate: mergedOptions.audioBitrate,
          sampleRate: mergedOptions.sampleRate,
          videoBitrate: mergedOptions.videoBitrate,
          resolution: mergedOptions.resolution,
          ...options
        },
        progress: 0,
        status: "idle",
        message: "Waiting",
        sizeBefore: file.size
      };
      setTasks((prev) => [...prev, task]);
    },
    []
  );

  const updateTask = useCallback((id: string, updates: Partial<ConversionTask>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const removeTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const retryTask = useCallback(
    (id: string) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: "queued", progress: 0 } : t))
      );
    },
    []
  );

  const startTask = useCallback(
    (id: string) => {
      updateTask(id, { status: "queued", message: "Queued" });
    },
    [updateTask]
  );

  const startAll = useCallback(() => {
    // eslint-disable-next-line no-console
    console.log("[useConversionQueue] startAll called");
    setTasks((prev) =>
      prev.map((t) =>
        t.status === "completed"
          ? t
          : {
              ...t,
              status: "queued",
              message: "Queued"
            }
      )
    );
  }, []);

  useEffect(() => {
    const next = tasks.find((t) => t.status === "queued");
    if (!next || activeId) return;

    const run = async () => {
      setActiveId(next.id);
      updateTask(next.id, { status: "processing", message: "Processing..." });
      try {
        // eslint-disable-next-line no-console
        console.log("[useConversionQueue] Starting conversion for", next.id);
        const result = await convert(next, (progress) =>
          updateTask(next.id, { progress, status: "processing", message: "Converting..." })
        );
        // eslint-disable-next-line no-console
        console.log("[useConversionQueue] Conversion completed for", next.id);
        updateTask(next.id, {
          progress: 100,
          status: "completed",
          message: "Completed",
          outputUrl: result.url,
          outputName: `${next.file.name.split(".")[0]}.${next.targetFormat}`,
          sizeAfter: result.size
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[useConversionQueue] Conversion error for", next.id, error);
        const message =
          error instanceof Error
            ? error.message
            : "Conversion failed. This format may not be supported in your browser.";
        updateTask(next.id, { status: "error", message, progress: 0 });
      } finally {
        setActiveId(null);
      }
    };
    run();
  }, [activeId, convert, tasks, updateTask]);

  const cancelTask = useCallback(
    async (id: string) => {
      updateTask(id, { status: "canceled", message: "Canceled by user" });
      await cancel();
      setActiveId(null);
    },
    [cancel, updateTask]
  );

  const clearQueue = useCallback(() => setTasks([]), []);

  return useMemo(
    () => ({
      tasks,
      addTask,
      cancelTask,
      retryTask,
      removeTask,
      clearQueue,
      startTask,
      startAll,
      updateTask,
      isReady,
      isLoading,
      lastError
    }),
    [
      addTask,
      cancelTask,
      clearQueue,
      isLoading,
      isReady,
      lastError,
      removeTask,
      retryTask,
      startAll,
      startTask,
      updateTask,
      tasks
    ]
  );
};
