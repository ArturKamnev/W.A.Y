import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const required = [
  'design/style-manifest.json',
  'design/ui-spec.schema.json',
  'src/styles/tokens.css',
  'tailwind.config.ts',
]

const missing = required.filter((file) => !existsSync(join(root, file)))
if (missing.length) {
  console.error(`Missing style contract files: ${missing.join(', ')}`)
  process.exit(1)
}

const cssFiles = ['src/styles/tokens.css', 'src/styles/app.css']
const css = cssFiles.map((file) => readFileSync(join(root, file), 'utf8')).join('\n')
const negativeSpacing = /letter-spacing\s*:\s*-\d/.test(css)
const viewportFonts = /font-size\s*:\s*[^;]*(vw|vmin|vmax)/.test(css)
const largeRadius = /border-radius\s*:\s*(?:9|[1-9]\d+)px/.test(css)

if (negativeSpacing || viewportFonts || largeRadius) {
  console.error('Style manifest violation detected: negative letter spacing, viewport font sizing, or radius above 8px.')
  process.exit(1)
}

const candidates = readdirSync(join(root, 'artifacts/candidates')).filter((file) => file.endsWith('.json'))
if (candidates.length < 5) {
  console.error('Expected at least 5 UI candidate specs.')
  process.exit(1)
}

console.log('Manifest compliance: PASS')
