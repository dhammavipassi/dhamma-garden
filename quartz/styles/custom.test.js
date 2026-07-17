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
  assert.match(styles, /@mixin topbar-shell/)
  assert.match(styles, /border-right:\s*none/)
})

test("mobile inner pages hide the secondary graph sidebar", () => {
  assert.match(
    styles,
    /body:not\(\[data-slug="index"\]\) \.sidebar\.right\s*\{[^}]*display:\s*none/s,
  )
})

test("touch layouts provide 44px interactive targets via shared token", () => {
  assert.match(styles, /--touch-target:\s*2\.75rem/)
  assert.match(styles, /@mixin touch-targets/)
  assert.match(styles, /min-height:\s*var\(--touch-target\)/)
  assert.match(styles, /height:\s*var\(--touch-target\)/)
  assert.match(styles, /min-width:\s*var\(--touch-target\)/)
  assert.match(
    styles,
    /body\[data-slug="index"\] \.sidebar\.left \.search-button,\s*body:not\(\[data-slug="index"\]\) \.sidebar\.left \.search-button\s*\{[^}]*height:\s*var\(--touch-target\)/s,
  )
})

test("responsive styles use Quartz breakpoints only", () => {
  assert.doesNotMatch(styles, /769px/)
  assert.doesNotMatch(styles, /1024px/)
  assert.match(styles, /\$tablet/)
  assert.match(styles, /\$mobile/)
})

test("shared chrome tokens exist for topbar and elevation", () => {
  assert.match(styles, /--topbar-pad-block:/)
  assert.match(styles, /--topbar-pad-inline:/)
  assert.match(styles, /--nav-underline:/)
  assert.match(styles, /--shadow-card:/)
})

test("focus and safe-area affordances are defined", () => {
  assert.match(styles, /:focus-visible/)
  assert.match(styles, /safe-area-inset/)
})

test("tablet right sidebar stacks modules and keeps graph structure", () => {
  assert.match(styles, /flex-direction:\s*column/)
  assert.match(styles, /--graph-min-height:\s*12rem/)
  assert.match(styles, /min-height:\s*var\(--graph-min-height\)/)
  // 结构位保留：不得用 :empty 整栏折叠
  assert.doesNotMatch(styles, /\.sidebar\.right:empty/)
  assert.doesNotMatch(styles, /:has\(\.sidebar\.right:empty\)/)
})

test("graph has a single frame on graph-outer, not a double border", () => {
  // 外层 .graph 不得再画边框（组件 .graph-outer 已有框）
  assert.doesNotMatch(styles, /\.sidebar\.right \.graph\s*\{[^}]*border:\s*1px solid/s)
  assert.match(
    styles,
    /\.sidebar\.right \.graph\s*>\s*\.graph-outer\s*\{[^}]*border:\s*1px solid var\(--线条\)/s,
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
