# SmoothScroll GPT - AGENTS

## 1. 项目定位
- 目标：通过 Safari Web Extension 在 ChatGPT 网页端实现消息 DOM 虚拟化，降低超长会话卡顿。
- 主要收益：提升滚动流畅度，降低主线程压力与内存增长速度。
- 运行边界：仅在浏览器端执行，不调用 OpenAI API，不修改 ChatGPT 后端。

## 2. 非目标
- 不做服务端代理。
- 不抓取用户对话数据到外部服务。
- 不追求一次性支持所有浏览器内核；首版仅保障 macOS Safari。

## 3. 技术边界与安全原则
- 仅操作当前页面 DOM 与扩展本地存储（`storage.local`）。
- 所有异常默认 fail-open：立即恢复页面完整 DOM，避免影响聊天可用性。
- 对站点结构变化保持保守策略：无法识别消息容器时自动降级并输出诊断状态。

## 4. 代码组织规范
- `extension/manifest.json`：扩展声明。
- `extension/content-script.js`：虚拟化核心逻辑。
- `extension/background.js`：配置存储与消息路由。
- `extension/popup/*`：快速开关与状态面板。
- `extension/options/*`：高级配置页面。
- `extension/shared/*`：配置、命令常量、窗口计算等共享逻辑。
- `docs/*`：架构、路线图、性能基线与变更记录。
- `scripts/*`：本地构建与最小门禁脚本。

## 5. Git / GitHub 工作流
- 默认分支：`main`。
- 功能分支：必须使用 `codex/` 前缀。
- 交付方式：功能分支通过 PR 合并到 `main`，避免直接在 `main` 开发功能。
- 提交粒度：每个可验证增量一个提交。
- 提交要求：代码与对应文档必须同提交更新。

## 6. 文档与注释规则
- 代码注释：中文。
- 项目文档：中文。
- PR 描述：中文。
- 文档维护：
  - 架构变化同步更新 `docs/architecture.md`。
  - 里程碑与风险同步更新 `docs/roadmap.md`。
  - 每次提交追加到 `docs/change-log.md`。
  - 性能数据同步更新 `docs/perf-baseline.md`。

## 7. 性能验收与测试门禁
- 最小门禁：构建通过 + 关键用例通过。
- 核心验收：
  - 挂载消息数受配置上限控制。
  - 滚回历史时消息可还原且顺序正确。
  - 输入区与最新消息不中断。
  - 一键恢复可回到完整 DOM。

## 8. 回滚与故障处置
- 若出现渲染异常或交互阻断：
  1. 触发 `RESTORE_ALL` 恢复所有裁剪消息。
  2. 关闭虚拟化（`enabled=false`）。
  3. 记录 `lastError` 并更新变更日志。

## 9. 默认配置
- `maxMountedMessages=80`
- `overscanCount=8`
- `preserveTailCount=6`
- `adaptiveEnabled=false`
- 配置范围：`maxMountedMessages` 0-120

## 10. 提交前检查
- 运行 `npm run gate`。
- 确认文档已同步。
- 确认代码注释为中文并且必要、简洁。
