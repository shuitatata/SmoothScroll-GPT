import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const sourceDir = path.join(root, "extension");
const distRoot = path.join(root, "dist");
const distExtension = path.join(distRoot, "extension");

await rm(distRoot, { recursive: true, force: true });
await mkdir(distRoot, { recursive: true });
await cp(sourceDir, distExtension, { recursive: true });

console.log("构建完成：dist/extension");
