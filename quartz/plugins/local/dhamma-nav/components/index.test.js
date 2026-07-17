import assert from "node:assert/strict"
import fs from "node:fs"
import test from "node:test"
import { h } from "preact"
import render from "preact-render-to-string"
import YAML from "yaml"

import { DhammaNav } from "./index.js"

test("navigation uses Quartz canonical lowercase slugs", () => {
  const Component = DhammaNav()
  const html = render(h(Component, { fileData: { slug: "关于/index" } }))

  assert.match(html, /href="\.\.\/ai实践\/"/)
  assert.doesNotMatch(html, /href="[^"]*AI实践\/"/)
})

test("inner page types inherit the configured right sidebar", () => {
  const config = YAML.parse(fs.readFileSync("quartz.config.yaml", "utf8"))
  const pageTypes = config.layout.byPageType

  assert.equal(pageTypes.folder.positions?.right, undefined)
  assert.equal(pageTypes.tag.positions?.right, undefined)
})

test("custom styles do not collapse the desktop right-sidebar track", () => {
  const styles = fs.readFileSync("quartz/styles/custom.scss", "utf8")

  assert.doesNotMatch(styles, /\.sidebar\.right:empty/)
  assert.doesNotMatch(styles, /:has\(\.sidebar\.right:empty\)/)
  assert.doesNotMatch(styles, /\.sidebar\.right:not\(:has\(\*\)\)/)
})
