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
