import assert from "node:assert/strict"
import fs from "node:fs"
import test from "node:test"

const styles = fs.readFileSync("quartz/styles/custom.scss", "utf8")

test("desktop inner pages use one deliberate reading inset", () => {
  assert.match(styles, /--inner-page-inset:\s*4rem/)
  assert.match(
    styles,
    /body:not\(\[data-slug="index"\]\) \.page > #quartz-body > \.center\s*\{[^}]*padding-inline-start:\s*var\(--inner-page-inset\)/s,
  )
})

test("tablet inner pages collapse to a topbar and one content column", () => {
  assert.match(
    styles,
    /body:not\(\[data-slug="index"\]\) \.page > #quartz-body\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/s,
  )
  assert.match(
    styles,
    /body:not\(\[data-slug="index"\]\) \.sidebar\.left\s*\{[^}]*border-right:\s*none/s,
  )
})

test("mobile inner pages hide the secondary graph sidebar", () => {
  assert.match(
    styles,
    /body:not\(\[data-slug="index"\]\) \.sidebar\.right\s*\{[^}]*display:\s*none/s,
  )
})

test("touch layouts provide 44px interactive targets", () => {
  assert.match(styles, /\.sidebar\.left \.dhamma-nav \.nav-item\s*\{[^}]*min-height:\s*2\.75rem/s)
  assert.match(styles, /\.sidebar\.left \.search-button\s*\{[^}]*height:\s*2\.75rem/s)
  assert.match(
    styles,
    /body\[data-slug="index"\] \.sidebar\.left \.search-button\s*\{[^}]*height:\s*2\.75rem/s,
  )
  assert.match(
    styles,
    /\.sidebar\.left :is\(\.darkmode, \.reader-mode\)\s*\{[^}]*min-width:\s*2\.75rem[^}]*min-height:\s*2\.75rem/s,
  )
})

test("project rules require desktop, iPad, and mobile acceptance", () => {
  const rules = fs.readFileSync("AGENTS.md", "utf8")

  assert.match(rules, /桌面端/)
  assert.match(rules, /iPad 横屏/)
  assert.match(rules, /iPad 竖屏/)
  assert.match(rules, /手机端/)
  assert.match(rules, /npm run check/)
  assert.match(rules, /npm test/)
  assert.match(rules, /npx quartz build/)
})
