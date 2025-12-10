import React from "react";
import { useI18n } from "../services/i18n";

const navItems = [
  { href: "#converter", key: "navConverter" },
  { href: "#how", key: "navHow" },
  { href: "#formats", key: "navFormats" },
  { href: "#faq", key: "navFAQ" },
  { href: "#about", key: "navAbout" }
];

export const Header: React.FC = () => {
  const { t, locale, setLocale } = useI18n();
  return (
    <header className="container" style={{ padding: "20px 18px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 18
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              background:
                "linear-gradient(120deg, rgba(15,118,110,0.95), rgba(14,100,93,0.9))",
              display: "grid",
              placeItems: "center",
              color: "white",
              fontWeight: 800,
              letterSpacing: "-0.03em"
            }}
            aria-label="AV Converter logo"
          >
            AV
          </div>
          <div>
            <div style={{ fontWeight: 800 }}>Browser Converter</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Private. Local. Fast.</div>
          </div>
        </div>
        <nav aria-label="Primary">
          <ul
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              listStyle: "none",
              margin: 0,
              padding: 0
            }}
          >
            {navItems.map((item) => (
              <li key={item.key}>
                <a href={item.href} style={{ color: "#0f172a", fontWeight: 600 }}>
                  {t(item.key as any)}
                </a>
              </li>
            ))}
            <li>
              <div
                aria-label="Language switcher"
                style={{
                  display: "inline-flex",
                  background: "rgba(15,118,110,0.08)",
                  borderRadius: 12,
                  padding: 4,
                  gap: 6
                }}
              >
                {(["en", "zh"] as const).map((lang) => (
                  <button
                    key={lang}
                    className="button ghost"
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      background: locale === lang ? "white" : "transparent",
                      borderColor: "transparent",
                      color: locale === lang ? "#0f766e" : "#0f172a",
                      fontWeight: 700
                    }}
                    onClick={() => setLocale(lang)}
                    aria-pressed={locale === lang}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};
