# DhammaAI

DhammaAI 是 Dhammadassī（法观）的个人博客与数字花园，记录佛法修学、禅修实践、法义辨析，以及 AI 如何辅助学习和系统构建。

站点基于 [Quartz v5](https://quartz.jzhao.xyz/) 构建，发布于 [guanzhang.dhammaai.com](https://guanzhang.dhammaai.com/)。

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

项目的响应式策略、三端兼容门槛和发布验收流程统一维护在 [AGENTS.md](./AGENTS.md)。任何布局或视觉调整都必须先满足该规范。

## 发布

推送到 `v5` 分支后，GitHub Actions 会执行检查、测试和构建，并部署到 Cloudflare Pages。只有工作流完整成功并完成线上验收，才视为发布完成。
