import path from "node:path";
import { spawn } from "node:child_process";
import { access } from "node:fs/promises";

const root = process.cwd();
const extensionDir = path.join(root, "dist", "extension");
const projectLocation = path.join(root, "safari-app");

async function ensureBuildOutput() {
  try {
    await access(path.join(extensionDir, "manifest.json"));
  } catch {
    throw new Error("找不到 dist/extension/manifest.json，请先执行 npm run build");
  }
}

function runConverter() {
  return new Promise((resolve, reject) => {
    const args = [
      "safari-web-extension-converter",
      extensionDir,
      "--project-location",
      projectLocation,
      "--app-name",
      "SmoothScroll GPT",
      "--bundle-identifier",
      "com.shuitatata.smoothscrollgpt",
      "--swift",
      "--macos-only",
      "--copy-resources",
      "--no-open",
      "--no-prompt",
      "--force",
    ];

    const child = spawn("xcrun", args, {
      stdio: "inherit",
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`转换失败，退出码：${code}`));
    });

    child.on("error", (error) => {
      reject(error);
    });
  });
}

try {
  await ensureBuildOutput();
  await runConverter();
  const xcodeprojPath = path.join(projectLocation, "SmoothScroll GPT", "SmoothScroll GPT.xcodeproj");
  console.log("\n转换完成。下一步：");
  console.log(`1. 在 Xcode 打开：${xcodeprojPath}`);
  console.log("2. 运行 Scheme: SmoothScroll GPT");
  console.log("3. 在 Safari 设置中启用扩展 SmoothScroll GPT Extension");
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
