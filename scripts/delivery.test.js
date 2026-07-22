import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..")
const read = (...p) => fs.readFileSync(path.join(root, ...p), "utf8")

test("Cloudflare _headers ships the baseline security headers", () => {
  const headers = read("cloudflare", "_headers")
  assert.match(headers, /X-Content-Type-Options: nosniff/)
  assert.match(headers, /Referrer-Policy: strict-origin-when-cross-origin/)
  assert.match(headers, /X-Frame-Options: DENY/)
  assert.match(headers, /Strict-Transport-Security: max-age=\d+; includeSubDomains/)
  assert.match(headers, /Permissions-Policy:/)
  assert.match(headers, /Content-Security-Policy:.*default-src 'self'/)
  assert.match(headers, /object-src 'none'/)
  assert.match(headers, /frame-ancestors 'none'/)
})

test("_headers marks only content-hashed js/css immutable, never mutable /static", () => {
  const headers = read("cloudflare", "_headers")
  const cacheLines = headers.split("\n").filter((l) => l.includes("Cache-Control:"))
  // 只允许 /*.js 与 /*.css 两条互不重叠的缓存规则，避免同名头被逗号拼接
  assert.equal(cacheLines.length, 2, "只应有 /*.js 与 /*.css 两条缓存规则")
  cacheLines.forEach((l) => assert.match(l, /max-age=31536000, immutable/))
  // /static/* 含 contentIndex.json（文件名固定、内容会变），绝不能设 immutable
  assert.doesNotMatch(headers, /^\/static\/\*/m)
})

test("robots.txt allows crawling and points at the sitemap", () => {
  const robots = read("cloudflare", "robots.txt")
  assert.match(robots, /User-agent: \*/)
  assert.match(robots, /Allow: \//)
  assert.match(robots, /Sitemap: https:\/\/guanzhang\.dhammaai\.com\/sitemap\.xml/)
})

test("deploy workflow injects headers/robots and dedupes concurrent deploys", () => {
  const wf = read(".github", "workflows", "deploy.yml")
  assert.match(wf, /cp cloudflare\/_headers cloudflare\/robots\.txt public\//)
  assert.match(wf, /concurrency:/)
  assert.match(wf, /cancel-in-progress: true/)
})

test("only the active deploy workflow remains; inert upstream cruft is gone", () => {
  const dir = path.join(root, ".github", "workflows")
  assert.ok(fs.existsSync(path.join(dir, "deploy.yml")), "deploy.yml 必须保留")
  for (const f of [
    "ci.yaml",
    "deploy-v5.yaml",
    "deploy-preview.yaml",
    "build-preview.yaml",
    "docker-build-push.yaml",
  ]) {
    assert.ok(!fs.existsSync(path.join(dir, f)), `${f} 应已移除（fork 上被 jackyzha0 守卫挡死）`)
  }
})

test("Head injects mobile theme-color, canonical, locale and structured data", () => {
  const head = read("quartz", "components", "Head.tsx")
  // viewport-fit=cover 激活既有的 env(safe-area-inset-*) 安全区适配（刘海/圆角/home 指示条）
  assert.match(head, /viewport-fit=cover/)
  assert.match(head, /name="color-scheme"/)
  assert.match(head, /name="theme-color"/)
  assert.match(head, /prefers-color-scheme: dark/)
  assert.match(head, /rel="canonical"/)
  assert.match(head, /property="og:locale"/)
  assert.match(head, /application\/ld\+json/)
})
