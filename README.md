# SmoothScroll GPT

SmoothScroll GPT 是一个面向 `macOS Safari` 的本地浏览器扩展，用于缓解 ChatGPT 网页版在超长对话中的卡顿问题。

## 核心思路
- 通过内容脚本在前端执行消息 DOM 虚拟化。
- 只保留视口附近与尾部关键消息挂载在页面中。
- 将超出窗口的消息替换为等高占位符，滚回时再恢复真实 DOM。

## 当前阶段
- 已完成：工程基线、文档体系、观测层、静态裁剪原型、自动窗口化、配置面板、异常降级。
- 首版范围：`chatgpt.com` 与 `chat.openai.com`。

## 本地命令
```bash
npm run check
npm run test
npm run build
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

## Git / GitHub
- 默认分支：`main`
- 功能分支前缀：`codex/`
- 远程仓库：`git@github.com:shuitatata/SmoothScroll-GPT.git`
