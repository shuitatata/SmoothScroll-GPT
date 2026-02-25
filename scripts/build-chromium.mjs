import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const sourceDir = path.join(root, "extension");
const distRoot = path.join(root, "dist");

async function buildTarget(browser) {
  const targetDir = path.join(distRoot, browser, "extension");
  await rm(targetDir, { recursive: true, force: true });
  await mkdir(path.dirname(targetDir), { recursive: true });
  await cp(sourceDir, targetDir, { recursive: true });
  console.log(`构建完成：dist/${browser}/extension`);
}

await buildTarget("chrome");
await buildTarget("edge");
