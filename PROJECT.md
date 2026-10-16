本文件是**工程仓内的项目中控指针**。

完整项目中控与工程验收 SSOT 位于：

`~/Github_projects/dhamma-garden/AGENTS.md`

Obsidian 入口：

`~/Obsidian/1_Projects/DhammaAI.md`

## 收尾

可交付完成后在本仓执行：

```bash
./scripts/project-closeout --summary "一句话摘要"
```

脚本会优先调用本机中控目录的完整 closeout（校验 Obsidian 软链、刷新中控基线、更新记忆）；若中控路径不存在（如 CI），则以检查模式退出且不失败。
