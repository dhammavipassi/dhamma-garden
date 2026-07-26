#!/usr/bin/env node
// 三端几何验收：按 AGENTS.md 的标准视口 × 必检页面做像素测量。
// 用法：
//   node scripts/visual-audit.mjs                 # 测本地 public/（需先 npx quartz build）
//   node scripts/visual-audit.mjs --base https://guanzhang.dhammaai.com
//   node scripts/visual-audit.mjs --shots         # 同时存截图到 .audit/
// 依赖 playwright（不入 package.json，本地按需 npx，CI 靠 *.test.js 的静态断言把关）。

import { chromium } from "playwright"
import http from "node:http"
import handler from "serve-handler"
import fs from "node:fs"
import path from "node:path"

const ROOT = path.resolve(import.meta.dirname, "..")
const args = process.argv.slice(2)
const baseArg = args.includes("--base") ? args[args.indexOf("--base") + 1] : null
const wantShots = args.includes("--shots")
const SHOT_DIR = path.join(ROOT, ".audit")

// AGENTS.md「标准验收视口」
const VIEWPORTS = [
  { name: "desktop-1440", width: 1440, height: 900, touch: false },
  { name: "desktop-1280", width: 1280, height: 800, touch: false },
  { name: "ipad-land-1194", width: 1194, height: 834, touch: true },
  { name: "ipad-port-834", width: 834, height: 1194, touch: true },
  { name: "phone-430", width: 430, height: 932, touch: true },
  { name: "phone-390", width: 390, height: 844, touch: true },
]

// AGENTS.md「必检页面」+ 排版探针（若存在）
const PAGES = [
  { name: "home", path: "/" },
  { name: "about", path: "/关于/" },
  { name: "dhamma", path: "/佛法修学/" },
  { name: "ai", path: "/ai实践/" },
  // 根级笔记的相对资源路径按 /_probe.html 计算，不能走 cleanUrls 的 /_probe/
  { name: "probe", path: "/_probe.html", optional: true },
]

const TOUCH_MIN = 44

/** 页内测量：全部在浏览器上下文执行，返回可序列化结果。 */
function measure(TOUCH_MIN) {
  const round = (n) => Math.round(n * 100) / 100
  const vis = (el) => {
    const cs = getComputedStyle(el)
    if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0") return false
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0
  }

  const de = document.documentElement
  const out = {
    // 自检：样式必须真的加载，否则一切几何都是假数据
    stylesLoaded:
      [...document.styleSheets].some((s) => {
        try {
          return s.cssRules.length > 0
        } catch {
          return true
        }
      }) && getComputedStyle(document.body).backgroundColor !== "rgba(0, 0, 0, 0)",
    overflowX: {
      scrollW: de.scrollWidth,
      clientW: de.clientWidth,
      overflow: de.scrollWidth > de.clientWidth + 1,
    },
    offenders: [],
    touch: [],
    overlaps: [],
    progressBars: [],
    blockquote: null,
    contentVisibility: [],
    geometry: {},
    contrastRisk: [],
  }

  // 1) 谁在横向溢出
  if (out.overflowX.overflow) {
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect()
      if (r.right > de.clientWidth + 1 && vis(el)) {
        out.offenders.push({
          sel:
            el.tagName.toLowerCase() +
            (el.className ? "." + String(el.className).split(" ")[0] : ""),
          right: round(r.right),
          w: round(r.width),
        })
      }
    }
    out.offenders = out.offenders.slice(0, 8)
  }

  // 2) 触控目标尺寸（可点击元素）
  const clickable =
    "a, button, [role='button'], input[type='checkbox'], .search-button, .darkmode, .reader-mode"
  for (const el of document.querySelectorAll(clickable)) {
    if (!vis(el)) continue
    const r = el.getBoundingClientRect()
    // 正文内联链接不计入（无法也不应撑到 44px）
    if (el.closest("article") && el.tagName === "A" && getComputedStyle(el).display === "inline")
      continue
    if (r.width < TOUCH_MIN || r.height < TOUCH_MIN) {
      out.touch.push({
        sel:
          el.tagName.toLowerCase() + (el.className ? "." + String(el.className).split(" ")[0] : ""),
        text: (el.textContent || "").trim().slice(0, 14),
        w: round(r.width),
        h: round(r.height),
      })
    }
  }

  // 3) 顶部固定进度条是否叠加
  for (const el of document.querySelectorAll(".navigation-progress, .reading-progress")) {
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    out.progressBars.push({
      cls: String(el.className),
      pos: cs.position,
      top: round(r.top),
      h: round(r.height),
      z: cs.zIndex,
    })
  }

  // 4) blockquote 竖线：border-left 与 ::before 是否同时可见（双线）
  const bq = document.querySelector("article blockquote")
  if (bq) {
    const cs = getComputedStyle(bq)
    const before = getComputedStyle(bq, "::before")
    const r = bq.getBoundingClientRect()
    const article = document.querySelector("article")
    const ar = article.getBoundingClientRect()
    out.blockquote = {
      borderLeftWidth: cs.borderLeftWidth,
      borderLeftColor: cs.borderLeftColor,
      beforeContent: before.content,
      beforeWidth: before.width,
      beforeLeft: before.left,
      beforeBg: before.backgroundColor,
      // ::before 用 left:-1.5rem 会跑到 article 版心之外
      bqLeft: round(r.left),
      articleLeft: round(ar.left),
      escapesArticle: round(r.left) - 24 < round(ar.left),
    }
  }

  // 5) content-visibility: auto 的实际影响（CLS 风险）
  for (const el of document.querySelectorAll("article > h2 + *, article > h3 + *")) {
    const cs = getComputedStyle(el)
    if (cs.contentVisibility && cs.contentVisibility !== "visible") {
      const r = el.getBoundingClientRect()
      out.contentVisibility.push({
        sel: el.tagName.toLowerCase(),
        cv: cs.contentVisibility,
        intrinsic: cs.containIntrinsicSize,
        renderedH: round(r.height),
      })
    }
  }

  // 6) 版心几何：正文起点、宽度、侧栏
  const center = document.querySelector(".center")
  const article = document.querySelector("article")
  const left = document.querySelector(".sidebar.left")
  const right = document.querySelector(".sidebar.right")
  const body = document.querySelector("#quartz-body")
  const g = (el) => {
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: round(r.x), y: round(r.y), w: round(r.width), h: round(r.height) }
  }
  out.geometry = {
    gridCols: body ? getComputedStyle(body).gridTemplateColumns : null,
    center: g(center),
    article: g(article),
    sidebarLeft: g(left),
    sidebarRight: g(right),
    // 正文首个块元素的左起点 —— 栏目页之间必须一致
    firstBlockX: (() => {
      const el = document.querySelector("article > *")
      return el ? round(el.getBoundingClientRect().x) : null
    })(),
    bodyFontSize: getComputedStyle(document.body).fontSize,
    articleLineHeight: article ? getComputedStyle(article).lineHeight : null,
  }

  // 7) 侧栏与正文重叠（触屏端单列时不应并排重叠）
  const boxes = [
    ["sidebar.left", left],
    ["sidebar.right", right],
    ["center", center],
  ].filter(([, el]) => el && vis(el))
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i][1].getBoundingClientRect()
      const b = boxes[j][1].getBoundingClientRect()
      const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left)
      const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
      if (ox > 2 && oy > 2) {
        out.overlaps.push({ a: boxes[i][0], b: boxes[j][0], ox: round(ox), oy: round(oy) })
      }
    }
  }

  return out
}

async function run() {
  let server = null
  let base = baseArg

  if (!base) {
    const pub = path.join(ROOT, "public")
    if (!fs.existsSync(pub)) {
      console.error("public/ 不存在，先跑 npx quartz build")
      process.exit(1)
    }
    server = http.createServer((req, res) =>
      handler(req, res, { public: pub, directoryListing: false, cleanUrls: true }),
    )
    await new Promise((r) => server.listen(0, r))
    base = `http://localhost:${server.address().port}`
  }

  if (wantShots) fs.mkdirSync(SHOT_DIR, { recursive: true })

  const browser = await chromium.launch()
  const findings = []
  const rows = []

  for (const theme of ["light", "dark"]) {
    for (const vp of VIEWPORTS) {
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        hasTouch: vp.touch,
        isMobile: vp.touch,
        deviceScaleFactor: 2,
        colorScheme: theme,
      })
      const page = await ctx.newPage()
      // Quartz 用 localStorage + [saved-theme] 控制主题
      await page.addInitScript((t) => localStorage.setItem("theme", t), theme)

      for (const p of PAGES) {
        const url = base + p.path
        const resp = await page.goto(url, { waitUntil: "networkidle" }).catch(() => null)
        if (!resp || !resp.ok()) {
          if (!p.optional)
            findings.push({ theme, vp: vp.name, page: p.name, kind: "404", detail: url })
          continue
        }
        await page.waitForTimeout(250)
        const m = await page.evaluate(measure, TOUCH_MIN)

        rows.push({ theme, vp: vp.name, page: p.name, m })

        if (!m.stylesLoaded) {
          findings.push({
            theme,
            vp: vp.name,
            page: p.name,
            kind: "样式未加载(测量无效)",
            detail: `${url} 的 CSS 未生效，本页几何数据不可信`,
          })
          continue
        }
        if (m.overflowX.overflow) {
          findings.push({
            theme,
            vp: vp.name,
            page: p.name,
            kind: "横向溢出",
            detail: `scrollW=${m.overflowX.scrollW} > clientW=${m.overflowX.clientW}; 元凶=${JSON.stringify(m.offenders)}`,
          })
        }
        if (vp.touch && m.touch.length) {
          findings.push({
            theme,
            vp: vp.name,
            page: p.name,
            kind: `触控目标<${TOUCH_MIN}px`,
            detail: JSON.stringify(m.touch.slice(0, 6)),
          })
        }
        if (m.overlaps.length) {
          findings.push({
            theme,
            vp: vp.name,
            page: p.name,
            kind: "区块重叠",
            detail: JSON.stringify(m.overlaps),
          })
        }
        if (m.progressBars.length > 1) {
          findings.push({
            theme,
            vp: vp.name,
            page: p.name,
            kind: "进度条叠加",
            detail: JSON.stringify(m.progressBars),
          })
        }
        if (m.blockquote?.escapesArticle) {
          findings.push({
            theme,
            vp: vp.name,
            page: p.name,
            kind: "引用块装饰溢出版心",
            detail: JSON.stringify(m.blockquote),
          })
        }
        if (m.contentVisibility.length) {
          findings.push({
            theme,
            vp: vp.name,
            page: p.name,
            kind: "content-visibility 生效(CLS风险)",
            detail: JSON.stringify(m.contentVisibility.slice(0, 3)),
          })
        }

        if (wantShots) {
          await page.screenshot({
            path: path.join(SHOT_DIR, `${theme}-${vp.name}-${p.name}.png`),
            fullPage: true,
          })
        }
      }
      await ctx.close()
    }
  }

  await browser.close()
  if (server) server.close()

  // 栏目页正文起点一致性（AGENTS.md：不得随内容长短漂移）
  const byVp = {}
  for (const r of rows) {
    if (!["about", "dhamma", "ai"].includes(r.page)) continue
    const k = `${r.theme}/${r.vp}`
    ;(byVp[k] ||= []).push({ page: r.page, x: r.m.geometry.firstBlockX, w: r.m.geometry.center?.w })
  }
  for (const [k, list] of Object.entries(byVp)) {
    const xs = [...new Set(list.map((l) => l.x))]
    const ws = [...new Set(list.map((l) => l.w))]
    if (xs.length > 1 || ws.length > 1) {
      findings.push({
        theme: k.split("/")[0],
        vp: k.split("/")[1],
        page: "栏目页对比",
        kind: "版心起点漂移",
        detail: JSON.stringify(list),
      })
    }
  }

  console.log("\n================ 几何验收 ================")
  console.log(
    `基址: ${base}   视口: ${VIEWPORTS.length}   页面: ${PAGES.length}   主题: light+dark`,
  )
  console.log(`测量样本: ${rows.length}`)

  if (!findings.length) {
    console.log("\n✅ 无违规")
  } else {
    console.log(`\n❌ ${findings.length} 项违规：\n`)
    const byKind = {}
    for (const f of findings) (byKind[f.kind] ||= []).push(f)
    for (const [kind, list] of Object.entries(byKind)) {
      console.log(`── ${kind} (${list.length}) ──`)
      for (const f of list.slice(0, 6)) {
        console.log(`   [${f.theme}/${f.vp}/${f.page}] ${f.detail.slice(0, 260)}`)
      }
      if (list.length > 6) console.log(`   … 另有 ${list.length - 6} 条同类`)
      console.log("")
    }
  }

  // 关键几何速览（桌面 1440 亮色）
  const ref =
    rows.find((r) => r.vp === "desktop-1440" && r.theme === "light" && r.page === "probe") ||
    rows.find((r) => r.vp === "desktop-1440" && r.theme === "light" && r.page === "about")
  if (ref) {
    console.log("── 桌面 1440 关键几何 ──")
    console.log(JSON.stringify(ref.m.geometry, null, 2))
  }

  fs.writeFileSync(
    path.join(ROOT, ".audit-report.json"),
    JSON.stringify({ base, findings, rows }, null, 2),
  )
  console.log(`\n完整数据: .audit-report.json${wantShots ? `   截图: ${SHOT_DIR}/` : ""}`)
  process.exit(findings.length ? 1 : 0)
}

run().catch((e) => {
  console.error(e)
  process.exit(2)
})
