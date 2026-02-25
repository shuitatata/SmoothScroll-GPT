import { createHash } from "node:crypto";
import { readFile, mkdir, rm, writeFile, access } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const distRoot = path.join(root, "dist");
const releaseDir = path.join(root, "release");

async function readVersion() {
  const raw = await readFile(path.join(root, "package.json"), "utf8");
  const parsed = JSON.parse(raw);
  if (!parsed.version) {
    throw new Error("package.json 缺少 version 字段");
  }
  return String(parsed.version);
}

async function ensureBuildOutput(browser) {
  const manifestPath = path.join(distRoot, browser, "extension", "manifest.json");
  try {
    await access(manifestPath);
  } catch {
    throw new Error(`缺少 ${browser} 构建产物，请先执行 npm run build:chromium`);
  }
}

function zipDirectory(sourceDir, outputZip) {
  return new Promise((resolve, reject) => {
    const child = spawn("zip", ["-qr", outputZip, "."], {
      cwd: sourceDir,
      stdio: "inherit",
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`zip 打包失败，退出码：${code}`));
    });

    child.on("error", reject);
  });
}

async function sha256(filePath) {
  const buffer = await readFile(filePath);
  return createHash("sha256").update(buffer).digest("hex");
}

const version = await readVersion();
await ensureBuildOutput("chrome");
await ensureBuildOutput("edge");

await rm(releaseDir, { recursive: true, force: true });
await mkdir(releaseDir, { recursive: true });

const chromeSource = path.join(distRoot, "chrome", "extension");
const edgeSource = path.join(distRoot, "edge", "extension");
const chromeZipName = `smoothscroll-gpt-chrome-v${version}.zip`;
const edgeZipName = `smoothscroll-gpt-edge-v${version}.zip`;
const chromeZipPath = path.join(releaseDir, chromeZipName);
const edgeZipPath = path.join(releaseDir, edgeZipName);

await zipDirectory(chromeSource, chromeZipPath);
await zipDirectory(edgeSource, edgeZipPath);

const chromeHash = await sha256(chromeZipPath);
const edgeHash = await sha256(edgeZipPath);
const checksumContent = `${chromeHash}  ${chromeZipName}\n${edgeHash}  ${edgeZipName}\n`;
await writeFile(path.join(releaseDir, "SHA256SUMS.txt"), checksumContent, "utf8");

console.log(`打包完成：${chromeZipPath}`);
console.log(`打包完成：${edgeZipPath}`);
console.log(`校验文件：${path.join(releaseDir, "SHA256SUMS.txt")}`);
