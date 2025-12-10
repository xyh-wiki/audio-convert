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
    return;
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const files = fs.readdirSync(src, { recursive: true });
  for (const file of files) {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);

    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
    } else {
      const destDirPath = path.dirname(destPath);
      if (!fs.existsSync(destDirPath)) {
        fs.mkdirSync(destDirPath, { recursive: true });
      }
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied: ${destPath}`);
    }
  }
};

try {
  const ffmpegDistDir = path.join(distDir, "ffmpeg");

  // Copy from src/assets/ffmpeg
  if (fs.existsSync(srcAssetsDir)) {
    console.log(`Copying FFmpeg assets from ${srcAssetsDir}...`);
    copyDir(srcAssetsDir, ffmpegDistDir);
  }

  // Copy from public/ffmpeg
  if (fs.existsSync(publicFfmpegDir)) {
    console.log(`Copying FFmpeg assets from ${publicFfmpegDir}...`);
    copyDir(publicFfmpegDir, ffmpegDistDir);
  }

  console.log("FFmpeg assets copy completed successfully!");
} catch (error) {
  console.error("Error copying FFmpeg assets:", error);
  process.exit(1);
}
