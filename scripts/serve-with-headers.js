import express from "express";
import handler from "serve-handler";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware for COOP/COEP headers required for FFmpeg
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  
  // Ensure correct MIME types for FFmpeg files
  if (req.path.endsWith(".wasm")) {
    res.setHeader("Content-Type", "application/wasm");
  } else if (req.path.endsWith(".worker.js")) {
    res.setHeader("Content-Type", "application/javascript");
  }
  
  next();
});

// Serve static files with proper caching
app.use(
  express.static("dist", {
    maxAge: "1h",
    etag: false,
    setHeaders: (res, filepath) => {
      if (filepath.includes("ffmpeg")) {
        // FFmpeg assets should be cached longer as they don't change
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else if (filepath.endsWith(".html")) {
        // HTML files should not be cached
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      }
    }
  })
);

// Fallback to index.html for SPA routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  // eslint-disable-next-line no-console
  console.log(`Static server with COOP/COEP listening on ${port}`);
});
