# 企业会计准则知识库

官方资料的独立整理与研究工具，支持条文查询、科目关联、官方全文检索、版本追踪和差异对照。本站不是财政部官方网站，不声称完整覆盖所有历史资料。

## 内容与功能

- 原有 1870 条结构化内容与 150 个科目目录，保留条文位置和引用关系。
- 官方资料库：财政部准则、解释、实施问答、案例、政策解读、实施分析，以及登记的证监会会计监管资料。
- PDF、DOC、DOCX 附件提取为可搜索文本；扫描图片未做 OCR，不可解析时明确报错。
- 官方文档新增/修改后实际写入知识数据，记录 SHA-256、不可变快照、前后正文差异。
- 草案、官方实施指导、监管参考分开标记，自动采集不自行认定生效或废止。
- 六组有历史版本的准则文字对照及第30号修订重点；按官方通知修正分批实施与旧版适用标识。
- 四条旧解释乱码已根据官方 Word 附件修复，修复依据和原始记录均保留。

## 本地运行

```sh
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
# Linux 解析 DOC 需要 antiword；macOS 使用系统 textutil
.venv/bin/python scripts/build.py
.venv/bin/python -m unittest discover -s tests -v
.venv/bin/python scripts/validate.py
python3 -m http.server 8765
```

用浏览器访问本机 8765 端口。历史访问口令保留，但它只是浏览器端阅读入口，**不提供身份认证或访问保护**。源码和数据本来就是公开的；需要真正权限控制时，应另接服务端认证。访问次数只在本机保存，不再发送访问者 IP。

## 自动同步与发布

唯一工作流为 `.github/workflows/update-check.yml`，北京时间每天 09:17 / 21:17 运行，也支持 GitHub Actions 手动触发。默认分支合并后才会激活新版任务。计划任务可能延迟；连续 36 小时没有检查，页面显示过期。

1. 扫描 `data/sources.json` 登记栏目和已采集来源；对网络超时重试。
2. 抓取正文及附件，验证官方域名、HTTP 响应、正文区域和内容长度。
3. 成功内容写入 `data/library.json`、不可变 `data/versions/` 和 `data/changes.json`。
4. 失败来源保留旧正文；有未解析附件时保留已存在文档的上一版本，不把失败解释为删除。记录 `complete=false`，任务最终标为失败。
5. 保存检查记录（`data/checks.json` 最近 180 次），重建浏览器数据并校验。
6. 提交内容及记录，直接上传 Pages 产物并部署，避免依赖 GITHUB_TOKEN 提交触发下一次 Pages 构建。

部署前，在仓库 **Settings → Pages → Build and deployment** 将 Source 设为 **GitHub Actions**。工作流需要 contents:write、pages:write、id-token:write；受保护 main 分支如不允许机器人提交，需要调整为内容更新 PR 流程。首次部署请检查 Actions 成功及线上状态时间，不能以本地测试代替线上验证。

浏览器“刷新检查记录”只重新读取结果；需要即时抓取时，点击页面的 GitHub 手动运行入口。前端不存储 GitHub token。

## 数据组织与边界

- `data/data.json` / `tree.json` / `subtree.json`：保留原始条文和索引。
- `data/overrides.json` / `repairs.json`：有来源的人工效力修正和正文修复。
- `scripts/build.py`：确定性生成 `assets/data.js`、数据质量清单及新旧准则对照。
- `assets/app.js`：原条文阅读器；`assets/hub.js`：工作台、资料库、来源和更新日志。
- `scripts/upd_status.py --offline`：不联网、不修改检查时间或状态。

当前抓取范围是登记的财政部栏目及已知来源，证监会复查登记文档并扫描官网首页重点链接；未覆盖全站及动态栏目全文。自动内容更新进入官方资料库，不自动重写历史条文的效力、科目映射和人工修订；后者需要依据正式实施通知复核。正文差异是文本层面的变化提示，不是自动作出的会计政策影响结论。完整历史效力审校、所有新旧准则的业务差异分析以及付费出版应用指南全文仍需后续专项完善。

检查发现与验证证据见 [审查报告](docs/audit.md)。
