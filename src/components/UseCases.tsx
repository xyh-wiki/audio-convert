import React from "react";

const items = [
  {
    title: "Extract lecture audio",
    text: "Convert MP4 or MKV into clean MP3 for note-taking or podcast-style playback."
  },
  {
    title: "Compress for publishing",
    text: "Use Balanced or Small File presets to reduce bitrate before uploading to hosting."
  },
  {
    title: "Device compatibility",
    text: "Transcode to MP4/H.264 or MP3 for legacy players and set resolution presets."
  },
  {
    title: "Clip highlights",
    text: "Trim start/end timestamps to save only the useful portion of long recordings."
  }
];

export const UseCases: React.FC = () => (
  <section className="section" aria-labelledby="usecases-title">
    <div className="container">
      <h2 id="usecases-title" style={{ marginBottom: 14 }}>
        Use cases & benefits
      </h2>
      <div
        className="grid"
        style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}
      >
        {items.map((item) => (
          <div key={item.title} className="card" style={{ padding: 16 }}>
            <h3 style={{ margin: "0 0 8px" }}>{item.title}</h3>
            <p style={{ color: "#6b7280" }}>{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);
