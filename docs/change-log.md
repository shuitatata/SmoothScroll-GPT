# 变更记录

## 2026-02-23
- 初始化工程基线：`AGENTS.md`、`README.md`、`docs/*`。
- 新增 Safari Web Extension 骨架与 manifest。
- 实现共享配置与命令协议：`VirtualizerConfig`、`RuntimeCommand`、`VirtualizerStats`。
- 实现内容脚本虚拟化核心：
  - 消息识别与索引维护
  - 裁剪/恢复与占位符机制
  - 滚动驱动窗口化（含 overscan 和尾部保留）
  - 异常 fail-open
- 新增 popup/options 用于配置与控制。
- 新增本地门禁脚本：`check`、`test`、`build`、`gate`。
- 根据项目决策，性能基线实测暂缓，不纳入当前里程碑门禁。

## 2026-02-24
- 完成 Xcode 首次初始化，启用 Safari 扩展转换工具链。
- 新增 Safari 转换脚本：`npm run convert:safari`（`scripts/convert-safari.mjs`）。
- 生成并落地 macOS Safari 宿主工程：`safari-app/SmoothScroll GPT/SmoothScroll GPT.xcodeproj`。
- 更新 README 体验步骤，支持从构建产物一键转换到可运行工程。
- 为 `manifest.json` 增加扩展图标并移除 `open_in_tab`，消除 Safari 转换警告。
- 修复 Xcode 运行报错：统一宿主 App 与扩展的 Bundle Identifier 前缀，并在转换脚本中加入自动修正逻辑。
- 修复裁剪窗口策略：`maxMountedMessages` 改为严格上限导向，避免在特定视口下长期不裁剪。
- 扩展状态新增 `totalMessageCount` 与 `maxMountedMessages`，便于判断未裁剪原因。
- 调整配置边界：`maxMountedMessages` 下限由 40 改为 0，便于低阈值调试与实验。
- 扩展状态新增窗口诊断与累计指标：`desiredKeepCount`、`protectedKeepCount`、`effectiveKeepCount`、`cumulativeTrimOps`、`cumulativeRestoreOps`。
- 实现 Phase F 基础版：新增 `adaptiveEnabled`，运行时根据滚动速度与帧间隔自适应调整生效的窗口参数。
- 扩展状态新增自适应诊断字段：`activeMaxMountedMessages`、`activeOverscanCount`、`activePreserveTailCount`、`scrollVelocityPxPerMs`、`adaptiveLastReason`、`adaptiveLastAdjustAt`。
