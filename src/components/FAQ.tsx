import React from "react";

const faqs = [
  {
    q: "Is this converter really running in my browser only?",
    a: "Yes. All processing uses WebAssembly in your tab. Media files never leave your device."
  },
  {
    q: "Are my files uploaded to a server?",
    a: "No uploads happen. After conversion, you download directly from memory to disk."
  },
  {
    q: "Why is conversion slow for large files?",
    a: "Video transcoding is CPU intensive. Keep the tab active; modern browsers will speed up with hardware resources available."
  },
  {
    q: "What file size limits are recommended?",
    a: "Large HD videos work, but RAM usage grows with file size. For smoother results, keep inputs under ~1-2 GB."
  },
  {
    q: "Why are some formats not supported in my browser?",
    a: "Codec availability depends on your hardware and FFmpeg build. Unsupported codecs will show an error; try a different output format."
  }
];

export const FAQ: React.FC = () => (
  <section id="faq" className="section" aria-labelledby="faq-title">
    <div className="container">
      <h2 id="faq-title" style={{ marginBottom: 14 }}>
        FAQ
      </h2>
      <div className="grid" style={{ gap: 12 }}>
        {faqs.map((item) => (
          <details key={item.q} className="card" style={{ padding: 14 }}>
            <summary style={{ fontWeight: 700 }}>{item.q}</summary>
            <p style={{ color: "#6b7280" }}>{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  </section>
);
