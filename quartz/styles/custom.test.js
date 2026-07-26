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

test("mobile and tablet place secondary sidebar after the article, not beside it", () => {
  // 触屏单列：右栏在 grid 中位于 center 之后
  assert.match(
    styles,
    /grid-template-areas:[\s\S]*?"grid-sidebar-left"\s*"grid-center"\s*"grid-sidebar-right"/,
  )
  // 手机不再 display:none 掉右栏（图谱沉底可见）
  assert.doesNotMatch(
    styles,
    /@media all and \(\$mobile\)[\s\S]*body:not\(\[data-slug="index"\]\) \.sidebar\.right\s*\{[^}]*display:\s*none\s*!important/s,
  )
  assert.match(
    styles,
    /body:not\(\[data-slug="index"\]\) \.sidebar\.right\s*\{[^}]*flex-direction:\s*column/s,
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

test("touch layouts do not double-line above the graph", () => {
  // 触屏端 .sidebar.right 有 border-top 作为下沉分隔线，
  // graph-outer 的上边框与之平行 → 视觉双线。
  // 触屏端 graph-outer 去掉上边框，保留左右下三边。
  assert.match(
    styles,
    /@media all and \(\$tablet\)[\s\S]*?graph-outer\s*\{[^}]*border-top:\s*none/s,
  )
})

test("touch layouts hide the DefaultFrame hr that doubles the sidebar border-top", () => {
  // Quartz DefaultFrame 自动在正文末尾加 <hr/>，触屏端右栏 border-top 与之平行 → 双线
  // 触屏端隐藏 .center > hr:last-of-type，保留右栏 border-top 作为统一分隔线
  assert.match(
    styles,
    /@media all and \(\$tablet\)[\s\S]*?\.center\s*>\s*hr:last-of-type\s*\{[^}]*display:\s*none/s,
  )
})

test("body typography selectors survive the .markdown-rendered wrapper", () => {
  // Quartz 把正文包成 <article><div class="markdown-rendered">…</div></article>，
  // 因此 `article > hX` 永远匹配不到正文标题（实测 h2 仍是 base.scss 的 1.4rem）。
  assert.doesNotMatch(
    styles,
    /article\s*>\s*h[1-6]/,
    "正文标题不得用 article 的直接子代选择器，会被 .markdown-rendered 断开",
  )
  // 标题字号必须由本文件用后代选择器接管
  assert.match(styles, /article\s+:is\(h[1-6]/)
})

test("blockquote has exactly one accent rule, and it stays inside the measure", () => {
  // border-left 与 ::before 曾同时存在 → 双竖线，且 ::before 的 left:-1.5rem 在手机端跑出屏幕
  assert.doesNotMatch(
    styles,
    /article blockquote::before\s*\{[^}]*background:\s*var\(--暖金\)/s,
    "引用块不得再用 ::before 画第二条竖线",
  )
})

test("content-visibility is not applied to prose right after headings", () => {
  // contain-intrinsic-size 会让长段落初始高度塌缩造成 CLS，且干扰 scrollspy 的 offsetTop
  assert.doesNotMatch(styles, /h2\s*\+\s*\*,[\s\S]{0,40}h3\s*\+\s*\*\s*\{[^}]*content-visibility/s)
})

test("prose links meet WCAG AA on the light paper background", () => {
  // #b8945a on #faf6f1 只有 2.63:1；正文链接需要独立的深色 token
  assert.match(styles, /--暖金-链接:/)
  const lightToken = styles.match(/--暖金-链接:\s*(#[0-9a-fA-F]{6})/)
  assert.ok(lightToken, "亮色模式必须定义 --暖金-链接")
  const lum = (hex) => {
    const c = hex
      .replace("#", "")
      .match(/../g)
      .map((x) => parseInt(x, 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)))
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
  }
  const paper = lum("#faf6f1")
  const link = lum(lightToken[1])
  const ratio = (Math.max(paper, link) + 0.05) / (Math.min(paper, link) + 0.05)
  assert.ok(ratio >= 4.5, `正文链接对比度 ${ratio.toFixed(2)} < 4.5 (WCAG AA)`)
})

test("list items share the prose rhythm instead of the upstream 1.6rem", () => {
  // base.scss 的 li{line-height:1.6rem} 会让中文列表比正文紧 20%
  // （SCSS 里以 article 嵌套块的形式覆盖）
  assert.match(styles, /\bli\s*\{\s*line-height:\s*1\.85/)
})

test("touch-targets mixin covers upstream readermode (no hyphen), not reader-mode", () => {
  // 上游 Quartz 的 class 是 .readermode（无连字符），不是 .reader-mode
  // 如果 mixin 用了 .reader-mode，44px 规则永远不生效
  assert.match(styles, /\.readermode/)
  assert.doesNotMatch(
    styles,
    /:is\(\.darkmode,\s*\.reader-mode\)/,
    "touch-targets 不得用 .reader-mode（有连字符），上游实际 class 是 .readermode",
  )
})

test("no .reader-mode (with hyphen) selectors remain in code lines", () => {
  // 之前有 3 处用 .reader-mode（有连字符）：focus-visible、svg、hover
  // 全部应改为 .readermode（无连字符），否则样式失效
  // 注释行里的 .reader-mode 是说明性文字，不算违规
  const codeLines = styles.split("\n").filter((l) => !l.trim().startsWith("//"))
  const offender = codeLines.find((l) => /\.reader-mode(?!\s)/.test(l))
  assert.ok(!offender, `发现 .reader-mode（有连字符）残留: ${offender}`)
})

test("touch-targets mixin covers the global-graph-icon button", () => {
  // 上游 .global-graph-icon 是 24×24 的按钮，触屏端需要 ≥44px
  assert.match(styles, /\.global-graph-icon/)
})

test("skip-to-content link meets 44px touch target", () => {
  // skip link padding 0.6rem 不足以达 44px
  const m = styles.match(/\.skip-to-content\s*\{[^}]*padding:\s*([^;]+)/)
  assert.ok(m, "skip-to-content 必须有 padding 规则")
  // 0.7rem × 2 + line-height ≈ 44px
  assert.match(styles, /\.skip-to-content\s*\{[^}]*min-height:\s*var\(--touch-target\)/)
})

test("hero-mark hides the Quartz anchor link icon for true centering", () => {
  // Quartz 给所有标题自动生成锚点链接图标（<a class="internal-link" href="#id">）
  // 在 hero 装饰标题里这个图标占 22px 参与居中，导致文字偏左
  assert.match(
    styles,
    /\.hero-mark\s+\.internal-link\s*\{[^}]*display:\s*none/,
    "hero-mark 内的锚点链接图标必须隐藏，否则破坏居中",
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
