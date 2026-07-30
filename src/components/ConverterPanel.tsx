import React, { useEffect, useMemo, useRef, useState } from "react";
import { useConversionQueue } from "../hooks/useConversionQueue";
import {
  audioOutputFormats,
  bitratePresets,
  frameRatePresets,
  presets,
  resolutionPresets,
  sampleRatePresets,
  videoOutputFormats
} from "../utils/options";
import { ConversionMode, ConversionTask, OutputFormat, PresetId } from "../types";
import {
  formatFileSize,
  getConversionMode,
  getFileBaseName,
  getPreflightWarnings,
  MAX_FILES_PER_BATCH,
  validateFiles
} from "../utils/media";

const modeLabels: Record<ConversionMode, string> = {
  audio: "音频转换",
  video: "视频转换",
  extract: "提取音频"
};

const statusLabels: Record<ConversionTask["status"], string> = {
  idle: "待配置",
  queued: "等待中",
  processing: "转换中",
  completed: "已完成",
  error: "失败",
  canceled: "已取消"
};

const inferOutput = (mode: ConversionMode): OutputFormat => (mode === "video" ? "mp4" : "mp3");

const presetOptions = (presetId: PresetId) => {
  const preset = presets.find((item) => item.id === presetId);
  return {
    bitrate: preset?.bitrate,
    sampleRate: preset?.sampleRate,
    videoBitrate: preset?.videoBitrate
  };
};

export const ConverterPanel: React.FC = () => {
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
    moveTask,
    isLoading,
    lastError
  } = useConversionQueue();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [downloadNote, setDownloadNote] = useState<string | null>(null);
  const [defaultPreset, setDefaultPreset] = useState<PresetId>(() => {
    if (typeof window === "undefined") return "balanced";
    const stored = window.localStorage.getItem("audio-convert.default-preset");
    return stored === "high" || stored === "small" || stored === "balanced" ? stored : "balanced";
  });
  const [nameSuffix, setNameSuffix] = useState(() =>
    typeof window === "undefined" ? "" : window.localStorage.getItem("audio-convert.name-suffix") ?? ""
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedTask = tasks.find((task) => task.id === selectedId) ?? null;
  const preflightWarnings = selectedTask ? getPreflightWarnings(selectedTask) : [];
  const hasBlockingPreflight = tasks.some((task) => getPreflightWarnings(task).some((warning) => warning.includes("结束时间")));
  const formatsByMode = useMemo(
    () => ({ audio: audioOutputFormats, extract: audioOutputFormats, video: videoOutputFormats }),
    []
  );
  const summary = useMemo(
    () => ({
      ready: tasks.filter((task) => task.status === "idle").length,
      active: tasks.filter((task) => ["queued", "processing"].includes(task.status)).length,
      complete: tasks.filter((task) => task.status === "completed").length
    }),
    [tasks]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "o") {
        event.preventDefault();
        inputRef.current?.click();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("audio-convert.default-preset", defaultPreset);
  }, [defaultPreset]);

  useEffect(() => {
    window.localStorage.setItem("audio-convert.name-suffix", nameSuffix);
  }, [nameSuffix]);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const { accepted, errors } = validateFiles(Array.from(fileList), tasks.length);
    setFileErrors(errors);
    const nextTask = accepted[0];
    accepted.forEach((file) => {
      const mode = getConversionMode(file);
      if (!mode) return;
      const id = addTask({ file, mode, targetFormat: inferOutput(mode), preset: defaultPreset });
      if (file === nextTask) setSelectedId(id);
    });
  };

  const updateOption = (task: ConversionTask, partial: Partial<ConversionTask["options"]>) => {
    updateTask(task.id, { options: { ...task.options, ...partial } });
  };

  const setPreset = (task: ConversionTask, preset: PresetId) => {
    updateTask(task.id, { preset, options: { ...task.options, ...presetOptions(preset) } });
  };

  const setMode = (task: ConversionTask, mode: ConversionMode) => {
    updateTask(task.id, { mode, targetFormat: inferOutput(mode) });
  };

  const applyPresetToWaiting = (preset: PresetId) => {
    tasks
      .filter((task) => ["idle", "error", "canceled"].includes(task.status))
      .forEach((task) => setPreset(task, preset));
  };

  const downloadCompleted = () => {
    tasks.filter((task) => task.status === "completed" && task.outputUrl).forEach((task) => {
      const link = document.createElement("a");
      link.href = task.outputUrl!;
      link.download = task.outputName ?? task.file.name;
      link.click();
    });
    setDownloadNote("已请求下载全部结果；浏览器可能会要求允许多个文件下载。");
  };

  const clearCompleted = () => {
    tasks.filter((task) => task.status === "completed").forEach((task) => removeTask(task.id));
  };

  const applyNameSuffix = () => {
    tasks
      .filter((task) => ["idle", "error", "canceled"].includes(task.status))
      .forEach((task) => updateTask(task.id, { outputBaseName: `${getFileBaseName(task.file.name)}${nameSuffix}` }));
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  return (
    <section id="converter" className="converter-workspace" aria-labelledby="converter-title">
      <div className="workspace-titlebar">
        <div>
          <p className="eyebrow">本地音视频处理</p>
          <h1 id="converter-title">转换工作区</h1>
          <p className="workspace-subtitle">拖入文件，选择输出，结果只保留在当前浏览器中。</p>
        </div>
        <div className="workspace-actions">
          <button className="button secondary" type="button" onClick={() => inputRef.current?.click()}>
            添加文件 <kbd>⌘ / Ctrl O</kbd>
          </button>
          <button className="button primary" type="button" onClick={startAll} disabled={summary.active > 0 || tasks.length === 0 || hasBlockingPreflight}>
            {summary.active > 0 ? "正在处理队列" : "转换全部"}
          </button>
        </div>
      </div>

      <div className="workspace-summary" aria-label="队列状态">
        <span><strong>{tasks.length}</strong> 个文件</span>
        <span><strong>{summary.ready}</strong> 待开始</span>
        <span><strong>{summary.active}</strong> 进行中</span>
        <span><strong>{summary.complete}</strong> 已完成</span>
      </div>

      <div className="workspace-grid">
        <aside className="queue-pane" aria-label="转换队列">
          <div
            className={`drop-zone ${isDragging ? "is-dragging" : ""}`}
            onDrop={onDrop}
            onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
          >
            <span className="drop-zone-icon" aria-hidden="true">↓</span>
            <strong>拖放文件到这里</strong>
            <span>或从设备中选择。最多 {MAX_FILES_PER_BATCH} 个，单个不超过 2 GB。</span>
            <button className="button secondary" type="button" onClick={() => inputRef.current?.click()}>选择文件</button>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="audio/*,video/*,.oga,.aiff,.mkv,.flv,.wmv"
              onChange={(event) => { handleFiles(event.target.files); event.currentTarget.value = ""; }}
            />
          </div>

          {fileErrors.length > 0 && (
            <div className="inline-alert" role="alert">
              <strong>部分文件未加入</strong>
              <ul>{fileErrors.map((error) => <li key={error}>{error}</li>)}</ul>
            </div>
          )}
          {lastError && <div className="inline-alert" role="alert"><strong>FFmpeg：</strong>{lastError}</div>}
          {downloadNote && <div className="inline-notice" role="status">{downloadNote}</div>}

          <div className="queue-toolbar">
            <h2>队列</h2>
            <div>
              <button className="text-button" type="button" onClick={clearCompleted} disabled={summary.complete === 0}>清除完成项</button>
              <button className="text-button danger" type="button" onClick={clearQueue} disabled={tasks.length === 0}>清空</button>
            </div>
          </div>

          <div className="task-list" aria-live="polite">
            {tasks.length === 0 ? (
              <p className="empty-queue">尚未添加文件。选择一个音频或视频文件开始。</p>
            ) : tasks.map((task, index) => (
              <div key={task.id} className={`task-row ${selectedId === task.id ? "is-selected" : ""}`}>
              <button type="button" className="task-select" onClick={() => setSelectedId(task.id)}>
                <span className="task-row-main">
                  <strong title={task.file.name}>{task.file.name}</strong>
                  <small>{formatFileSize(task.sizeBefore ?? task.file.size)} · {modeLabels[task.mode]}</small>
                </span>
                <span className={`status status-${task.status}`}>{statusLabels[task.status]}</span>
                {task.status === "processing" && <span className="task-progress" style={{ "--progress": `${task.progress}%` } as React.CSSProperties} />}
              </button>
              <div className="task-order" aria-label={`${task.file.name} 的队列顺序`}>
                <button type="button" className="order-button" onClick={() => moveTask(task.id, -1)} disabled={index === 0 || !["idle", "error", "canceled"].includes(task.status)} aria-label="上移">↑</button>
                <button type="button" className="order-button" onClick={() => moveTask(task.id, 1)} disabled={index === tasks.length - 1 || !["idle", "error", "canceled"].includes(task.status)} aria-label="下移">↓</button>
              </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="editor-pane" aria-label="转换设置">
          {selectedTask ? (
            <TaskEditor
              task={selectedTask}
              formats={formatsByMode[selectedTask.mode]}
              onModeChange={setMode}
              onPresetChange={setPreset}
              onUpdate={(updates) => updateTask(selectedTask.id, updates)}
              onOptionChange={(updates) => updateOption(selectedTask, updates)}
              onStart={() => startTask(selectedTask.id)}
              onCancel={() => cancelTask(selectedTask.id)}
              onRetry={() => retryTask(selectedTask.id)}
              onRemove={() => removeTask(selectedTask.id)}
              preflightWarnings={preflightWarnings}
            />
          ) : (
            <div className="editor-empty">
              <span aria-hidden="true">↙</span>
              <h2>从队列中选择一个文件</h2>
              <p>在这里设置转换类型、输出格式、质量预设与高级参数。</p>
            </div>
          )}
        </section>

        <aside className="activity-pane" aria-label="批次操作和支持格式">
          <section>
            <p className="eyebrow">批次操作</p>
            <h2>统一设置</h2>
            <p>将质量预设应用到所有未开始、失败或已取消的任务。</p>
            <div className="preset-actions">
              {presets.map((preset) => (
                <button key={preset.id} type="button" className="preset-option" onClick={() => applyPresetToWaiting(preset.id)}>
                  <strong>{preset.label}</strong>
                  <span>{preset.description}</span>
                </button>
              ))}
            </div>
            <label className="preference-select"><span>新文件默认预设</span><select value={defaultPreset} onChange={(event) => setDefaultPreset(event.target.value as PresetId)}>{presets.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}</select></label>
          </section>
          <section className="naming-panel">
            <h2>批量命名</h2>
            <p>为未开始、失败或已取消的任务追加相同后缀。</p>
            <div><input aria-label="文件名后缀" value={nameSuffix} maxLength={40} placeholder="例如 -converted" onChange={(event) => setNameSuffix(event.target.value)} /><button className="button secondary" type="button" onClick={applyNameSuffix} disabled={tasks.length === 0 || nameSuffix.trim().length === 0}>应用</button></div>
          </section>
          <section className="download-panel">
            <h2>结果</h2>
            <p>{summary.complete > 0 ? `${summary.complete} 个转换结果可下载。` : "完成后的文件会出现在这里。"}</p>
            <button className="button secondary" type="button" onClick={downloadCompleted} disabled={summary.complete === 0}>下载全部</button>
          </section>
          <section className="format-reference">
            <h2>常用输出</h2>
            <p><strong>音频</strong> MP3、WAV、FLAC、AAC、M4A、OPUS</p>
            <p><strong>视频</strong> MP4、WebM、MOV、MKV</p>
            <small>编解码器成功率取决于浏览器与 FFmpeg.wasm 构建。</small>
          </section>
        </aside>
      </div>

      {isLoading && <div className="loading-bar" role="status">正在首次加载 FFmpeg 核心，请保持页面打开。</div>}
    </section>
  );
};

type TaskEditorProps = {
  task: ConversionTask;
  formats: OutputFormat[];
  onModeChange: (task: ConversionTask, mode: ConversionMode) => void;
  onPresetChange: (task: ConversionTask, preset: PresetId) => void;
  onUpdate: (updates: Partial<ConversionTask>) => void;
  onOptionChange: (updates: Partial<ConversionTask["options"]>) => void;
  onStart: () => void;
  onCancel: () => void;
  onRetry: () => void;
  onRemove: () => void;
  preflightWarnings: string[];
};

const TaskEditor: React.FC<TaskEditorProps> = ({ task, formats, onModeChange, onPresetChange, onUpdate, onOptionChange, onStart, onCancel, onRetry, onRemove, preflightWarnings }) => {
  const isProcessing = task.status === "processing";
  const locked = isProcessing || task.status === "queued";
  const canStart = ["idle", "error", "canceled"].includes(task.status);
  const supportsVideo = task.mode === "video";

  return (
    <div className="task-editor">
      <div className="editor-heading">
        <div>
          <p className="eyebrow">当前文件</p>
          <h2 title={task.file.name}>{task.file.name}</h2>
          <p>{formatFileSize(task.sizeBefore ?? task.file.size)} · {task.file.type || "已识别媒体文件"}</p>
        </div>
        <button type="button" className="icon-button" onClick={onRemove} disabled={isProcessing} aria-label="从队列移除文件">×</button>
      </div>

      <fieldset disabled={locked}>
        <legend>转换类型</legend>
        <div className="mode-switcher">
          {(Object.keys(modeLabels) as ConversionMode[]).map((mode) => (
            <button key={mode} type="button" className={task.mode === mode ? "is-active" : ""} onClick={() => onModeChange(task, mode)}>
              {modeLabels[mode]}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="settings-grid">
        <label className="output-name-field">
          <span>输出文件名</span>
          <input value={task.outputBaseName} maxLength={120} disabled={locked} onChange={(event) => onUpdate({ outputBaseName: event.target.value })} />
          <small>将自动添加 .{task.targetFormat} 扩展名</small>
        </label>
        <label>
          <span>输出格式</span>
          <select value={task.targetFormat} onChange={(event) => onUpdate({ targetFormat: event.target.value as OutputFormat })} disabled={locked}>
            {formats.map((format) => <option key={format} value={format}>{format.toUpperCase()}</option>)}
          </select>
        </label>
        <label>
          <span>质量预设</span>
          <select value={task.preset} onChange={(event) => onPresetChange(task, event.target.value as PresetId)} disabled={locked}>
            {presets.map((preset) => <option key={preset.id} value={preset.id}>{preset.label} — {preset.description}</option>)}
          </select>
        </label>
      </div>

      <details className="advanced-settings" open>
        <summary>高级参数</summary>
        <div className="settings-grid">
          <label><span>音频码率</span><select value={task.options.bitrate ?? ""} disabled={locked} onChange={(event) => onOptionChange({ bitrate: event.target.value ? Number(event.target.value) : undefined })}><option value="">自动</option>{bitratePresets.map((value) => <option key={value} value={value}>{value} kbps</option>)}</select></label>
          <label><span>采样率</span><select value={task.options.sampleRate ?? ""} disabled={locked} onChange={(event) => onOptionChange({ sampleRate: event.target.value ? Number(event.target.value) : undefined })}><option value="">保持原始</option>{sampleRatePresets.map((value) => <option key={value} value={value}>{value / 1000} kHz</option>)}</select></label>
          <label><span>声道</span><select value={task.options.channels ?? ""} disabled={locked} onChange={(event) => onOptionChange({ channels: event.target.value ? Number(event.target.value) as 1 | 2 : undefined })}><option value="">自动</option><option value="1">单声道</option><option value="2">立体声</option></select></label>
          <label><span>音量</span><div className="range-control"><input type="range" min="0.2" max="2" step="0.1" value={task.options.volume ?? 1} disabled={locked} onChange={(event) => onOptionChange({ volume: Number(event.target.value) })} /><output>{(task.options.volume ?? 1).toFixed(1)}×</output></div></label>
          <label className="toggle-setting"><span>响度标准化</span><input type="checkbox" checked={task.options.normalizeAudio ?? false} disabled={locked} onChange={(event) => onOptionChange({ normalizeAudio: event.target.checked })} /><small>将音频调整到适合日常聆听的响度</small></label>
          <label><span>起始时间（秒）</span><input type="number" min="0" placeholder="从头开始" value={task.options.trimStart ?? ""} disabled={locked} onChange={(event) => onOptionChange({ trimStart: event.target.value ? Number(event.target.value) : undefined })} /></label>
          <label><span>结束时间（秒）</span><input type="number" min="0" placeholder="到结尾" value={task.options.trimEnd ?? ""} disabled={locked} onChange={(event) => onOptionChange({ trimEnd: event.target.value ? Number(event.target.value) : undefined })} /></label>
          <label className={!supportsVideo ? "is-disabled" : ""}><span>分辨率</span><select value={task.options.resolution ?? "original"} disabled={locked || !supportsVideo} onChange={(event) => onOptionChange({ resolution: event.target.value })}>{resolutionPresets.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          <label className={!supportsVideo ? "is-disabled" : ""}><span>帧率</span><select value={task.options.fps ?? ""} disabled={locked || !supportsVideo} onChange={(event) => onOptionChange({ fps: event.target.value ? Number(event.target.value) : undefined })}><option value="">保持原始</option>{frameRatePresets.map((value) => <option key={value} value={value}>{value} fps</option>)}</select></label>
          <label className={!supportsVideo ? "is-disabled" : ""}><span>旋转</span><select value={task.options.rotation ?? "none"} disabled={locked || !supportsVideo} onChange={(event) => onOptionChange({ rotation: event.target.value as "none" | "90" | "180" | "270" })}><option value="none">不旋转</option><option value="90">顺时针 90°</option><option value="180">旋转 180°</option><option value="270">逆时针 90°</option></select></label>
          <label className={`toggle-setting ${!supportsVideo ? "is-disabled" : ""}`}><span>水平镜像</span><input type="checkbox" checked={task.options.mirror ?? false} disabled={locked || !supportsVideo} onChange={(event) => onOptionChange({ mirror: event.target.checked })} /><small>左右翻转画面</small></label>
        </div>
      </details>

      {preflightWarnings.length > 0 && <div className="inline-alert preflight-alert" role="status"><strong>转换前提示</strong><ul>{preflightWarnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div>}

      <div className="editor-footer">
        <div className="conversion-status">
          <span className={`status status-${task.status}`}>{statusLabels[task.status]}</span>
          <span>{task.message ?? "等待操作"}</span>
        </div>
        <div className="progress-track"><span style={{ width: `${task.progress}%` }} /></div>
        <div className="editor-actions">
          {canStart && <button type="button" className="button primary" onClick={onStart} disabled={preflightWarnings.some((warning) => warning.includes("结束时间"))}>开始转换</button>}
          {isProcessing && <button type="button" className="button secondary" onClick={onCancel}>取消转换</button>}
          {["error", "canceled"].includes(task.status) && <button type="button" className="button secondary" onClick={onRetry}>重新加入队列</button>}
          {task.status === "completed" && task.outputUrl && <a className="button primary" href={task.outputUrl} download={task.outputName}>下载文件</a>}
        </div>
      </div>
    </div>
  );
};
