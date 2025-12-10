import React from "react";

const steps = [
  {
    title: "Drop files",
    text: "Upload locally via drag-and-drop or browse. Files stay on your device."
  },
  {
    title: "Choose target",
    text: "Pick output format, presets, and adjust bitrate, sample rate, resolution, or trim."
  },
  {
    title: "Convert in-browser",
    text: "FFmpeg.wasm runs inside your tab. Progress and estimated size appear as it works."
  },
  {
    title: "Download instantly",
    text: "Save the converted file - nothing touches a server. Great for private media."
  }
];

export const HowItWorks: React.FC = () => (
  <section id="how" className="section" aria-labelledby="how-title">
    <div className="container">
      <h2 id="how-title" style={{ marginBottom: 14 }}>
        How it works
      </h2>
      <div
        className="grid"
        style={{ gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }}
      >
        {steps.map((step, index) => (
          <div key={step.title} className="card" style={{ padding: 16 }}>
            <div className="pill" aria-hidden="true">
              Step {index + 1}
            </div>
            <h3 style={{ margin: "10px 0 6px" }}>{step.title}</h3>
            <p style={{ color: "#6b7280" }}>{step.text}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);
