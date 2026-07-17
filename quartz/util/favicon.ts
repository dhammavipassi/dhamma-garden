import { FullSlug, RelativeURL, joinSegments } from "./path"

export const faviconSourcePath = "static/icon.png"

export function resolveFaviconPath(
  baseDir: FullSlug | RelativeURL,
  hashedResourceNames?: Record<string, string>,
): string {
  const emittedPath = hashedResourceNames?.[faviconSourcePath] ?? faviconSourcePath
  return joinSegments(baseDir, emittedPath)
}
