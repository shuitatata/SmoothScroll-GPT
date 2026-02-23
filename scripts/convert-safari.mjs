import path from "node:path";
import { spawn } from "node:child_process";
import { access, readFile, writeFile } from "node:fs/promises";

const root = process.cwd();
const extensionDir = path.join(root, "dist", "extension");
const projectLocation = path.join(root, "safari-app");
const APP_BUNDLE_ID = "com.shuitatata.smoothscrollgpt";
const EXT_BUNDLE_ID = "com.shuitatata.smoothscrollgpt.extension";

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

async function patchBundleIdentifiers() {
  const pbxprojPath = path.join(
    projectLocation,
    "SmoothScroll GPT",
    "SmoothScroll GPT.xcodeproj",
    "project.pbxproj",
  );
  const original = await readFile(pbxprojPath, "utf8");

  let patched = original;
  patched = patched.replaceAll(/PRODUCT_BUNDLE_IDENTIFIER = "com\.shuitatata\.SmoothScroll-GPT";/g, `PRODUCT_BUNDLE_IDENTIFIER = ${APP_BUNDLE_ID};`);
  patched = patched.replaceAll(/PRODUCT_BUNDLE_IDENTIFIER = com\.shuitatata\.smoothscrollgpt\.Extension;/g, `PRODUCT_BUNDLE_IDENTIFIER = ${EXT_BUNDLE_ID};`);
  patched = patched.replaceAll(/PRODUCT_BUNDLE_IDENTIFIER = com\.shuitatata\.SmoothScroll-GPT;/g, `PRODUCT_BUNDLE_IDENTIFIER = ${APP_BUNDLE_ID};`);

  if (patched !== original) {
    await writeFile(pbxprojPath, patched, "utf8");
  }
}

try {
  await ensureBuildOutput();
  await runConverter();
  await patchBundleIdentifiers();
  const xcodeprojPath = path.join(projectLocation, "SmoothScroll GPT", "SmoothScroll GPT.xcodeproj");
  console.log("\n转换完成。下一步：");
  console.log(`1. 在 Xcode 打开：${xcodeprojPath}`);
  console.log("2. 运行 Scheme: SmoothScroll GPT");
  console.log("3. 在 Safari 设置中启用扩展 SmoothScroll GPT Extension");
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
