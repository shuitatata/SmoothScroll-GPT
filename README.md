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
npm run gate
```

## 目录结构
- `/Users/shuitata/PlayGround/SmoothScroll GPT/extension`：扩展源码
- `/Users/shuitata/PlayGround/SmoothScroll GPT/docs`：设计与过程文档
- `/Users/shuitata/PlayGround/SmoothScroll GPT/scripts`：构建与门禁脚本

## Safari 加载方式（开发）
1. 运行 `npm run build` 生成 `dist/extension`。
2. 使用 Safari 的扩展开发流程加载该目录（或打包转换后加载）。
3. 打开 ChatGPT 页面并在扩展弹窗中开启虚拟化。

## Git / GitHub
- 默认分支：`main`
- 功能分支前缀：`codex/`
- 远程仓库：`git@github.com:shuitatata/SmoothScroll-GPT.git`
