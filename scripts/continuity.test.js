import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..")

test("PROJECT.md is a committed control-plane pointer in the repo", () => {
  const file = path.join(root, "PROJECT.md")
  assert.ok(fs.existsSync(file), "PROJECT.md must exist")
  // 真文件，禁止依赖仓库外软链（CI 无 obsidian-projects）
  assert.equal(fs.lstatSync(file).isSymbolicLink(), false)
  const body = fs.readFileSync(file, "utf8")
  assert.match(body, /DhammaAI\/AGENT\.md/)
  assert.match(body, /project-closeout/)
})

test("project-closeout is a committed executable entry in the repo", () => {
  const file = path.join(root, "scripts", "project-closeout")
  assert.ok(fs.existsSync(file), "scripts/project-closeout must exist")
  assert.equal(fs.lstatSync(file).isSymbolicLink(), false)
  const body = fs.readFileSync(file, "utf8")
  assert.match(body, /CONTROL_SCRIPT|project-closeout\.sh/)
  // shebang present
  assert.match(body, /^#!\/usr\/bin\/env bash/m)
})

test("docs point at the live control-plane paths, not the retired Active/ layer", () => {
  for (const f of ["README.md", "AGENTS.md", "PROJECT.md"]) {
    const body = fs.readFileSync(path.join(root, f), "utf8")
    // Vault 与中控目录的 Active/ 层级已废弃；仅生命周期措辞可保留 "Active"
    assert.doesNotMatch(body, /1_Projects\/Active\//, `${f} 引用了已废弃的 1_Projects/Active/`)
    assert.doesNotMatch(
      body,
      /obsidian-projects\/Active\//,
      `${f} 引用了已废弃的 obsidian-projects/Active/`,
    )
  }
})

test("README does not describe PROJECT.md as a symlink", () => {
  // 实现上必须是真文件（见上方断言），文档不得反过来说它是软链
  const readme = fs.readFileSync(path.join(root, "README.md"), "utf8")
  const row = readme.split("\n").find((l) => l.includes("PROJECT.md") && l.includes("|"))
  assert.ok(row, "README 应有 PROJECT.md 的文档映射行")
  assert.doesNotMatch(row, /软链/)
})

test("AGENTS.md requires session closeout for continuity", () => {
  const agents = fs.readFileSync(path.join(root, "AGENTS.md"), "utf8")
  assert.match(agents, /project-closeout/)
  assert.match(agents, /PROJECT\.md/)
  assert.match(agents, /会话开闭/)
})
