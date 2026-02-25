# SmoothScroll GPT

SmoothScroll GPT 是一个面向 `Safari / Chrome / Edge` 的本地浏览器扩展，用于缓解 ChatGPT 网页版在超长对话中的卡顿问题。

## 核心思路
- 通过内容脚本在前端执行消息 DOM 虚拟化。
- 只保留视口附近与尾部关键消息挂载在页面中。
- 将超出窗口的消息替换为等高占位符，滚回时再恢复真实 DOM。

## 当前阶段
- 已完成：工程基线、文档体系、观测层、静态裁剪原型、自动窗口化、配置面板、异常降级、自适应调参（基础版）。
- 首版范围：`chatgpt.com` 与 `chat.openai.com`。

## 本地命令
```bash
npm run check
npm run test
npm run build
npm run build:chromium
npm run package:chromium
npm run release:prepare
npm run verify:release-tag
npm run convert:safari
npm run gate
```

## 目录结构
- `/Users/shuitata/PlayGround/SmoothScroll GPT/extension`：扩展源码
- `/Users/shuitata/PlayGround/SmoothScroll GPT/docs`：设计与过程文档
- `/Users/shuitata/PlayGround/SmoothScroll GPT/scripts`：构建与门禁脚本

## Safari 体验方式（开发）
1. 运行 `npm run build` 生成 `/Users/shuitata/PlayGround/SmoothScroll GPT/dist/extension`。
2. 运行 `npm run convert:safari` 生成 Xcode 工程到 `/Users/shuitata/PlayGround/SmoothScroll GPT/safari-app`。
3. 在 Xcode 打开 `/Users/shuitata/PlayGround/SmoothScroll GPT/safari-app/SmoothScroll GPT/SmoothScroll GPT.xcodeproj`。
4. 运行 Scheme `SmoothScroll GPT`。
5. 打开 Safari -> 设置 -> 扩展，启用 `SmoothScroll GPT Extension`。
6. 访问 ChatGPT 页面，点击扩展弹窗调整参数并观察 `mounted/trimmed` 状态。

## Chrome / Edge 体验方式（开发者模式）
1. 运行 `npm run build:chromium`。
2. Chrome 打开 `chrome://extensions`，Edge 打开 `edge://extensions`。
3. 开启“开发者模式”。
4. 点击“加载已解压的扩展程序”，选择：
   - Chrome：`/Users/shuitata/PlayGround/SmoothScroll GPT/dist/chrome/extension`
   - Edge：`/Users/shuitata/PlayGround/SmoothScroll GPT/dist/edge/extension`
5. 打开 ChatGPT 页面验证扩展 popup 与状态读取。

## GitHub Release（开发者模式分发）
1. 本地准备资产：`npm run release:prepare`。
2. 推送版本 tag（例如 `v0.1.0`）。
3. GitHub Actions 自动生成并上传：
   - `smoothscroll-gpt-chrome-v{version}.zip`
   - `smoothscroll-gpt-edge-v{version}.zip`
   - `SHA256SUMS.txt`
4. 朋友从 Release 下载 zip，解压后按开发者模式加载。

详细步骤见：
- `/Users/shuitata/PlayGround/SmoothScroll GPT/docs/install-chromium.md`
- `/Users/shuitata/PlayGround/SmoothScroll GPT/docs/release-process.md`

## Git / GitHub
- 默认分支：`main`
- 功能分支前缀：`codex/`
- 远程仓库：`git@github.com:shuitatata/SmoothScroll-GPT.git`
