import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

async function loadGlobalScript(filePath, context) {
  const code = await readFile(filePath, "utf8");
  vm.runInNewContext(code, context, { filename: filePath });
}

const context = {
  globalThis: {},
  window: {},
};
context.globalThis = context;
context.window = context;

await loadGlobalScript(path.join(process.cwd(), "extension/shared/config.js"), context);
await loadGlobalScript(path.join(process.cwd(), "extension/shared/windowing.js"), context);

const { normalizeConfig, DEFAULT_CONFIG } = context.SSG_CONFIG;
const { computeDesiredIndices } = context.SSG_WINDOWING;

const normalized = normalizeConfig({
  maxMountedMessages: 999,
  overscanCount: 1,
  preserveTailCount: -10,
  enabled: 1,
  debug: 0,
});

assert.equal(normalized.maxMountedMessages, 120, "maxMountedMessages 应被上限截断");
assert.equal(normalized.overscanCount, 2, "overscanCount 应被下限截断");
assert.equal(normalized.preserveTailCount, 2, "preserveTailCount 应被下限截断");
assert.equal(normalized.enabled, true, "enabled 应转换为布尔值");
assert.equal(normalized.debug, false, "debug 应转换为布尔值");

const normalizedLowerBound = normalizeConfig({
  maxMountedMessages: -12,
});
assert.equal(normalizedLowerBound.maxMountedMessages, 0, "maxMountedMessages 应允许最小值 0");

const desired = computeDesiredIndices(20, { firstVisible: 8, lastVisible: 9 }, 2, 3);
assert.equal(desired.has(6), true, "应包含可见区前的 overscan");
assert.equal(desired.has(11), true, "应包含可见区后的 overscan");
assert.equal(desired.has(19), true, "应包含尾部保留项");
assert.equal(DEFAULT_CONFIG.maxMountedMessages, 80, "默认配置应保持不变");

console.log("测试通过：配置归一化与窗口计算逻辑正常");
