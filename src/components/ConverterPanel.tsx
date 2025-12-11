// @ts-nocheck
import React, { useMemo, useRef, useState } from "react";
import { useConversionQueue } from "../hooks/useConversionQueue";
import { useI18n } from "../services/i18n";
import {
  audioOutputFormats,
  bitratePresets,
  frameRatePresets,
  presets,
  resolutionPresets,
  sampleRatePresets,
  videoOutputFormats
} from "../utils/options";
import { ConversionMode, ConversionTask, OutputFormat } from "../types";

const modeLabel: Record<ConversionMode, string> = {
  audio: "Audio -> Audio",
  video: "Video -> Video",
  extract: "Video -> Audio"
};

const getDefaultMode = (file: File): ConversionMode => {
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("video/")) return "video";
  return "audio";
};

const inferOutput = (mode: ConversionMode): OutputFormat => {
  if (mode === "audio" || mode === "extract") return "mp3";
  return "mp4";
};

export const ConverterPanel: React.FC = () => {
  // eslint-disable-next-line no-console
  console.log("[ConverterPanel] Component mounted/rendered");
  
  const {
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
  } = useConversionQueue();
  const { t } = useI18n();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debug: log when lastError changes
  React.useEffect(() => {
    if (lastError) {
      // eslint-disable-next-line no-console
      console.log("[ConverterPanel] lastError:", lastError);
    }
  }, [lastError]);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    if (tasks.length >= 1) {
      // eslint-disable-next-line no-console
      console.warn("[ConverterPanel] Only one file can be converted at a time.");
      return;
    }
    const file = Array.from(fileList)[0];
    if (!file) return;
    const mode = getDefaultMode(file);
    addTask({ file, mode, targetFormat: inferOutput(mode) });
  };

  const handleDownload = (task: ConversionTask) => {
    // allow download to start, then reset queue
    setTimeout(() => {
      clearQueue();
    }, 0);
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const formatsByMode = useMemo(
    () => ({
      audio: audioOutputFormats,
      extract: audioOutputFormats,
      video: videoOutputFormats
    }),
    []
  );

  const updateMode = (task: ConversionTask, mode: ConversionMode) => {
    updateTask(task.id, { mode, targetFormat: inferOutput(mode) });
  };

  const updateOption = (
    task: ConversionTask,
    partial: Partial<ConversionTask["options"]>
  ) => {
    updateTask(task.id, { options: { ...task.options, ...partial } });
  };

  const renderTaskCard = (task: ConversionTask) => {
    const isProcessing = task.status === "processing";
    const canStart = ["idle", "error", "canceled"].includes(task.status);
    const showDownload = task.status === "completed" && task.outputUrl;

    return (
      <div key={task.id} className="card" style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{task.file.name}</div>
            <div style={{ color: "#6b7280", fontSize: 13 }}>
              {(task.sizeBefore ?? 0) / 1024 ** 2 < 0.1
                ? `${task.sizeBefore ?? 0} bytes`
                : `${((task.sizeBefore ?? 0) / 1024 ** 2).toFixed(2)} MB`}{" "}
              - {task.file.type || "Unknown"} - {modeLabel[task.mode]}
            </div>
          </div>
          <button
            className="button ghost"
            onClick={() => removeTask(task.id)}
            aria-label="Remove file from queue"
          >
            x
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
            marginTop: 12
          }}
        >
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 600 }}>Mode</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(Object.keys(modeLabel) as ConversionMode[]).map((mode) => (
                <button
                  key={mode}
                  className="button secondary"
                  style={{
                    padding: "10px 12px",
                    borderColor: task.mode === mode ? "var(--accent)" : "var(--border)",
                    color: task.mode === mode ? "var(--accent-strong)" : "inherit"
                  }}
                  onClick={() => updateMode(task, mode)}
                >
                  {modeLabel[mode]}
                </button>
              ))}
            </div>
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 600 }}>Target format</span>
            <select
              value={task.targetFormat}
              onChange={(e) => updateTask(task.id, { targetFormat: e.target.value as OutputFormat })}
              style={{
                padding: "12px 10px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                fontWeight: 600
              }}
            >
              {formatsByMode[task.mode].map((format) => (
                <option key={format} value={format}>
                  {format.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 600 }}>{t("presets")}</span>
            <select
              value={task.preset}
              onChange={(e) => {
                const presetId = e.target.value as any;
                const preset = presets.find((p) => p.id === presetId);
                updateTask(task.id, {
                  preset: presetId,
                  options: {
                    ...task.options,
                    bitrate: preset?.bitrate,
                    sampleRate: preset?.sampleRate,
                    videoBitrate: preset?.videoBitrate
                  }
                });
              }}
              style={{
                padding: "12px 10px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                fontWeight: 600
              }}
            >
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label} - {preset.description}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          className="button ghost"
          onClick={() => setExpandedId(expandedId === task.id ? null : task.id)}
          aria-expanded={expandedId === task.id}
          style={{ marginTop: 10, paddingLeft: 0 }}
        >
          {t("advanced")} {expandedId === task.id ? "^" : "v"}
        </button>

        {expandedId === task.id && (
          <div className="card" style={{ padding: 14, marginTop: 10 }}>
            <div
              style={{
                display: "grid",
                gap: 12,
                gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))"
              }}
            >
              <label style={{ display: "grid", gap: 6 }}>
                <span>Bitrate</span>
                <select
                  value={task.options.bitrate ?? ""}
                  onChange={(e) =>
                    updateOption(task, {
                      bitrate: e.target.value ? Number(e.target.value) : undefined
                    })
                  }
                  style={{ padding: 10, borderRadius: 10, border: "1px solid var(--border)" }}
                >
                  <option value="">Auto</option>
                  {bitratePresets.map((v) => (
                    <option key={v} value={v}>
                      {v} kbps
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span>Sample rate</span>
                <select
                  value={task.options.sampleRate ?? ""}
                  onChange={(e) =>
                    updateOption(task, {
                      sampleRate: e.target.value ? Number(e.target.value) : undefined
                    })
                  }
                  style={{ padding: 10, borderRadius: 10, border: "1px solid var(--border)" }}
                >
                  <option value="">Keep original</option>
                  {sampleRatePresets.map((v) => (
                    <option key={v} value={v}>
                      {v / 1000} kHz
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span>Channels</span>
                <select
                  value={task.options.channels ?? ""}
                  onChange={(e) =>
                    updateOption(task, {
                      channels: e.target.value ? (Number(e.target.value) as 1 | 2) : undefined
                    })
                  }
                  style={{ padding: 10, borderRadius: 10, border: "1px solid var(--border)" }}
                >
                  <option value="">Auto</option>
                  <option value="1">Mono</option>
                  <option value="2">Stereo</option>
                </select>
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span>Resolution</span>
                <select
                  value={task.options.resolution ?? "original"}
                  onChange={(e) => updateOption(task, { resolution: e.target.value })}
                  style={{ padding: 10, borderRadius: 10, border: "1px solid var(--border)" }}
                >
                  {resolutionPresets.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span>Frame rate</span>
                <select
                  value={task.options.fps ?? ""}
                  onChange={(e) =>
                    updateOption(task, { fps: e.target.value ? Number(e.target.value) : undefined })
                  }
                  style={{ padding: 10, borderRadius: 10, border: "1px solid var(--border)" }}
                >
                  <option value="">Keep original</option>
                  {frameRatePresets.map((r) => (
                    <option key={r} value={r}>
                      {r} fps
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span>{t("trim")} (seconds)</span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <input
                    type="number"
                    min={0}
                    aria-label="Trim start"
                    placeholder="Start"
                    value={task.options.trimStart ?? ""}
                    onChange={(e) =>
                      updateOption(task, {
                        trimStart: e.target.value ? Number(e.target.value) : undefined
                      })
                    }
                    style={{ padding: 10, borderRadius: 10, border: "1px solid var(--border)" }}
                  />
                  <input
                    type="number"
                    min={0}
                    aria-label="Trim end"
                    placeholder="End"
                    value={task.options.trimEnd ?? ""}
                    onChange={(e) =>
                      updateOption(task, {
                        trimEnd: e.target.value ? Number(e.target.value) : undefined
                      })
                    }
                    style={{ padding: 10, borderRadius: 10, border: "1px solid var(--border)" }}
                  />
                </div>
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span>{t("volume")}</span>
                <input
                  type="range"
                  min={0.2}
                  max={2}
                  step={0.1}
                  value={task.options.volume ?? 1}
                  onChange={(e) => updateOption(task, { volume: Number(e.target.value) })}
                />
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  {(task.options.volume ?? 1).toFixed(1)}x
                </div>
              </label>
            </div>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
          <div style={{ flex: 1, background: "#e5e7eb", height: 10, borderRadius: 999 }}>
            <div
              role="progressbar"
              aria-valuenow={task.progress}
              style={{
                width: `${task.progress}%`,
                background: "linear-gradient(120deg,#0f766e,#0e645d)",
                height: "100%",
                borderRadius: 999,
                transition: "width 160ms ease"
              }}
            />
          </div>
          <div style={{ minWidth: 80, fontWeight: 700 }}>
            {task.progress}% {task.message}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          <button
            className="button primary"
            onClick={() => startTask(task.id)}
            disabled={isProcessing || task.status === "processing"}
            aria-label="Start conversion"
          >
            {canStart ? t("start") : "Queued"}
          </button>
          {isProcessing ? (
            <button className="button secondary" onClick={() => cancelTask(task.id)}>
              {t("cancel")}
            </button>
          ) : (
            <button
              className="button secondary"
              onClick={() => retryTask(task.id)}
              disabled={task.status === "idle"}
            >
              {t("retry")}
            </button>
          )}
          {showDownload && (
            <a
              className="button secondary"
              href={task.outputUrl}
              download={task.outputName}
              aria-label={`Download ${task.outputName}`}
              onClick={() => handleDownload(task)}
            >
              {t("download")}
            </a>
          )}
        </div>
      </div>
    );
  };

  return (
    <section id="converter" className="section" aria-labelledby="converter-title">
      <div className="container">
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="pill">{t("localOnly")}</div>
              <h2 id="converter-title" style={{ margin: "10px 0" }}>
                Converter & Queue
              </h2>
              <p style={{ color: "#6b7280", maxWidth: 640 }}>
                Drag files or browse to add them to the queue. Configure presets, trim, change
                bitrate or resolution, then convert everything inside your browser - nothing is
                uploaded.
              </p>
            </div>
            <button className="button secondary" onClick={clearQueue}>
              Clear queue
            </button>
          </div>

          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
            aria-label={t("dropTitle")}
            style={{
              marginTop: 12,
              border: `2px dashed ${isDragging ? "var(--accent)" : "var(--border)"}`,
              borderRadius: 16,
              padding: "26px",
              background: isDragging ? "rgba(15,118,110,0.05)" : "transparent",
              textAlign: "center",
              cursor: "pointer"
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 18 }}>{t("dropTitle")}</div>
            <div style={{ color: "#6b7280", marginTop: 6 }}>{t("dropHint")}</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 14 }}>
              <button className="button primary">{t("ctaStart")}</button>
              <button className="button secondary">Browse files</button>
            </div>
            <input
              ref={inputRef}
              type="file"
              multiple
              style={{ display: "none" }}
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {lastError && (
            <div
              className="card"
              style={{
                marginTop: 12,
                padding: 12,
                borderLeft: "4px solid #f97316",
                background: "#fff7ed"
              }}
              role="alert"
            >
              <strong>FFmpeg</strong>: {lastError}
            </div>
          )}

          {tasks.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "30px 10px",
                color: "#6b7280"
              }}
            >
              No files in queue yet.
            </div>
          ) : (
            <div className="grid" style={{ marginTop: 14 }}>
              {tasks.map((task) => renderTaskCard(task))}
            </div>
          )}

          {tasks.length > 0 && (
            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="button primary" onClick={() => {
                // eslint-disable-next-line no-console
                console.log("[ConverterPanel] Convert all button clicked, tasks:", tasks.length);
                startAll();
              }} disabled={isLoading}>
                Convert all
              </button>
              {isLoading && <div>Loading FFmpeg (first run)...</div>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
