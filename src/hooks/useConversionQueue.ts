import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const canceledTaskId = useRef<string | null>(null);
  const tasksRef = useRef<ConversionTask[]>([]);
  const { convert, cancel, isReady, isLoading, lastError } = useFfmpeg();

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
        message: "等待开始",
        sizeBefore: file.size
      };
      setTasks((prev) => [...prev, task]);
      return task.id;
    },
    []
  );

  const updateTask = useCallback((id: string, updates: Partial<ConversionTask>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const revokeOutput = useCallback((url?: string) => {
    if (url) URL.revokeObjectURL(url);
  }, []);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const removeTask = useCallback(
    (id: string) => {
      setTasks((prev) => {
        const task = prev.find((item) => item.id === id);
        revokeOutput(task?.outputUrl);
        return prev.filter((item) => item.id !== id);
      });
    },
    [revokeOutput]
  );

  const retryTask = useCallback(
    (id: string) => {
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id !== id || !["error", "canceled"].includes(task.status)) return task;
          revokeOutput(task.outputUrl);
          return {
            ...task,
            outputUrl: undefined,
            outputName: undefined,
            sizeAfter: undefined,
            status: "queued",
            progress: 0,
            message: "等待中"
          };
        })
      );
    },
    [revokeOutput]
  );

  const startTask = useCallback(
    (id: string) => {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === id && ["idle", "error", "canceled"].includes(task.status)
            ? { ...task, status: "queued", message: "等待中", progress: 0 }
            : task
        )
      );
    },
    []
  );

  const startAll = useCallback(() => {
    setTasks((prev) =>
      prev.map((t) =>
        ["idle", "error", "canceled"].includes(t.status)
          ? {
              ...t,
              status: "queued",
              message: "等待中",
              progress: 0
            }
          : t
      )
    );
  }, []);

  useEffect(() => {
    const next = tasks.find((t) => t.status === "queued");
    if (!next || activeId) return;

    const run = async () => {
      setActiveId(next.id);
      updateTask(next.id, { status: "processing", message: "正在准备…" });
      try {
        const result = await convert(next, (progress) =>
          updateTask(next.id, { progress, status: "processing", message: "正在转换…" })
        );
        if (canceledTaskId.current !== next.id) {
          updateTask(next.id, {
            progress: 100,
            status: "completed",
            message: "已完成",
            outputUrl: result.url,
            outputName: `${next.file.name.replace(/\.[^.]+$/, "")}.${next.targetFormat}`,
            sizeAfter: result.size
          });
        } else {
          revokeOutput(result.url);
        }
      } catch (error) {
        if (canceledTaskId.current === next.id) return;
        const message =
          error instanceof Error
            ? error.message
            : "Conversion failed. This format may not be supported in your browser.";
        updateTask(next.id, { status: "error", message, progress: 0 });
      } finally {
        if (canceledTaskId.current === next.id) canceledTaskId.current = null;
        setActiveId(null);
      }
    };
    run();
  }, [activeId, convert, revokeOutput, tasks, updateTask]);

  const cancelTask = useCallback(
    async (id: string) => {
      if (id !== activeId) return;
      canceledTaskId.current = id;
      updateTask(id, { status: "canceled", message: "已由用户取消" });
      await cancel();
    },
    [activeId, cancel, updateTask]
  );

  const clearQueue = useCallback(() => {
    setTasks((prev) => {
      prev.forEach((task) => revokeOutput(task.outputUrl));
      return activeId ? prev.filter((task) => task.id === activeId) : [];
    });
  }, [activeId, revokeOutput]);

  useEffect(
    () => () => {
      tasksRef.current.forEach((task) => revokeOutput(task.outputUrl));
    },
    [revokeOutput]
  );

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
