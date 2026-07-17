# 项目中控入口

本文件是**工程仓内的中控指针**（真文件，非外链软链，保证 CI 可检出）。

完整中控（状态 / 边界 / 三层互通协议）在：

`~/Github_projects/obsidian-projects/Active/DhammaAI/AGENT.md`

Obsidian 入口（软链到同一中控）：

`~/Obsidian/1_Projects/Active/DhammaAI.md`

工程验收 SSOT 仍是本仓 [AGENTS.md](./AGENTS.md)。

## 收尾

可交付完成后在本仓执行：

```bash
./scripts/project-closeout --summary "一句话摘要"
```

脚本会优先调用本机中控目录的完整 closeout（校验 Obsidian 软链、刷新中控基线、更新记忆）；若中控路径不存在（如 CI），则以检查模式退出且不失败。
