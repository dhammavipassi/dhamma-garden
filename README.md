# DhammaAI

DhammaAI 是 Dhammadassī（法观）的个人博客与数字花园，记录佛法修学、禅修实践、法义辨析，以及 AI 如何辅助学习和系统构建。

站点基于 [Quartz v5](https://quartz.jzhao.xyz/) 构建，发布于 [guanzhang.dhammaai.com](https://guanzhang.dhammaai.com/)。

## 文档映射

| 文档 | 职责 |
|---|---|
| [AGENTS.md](./AGENTS.md) | **工程与三端验收 SSOT**（本仓库） |
| `~/Github_projects/obsidian-projects/Active/DhammaAI/AGENT.md` | 项目中控：定位、边界、状态、日常维护 |
| `~/Obsidian/1_Projects/Active/DhammaAI.md` | Obsidian 入口（软链到上表 AGENT.md） |

布局/视觉实现细节以 `quartz.config.yaml` 与 `quartz/styles/custom.scss` 为准，文档不平行复制。

## 本地开发

```bash
npm ci
npx quartz build --serve
```

## 质量检查

```bash
npm run check
npm test
npx quartz build
```

任何布局或视觉调整都必须先满足 [AGENTS.md](./AGENTS.md) 中的三端兼容门槛。

## 发布

推送到 `v5` 分支后，GitHub Actions 会执行检查、测试和构建，并部署到 Cloudflare Pages。只有工作流完整成功并完成线上验收，才视为发布完成。
