import React from "react";

export const Footer: React.FC = () => (
  <footer
    className="section"
    style={{ paddingTop: 32, paddingBottom: 32, background: "#0f172a", color: "white" }}
  >
    <div className="container" style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 240 }}>
        <div style={{ fontWeight: 800, letterSpacing: "-0.02em" }}>Browser Converter</div>
        <div style={{ color: "rgba(255,255,255,0.72)", marginTop: 6 }}>
          Privacy-first, in-browser audio & video transcoder.
        </div>
      </div>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <a href="mailto:hello@example.com" style={{ color: "white" }}>
          Contact
        </a>
        <a href="#privacy" style={{ color: "white" }}>
          Privacy Policy
        </a>
        <a href="#terms" style={{ color: "white" }}>
          Terms
        </a>
      </div>
      <div style={{ color: "rgba(255,255,255,0.6)" }}>(c) {new Date().getFullYear()} AV Tools</div>
    </div>
  </footer>
);
