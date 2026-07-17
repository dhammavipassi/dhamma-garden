import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..")

test("PROJECT.md softlinks to DhammaAI control AGENT.md", () => {
  const link = path.join(root, "PROJECT.md")
  assert.ok(fs.lstatSync(link).isSymbolicLink(), "PROJECT.md must be a symlink")
  const target = fs.readlinkSync(link)
  assert.match(target, /DhammaAI\/AGENT\.md$/)
  assert.ok(fs.existsSync(link), "PROJECT.md target must resolve")
  const body = fs.readFileSync(link, "utf8")
  assert.match(body, /三层互通|project-closeout/)
})

test("project-closeout softlinks to control script", () => {
  const link = path.join(root, "scripts", "project-closeout")
  assert.ok(fs.lstatSync(link).isSymbolicLink() || fs.existsSync(link))
  assert.ok(fs.existsSync(link), "closeout entry must resolve")
})

test("AGENTS.md requires session closeout for continuity", () => {
  const agents = fs.readFileSync(path.join(root, "AGENTS.md"), "utf8")
  assert.match(agents, /project-closeout/)
  assert.match(agents, /PROJECT\.md/)
  assert.match(agents, /会话开闭/)
})
