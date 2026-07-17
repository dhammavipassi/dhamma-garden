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

test("AGENTS.md requires session closeout for continuity", () => {
  const agents = fs.readFileSync(path.join(root, "AGENTS.md"), "utf8")
  assert.match(agents, /project-closeout/)
  assert.match(agents, /PROJECT\.md/)
  assert.match(agents, /会话开闭/)
})
