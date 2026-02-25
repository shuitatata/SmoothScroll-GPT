# Release 发布流程（Chrome / Edge）

## 目标
通过 GitHub tag 自动发布 Chromium 扩展资产到 GitHub Release，供开发者模式安装。

## 资产定义
- `smoothscroll-gpt-chrome-v{version}.zip`
- `smoothscroll-gpt-edge-v{version}.zip`
- `SHA256SUMS.txt`

## 本地预检查
1. 执行 `npm run release:prepare`。
2. 确认 `/Users/shuitata/PlayGround/SmoothScroll GPT/release` 下资产完整。
3. 校验 `SHA256SUMS.txt` 与 zip 文件一致。

## 自动发布（tag 驱动）
1. 确认 `package.json` 的 `version`（例如 `0.1.0`）。
2. 创建并推送 tag：`v0.1.0`。
3. GitHub Actions 工作流 `release-chromium.yml` 自动执行：
- `npm run verify:release-tag`
- `npm run gate`
- `npm run build:chromium && npm run package:chromium`
- 上传 Release 资产

## 版本校验规则
- 仅接受 `v*` tag。
- tag 必须与 `package.json.version` 完全一致。
- 若不一致，工作流失败并拒绝发布。

## 回滚策略
1. 若资产错误但 tag 未广泛使用：
- 删除 GitHub Release。
- 删除远程 tag。
- 修复后重新打新 tag（推荐递增版本）。
2. 若已被用户使用：
- 保留历史 tag。
- 发布 hotfix 版本（例如 `v0.1.1`）。

## Safari 关系说明
- Chromium 发布流程不影响 Safari。
- Safari 仍走 `npm run convert:safari` 与 Xcode 流程。
