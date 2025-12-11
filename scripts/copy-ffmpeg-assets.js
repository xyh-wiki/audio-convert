#!/usr/bin/env node
import fs from "fs";
import path from "path";

const projectRoot = process.cwd();
const sourceDir = path.join(projectRoot, "node_modules", "@ffmpeg", "core", "dist", "esm");
const targetDir = path.join(projectRoot, "dist", "ffmpeg", "esm");

if (!fs.existsSync(sourceDir)) {
  console.error("[copy-ffmpeg-assets] Source directory not found:", sourceDir);
  process.exit(1);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    ensureDir(dest);
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
    return;
  }
  fs.copyFileSync(src, dest);
  console.log(`[copy-ffmpeg-assets] Copied: ${path.relative(projectRoot, dest)}`);
}

ensureDir(targetDir);
copyRecursive(sourceDir, targetDir);

console.log("[copy-ffmpeg-assets] FFmpeg assets copied to", targetDir);
