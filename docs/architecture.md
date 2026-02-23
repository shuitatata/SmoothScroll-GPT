# 架构说明

## 1. 模块划分
- `content-script.js`
  - 识别消息容器与消息节点。
  - 维护虚拟化窗口与占位符替换。
  - 处理滚动、变更观察与自动恢复。
- `background.js`
  - 统一读写配置。
  - 将 popup/options 的指令转发到活动标签页。
- `popup/*`
  - 快速开关、阈值配置、状态查看、一键恢复。
- `options/*`
  - 高级配置、参数边界说明、调试开关。
- `shared/*`
  - 共享常量、配置归一化、窗口计算工具。

## 2. 数据接口

### VirtualizerConfig
- `enabled: boolean`
- `maxMountedMessages: number`（40-120）
- `overscanCount: number`
- `preserveTailCount: number`
- `debug: boolean`

### RuntimeCommand
- `ENABLE`
- `DISABLE`
- `SET_CONFIG`
- `RESTORE_ALL`
- `GET_STATS`

### VirtualizerStats
- `mountedCount`
- `trimmedCount`
- `estimatedNodeCount`
- `avgFrameDeltaMs`
- `lastError`

## 3. 核心流程
1. 内容脚本启动后查找对话容器，建立消息记录索引。
2. 滚动或 DOM 变化触发窗口计算。
3. 对窗口外消息执行裁剪（替换为占位符），并缓存真实节点。
4. 占位符进入恢复区间时自动还原真实节点。
5. 出现异常时触发 fail-open：恢复全部节点并禁用虚拟化。

## 4. 兼容策略
- 站点匹配：`chatgpt.com` / `chat.openai.com`。
- 消息节点识别采用多选择器与启发式回退。
- 若识别失败，仅输出错误并保持页面可用。

## 5. Safari 工程产物
- 宿主工程路径：`/Users/shuitata/PlayGround/SmoothScroll GPT/safari-app/SmoothScroll GPT/SmoothScroll GPT.xcodeproj`。
- 该工程由 `safari-web-extension-converter` 生成，用于在 macOS Safari 本机运行扩展。
- 当前采用 `--copy-resources`，工程内 `Resources` 会复制一份扩展代码，后续改动需重新执行转换命令同步。
