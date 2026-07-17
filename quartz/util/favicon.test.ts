import assert from "node:assert"
import { describe, test } from "node:test"
import { FullSlug } from "./path"
import { faviconSourcePath, resolveFaviconPath } from "./favicon"

describe("resolveFaviconPath", () => {
  test("uses the content-fingerprinted icon emitted by the build", () => {
    const href = resolveFaviconPath(".." as FullSlug, {
      [faviconSourcePath]: "static/icon-deadbeef.png",
    })

    assert.equal(href, "../static/icon-deadbeef.png")
  })

  test("falls back to the source icon when no build fingerprint is available", () => {
    assert.equal(resolveFaviconPath(".." as FullSlug), "../static/icon.png")
  })
})
