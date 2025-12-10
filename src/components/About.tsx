import React from "react";

export const About: React.FC = () => (
  <section id="about" className="section" aria-labelledby="about-title">
    <div className="container">
      <h2 id="about-title" style={{ marginBottom: 14 }}>
        About & disclaimer
      </h2>
      <div className="card" style={{ padding: 16, display: "grid", gap: 12 }}>
        <p style={{ margin: 0, color: "#111827", fontWeight: 600 }}>
          This is a browser-based audio and video converter using WebAssembly (FFmpeg.wasm). It
          emphasizes privacy by keeping every operation on your device.
        </p>
        <p style={{ margin: 0, color: "#6b7280" }}>
          Performance and codec support vary by browser, CPU, memory, and GPU acceleration. If a
          format fails, try a different target (MP4 + H.264/AAC and MP3/WAV are the most reliable).
        </p>
        <p style={{ margin: 0, color: "#6b7280" }}>
          No files are stored on any server; closing the tab removes temporary data. For best
          results keep your device powered, avoid heavy multitasking, and prefer desktop browsers
          when converting lengthy 4K or multi-hour videos.
        </p>
      </div>
    </div>
  </section>
);
