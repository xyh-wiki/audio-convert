#!/usr/bin/env node

/**
 * Post-build script to ensure FFmpeg assets are properly copied to dist
 * This ensures the FFmpeg core files are available in the production build
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const srcAssetsDir = path.join(projectRoot, "src", "assets", "ffmpeg");
const publicFfmpegDir = path.join(projectRoot, "public", "ffmpeg");

const copyDir = (src, dest) => {
  if (!fs.existsSync(src)) {
    console.warn(`Source directory not found: ${src}`);
    return 0;
  }

  let count = 0;

  const walk = (currentSrc, currentDest) => {
    const entries = fs.readdirSync(currentSrc, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(currentSrc, entry.name);
      const destPath = path.join(currentDest, entry.name);
      if (entry.isDirectory()) {
        if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });
        walk(srcPath, destPath);
      } else if (entry.isFile()) {
        const destDirPath = path.dirname(destPath);
        if (!fs.existsSync(destDirPath)) fs.mkdirSync(destDirPath, { recursive: true });
        fs.copyFileSync(srcPath, destPath);
        // eslint-disable-next-line no-console
        console.log(`Copied: ${destPath}`);
        count += 1;
      }
    }
  };

  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  walk(src, dest);
  return count;
};

try {
  const ffmpegDistDir = path.join(distDir, "ffmpeg");
  let total = 0;

  // Copy from src/assets/ffmpeg
  if (fs.existsSync(srcAssetsDir)) {
    console.log(`Copying FFmpeg assets from ${srcAssetsDir}...`);
    total += copyDir(srcAssetsDir, ffmpegDistDir);
  }

  // Copy from public/ffmpeg
  if (fs.existsSync(publicFfmpegDir)) {
    console.log(`Copying FFmpeg assets from ${publicFfmpegDir}...`);
    total += copyDir(publicFfmpegDir, ffmpegDistDir);
  }

  if (total === 0) {
    console.warn("No FFmpeg assets were copied — check that src/assets/ffmpeg or public/ffmpeg exist and contain files.");
  } else {
    console.log(`FFmpeg assets copy completed successfully! ${total} files copied.`);
  }
} catch (error) {
  console.error("Error copying FFmpeg assets:", error);
  process.exit(1);
}
