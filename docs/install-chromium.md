# Chrome / Edge 安装说明（开发者模式）

## 适用范围
- 适用于从 GitHub Release 下载的 `smoothscroll-gpt-chrome-v{version}.zip` 与 `smoothscroll-gpt-edge-v{version}.zip`。
- 本文档不包含 Chrome Web Store / Edge Add-ons 商店安装流程。

## Chrome 安装步骤
1. 下载并解压 `smoothscroll-gpt-chrome-v{version}.zip`。
2. 打开 `chrome://extensions`。
3. 打开右上角“开发者模式”。
4. 点击“加载已解压的扩展程序”。
5. 选择解压后的目录（目录内应直接可见 `manifest.json`）。
6. 打开 `https://chatgpt.com` 验证扩展 popup 是否可用。

## Edge 安装步骤
1. 下载并解压 `smoothscroll-gpt-edge-v{version}.zip`。
2. 打开 `edge://extensions`。
3. 打开左下角“开发人员模式”。
4. 点击“加载解压缩扩展”。
5. 选择解压后的目录（目录内应直接可见 `manifest.json`）。
6. 打开 `https://chatgpt.com` 验证扩展 popup 是否可用。

## 常见问题排查
1. 报错“Manifest file is missing or unreadable”
- 原因：选择了错误层级目录。
- 处理：确保所选目录根路径下就是 `manifest.json`。

2. 插件已加载但 ChatGPT 页面无效果
- 检查站点是否为 `chatgpt.com` 或 `chat.openai.com`。
- 刷新页面后再次点击 popup 的“刷新状态”。
- 检查扩展站点权限是否允许在该站点运行。

3. 状态为空或报未找到活动标签页
- 确认当前活动标签页是 ChatGPT 页面。
- 关闭并重新打开 popup，再次刷新状态。
