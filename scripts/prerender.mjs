#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const projectRoot = process.cwd();
const outputDir = path.join(projectRoot, "dist");
const serverEntry = path.join(projectRoot, ".ssr", "entry-server.js");
const indexPath = path.join(outputDir, "index.html");
const { render } = await import(pathToFileURL(serverEntry).href);
const template = await fs.readFile(indexPath, "utf8");
const markup = render();

if (!template.includes('<div id="root"></div>')) {
  throw new Error("[prerender] Vite HTML template does not contain the root element.");
}

await fs.writeFile(indexPath, template.replace('<div id="root"></div>', `<div id="root">${markup}</div>`));
await fs.rm(path.join(projectRoot, ".ssr"), { recursive: true, force: true });
console.log("[prerender] Pre-rendered homepage into dist/index.html");
