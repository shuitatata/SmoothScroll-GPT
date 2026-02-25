import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const refName = process.env.GITHUB_REF_NAME || "";

if (!refName) {
  throw new Error("缺少 GITHUB_REF_NAME，无法校验发布 tag");
}

if (!refName.startsWith("v")) {
  throw new Error(`发布 tag 格式错误：${refName}，必须以 v 开头`);
}

const raw = await readFile(path.join(root, "package.json"), "utf8");
const pkg = JSON.parse(raw);
const expectedTag = `v${pkg.version}`;

if (refName !== expectedTag) {
  throw new Error(`tag 与 package.json.version 不一致：当前 ${refName}，期望 ${expectedTag}`);
}

console.log(`发布版本校验通过：${refName}`);
