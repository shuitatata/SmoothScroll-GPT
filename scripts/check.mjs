import { access, readFile } from "node:fs/promises";
import path from "node:path";

const requiredPaths = [
  "AGENTS.md",
  "README.md",
  "docs/architecture.md",
  "docs/roadmap.md",
  "docs/change-log.md",
  "docs/install-chromium.md",
  "docs/release-process.md",
  "docs/perf-baseline.md",
  "extension/manifest.json",
  "extension/content-script.js",
  "extension/background.js",
  "extension/popup/popup.html",
  "extension/options/options.html",
  ".github/workflows/release-chromium.yml",
];

for (const relativePath of requiredPaths) {
  const fullPath = path.join(process.cwd(), relativePath);
  await access(fullPath);
}

const manifestRaw = await readFile(path.join(process.cwd(), "extension/manifest.json"), "utf8");
const manifest = JSON.parse(manifestRaw);

if (manifest.manifest_version !== 3) {
  throw new Error("manifest_version 必须为 3");
}

if (!Array.isArray(manifest.host_permissions) || manifest.host_permissions.length === 0) {
  throw new Error("host_permissions 不能为空");
}

if (!manifest.background || !manifest.background.service_worker) {
  throw new Error("必须配置 background.service_worker");
}

console.log("检查通过：结构与 manifest 合法");
