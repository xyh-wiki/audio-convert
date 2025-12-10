import React from "react";
import {
  audioInputFormats,
  audioOutputFormats,
  videoInputFormats,
  videoOutputFormats
} from "../utils/options";

const desc: Record<string, string> = {
  mp3: "Most compatible, lossy",
  wav: "Uncompressed PCM, large",
  flac: "Lossless compression",
  aac: "Modern lossy audio",
  ogg: "Open, lossy container",
  oga: "OGG audio container",
  m4a: "AAC/ALAC in MP4",
  opus: "Low-latency, modern",
  wma: "Windows Media Audio",
  alac: "Apple lossless",
  aiff: "Uncompressed AIFF",
  mp4: "H.264 + AAC, widely supported",
  webm: "VP9/Opus, web-friendly",
  mkv: "Flexible Matroska container",
  mov: "Apple QuickTime",
  avi: "Legacy AVI container",
  flv: "Flash Video",
  wmv: "Windows Media Video"
};

type FormatListProps = { title: string; items: string[] };

const FormatList: React.FC<FormatListProps> = ({ title, items }) => (
  <div className="card" style={{ padding: 14 }}>
    <h3 style={{ margin: "0 0 10px" }}>{title}</h3>
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
      {items.map((item) => (
        <li key={item} style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 700 }}>{item.toUpperCase()}</span>
          <span style={{ color: "#6b7280" }}>{desc[item]}</span>
        </li>
      ))}
    </ul>
  </div>
);

export const SupportedFormats: React.FC = () => (
  <section id="formats" className="section" aria-labelledby="formats-title">
    <div className="container">
      <h2 id="formats-title" style={{ marginBottom: 14 }}>
        Supported formats
      </h2>
      <p style={{ color: "#6b7280", maxWidth: 720 }}>
        Convert between popular audio and video codecs directly in the browser. Format availability
        depends on your device and WebAssembly support; unsupported codecs return friendly errors.
      </p>
      <div
        className="grid"
        style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", marginTop: 14 }}
      >
        <FormatList title="Audio input" items={audioInputFormats} />
        <FormatList title="Audio output" items={audioOutputFormats} />
        <FormatList title="Video input" items={videoInputFormats} />
        <FormatList title="Video output" items={videoOutputFormats} />
      </div>
    </div>
  </section>
);
