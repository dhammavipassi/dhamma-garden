# DhammaAI

DhammaAI 是 Dhammadassī（法观）的个人博客与数字花园，记录佛法修学、禅修实践、法义辨析，以及 AI 如何辅助学习和系统构建。

站点基于 [Quartz v5](https://quartz.jzhao.xyz/) 构建，发布于 [guanzhang.dhammaai.com](https://guanzhang.dhammaai.com/)。

## 文档映射与三层互通

| 文档                              | 职责                                   |
| --------------------------------- | -------------------------------------- |
| [AGENTS.md](./AGENTS.md)          | **工程与三端验收 SSOT** + 会话开闭门禁 |
| [PROJECT.md](./PROJECT.md)        | 仓内真文件指针 → 项目中控 `AGENT.md`   |
| `./scripts/project-closeout`      | 收尾：转发中控、刷新基线、更新记忆     |
| Obsidian `1_Projects/DhammaAI.md` | 软链 → 同一中控（**无需再拷贝**）      |

完成可交付工作后：

```bash
./scripts/project-closeout --summary "一句话摘要"
```

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
