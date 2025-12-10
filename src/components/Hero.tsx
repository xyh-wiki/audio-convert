import React from "react";
import { useI18n } from "../services/i18n";

export const Hero: React.FC = () => {
  const { t } = useI18n();
  return (
    <section className="section" id="top" aria-labelledby="hero-title">
      <div className="container">
        <div
          style={{
            display: "grid",
            gap: 24,
            gridTemplateColumns: "1fr",
            alignItems: "center"
          }}
        >
          <div>
            <span className="pill" aria-label="Local only processing">
              Lock {t("localOnly")}
            </span>
            <h1 id="hero-title" style={{ fontSize: 42, margin: "16px 0 12px" }}>
              {t("tagline")}
            </h1>
            <p style={{ color: "#4b5563", fontSize: 18, lineHeight: 1.6 }}>
              {t("subTagline")}
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
              <a className="button primary" href="#converter">
                {t("ctaStart")}
              </a>
              <a className="button secondary" href="#how">
                {t("ctaHow")}
              </a>
            </div>
            <div style={{ marginTop: 18, color: "#6b7280", display: "flex", gap: 14 }}>
              <div>- Works offline after load</div>
              <div>- MP3 / WAV / FLAC / MP4 / WebM</div>
              <div>- No upload, privacy-friendly</div>
            </div>
          </div>
          <div className="card" style={{ padding: 18, borderRadius: 16 }}>
            <div
              style={{
                background:
                  "radial-gradient(circle at 25% 20%, rgba(15,118,110,0.15), transparent 45%), #0f172a",
                color: "white",
                borderRadius: 14,
                padding: 18,
                minHeight: 180,
                display: "grid",
                gap: 10
              }}
            >
              <div style={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
                Browser-native conversion
              </div>
              <div style={{ color: "rgba(255,255,255,0.78)" }}>
                {"Audio <-> Audio, Video <-> Video, Video -> Audio extraction. Trim, adjust bitrate, and"}
                control resolution before exporting. Batch-ready queue with progress feedback.
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))",
                  gap: 10
                }}
              >
                <div className="tag" style={{ background: "rgba(255,255,255,0.12)", color: "white" }}>
                  MP3 - WAV - FLAC - AAC
                </div>
                <div className="tag" style={{ background: "rgba(255,255,255,0.12)", color: "white" }}>
                  MP4 - WebM - MOV - MKV
                </div>
                <div className="tag" style={{ background: "rgba(255,255,255,0.12)", color: "white" }}>
                  Trim - Volume - Queue
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
