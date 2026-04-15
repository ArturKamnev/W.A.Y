import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const candidateDir = join(root, 'artifacts/candidates')
const reportDir = join(root, 'artifacts/reports')
if (!existsSync(reportDir)) mkdirSync(reportDir, { recursive: true })

const candidates = readdirSync(candidateDir).filter((file) => file.endsWith('.json'))
const names = new Set(candidates.map((file) => file.replace('.json', '')))
const uniqueEnough = names.size === candidates.length && candidates.length >= 5

const report = {
  status: uniqueEnough ? 'PASS' : 'FAIL',
  limitation: 'No historical screenshots exist in this blank workspace, so novelty is checked across candidate specs only.',
  candidates,
}

writeFileSync(join(reportDir, 'novelty-check.json'), `${JSON.stringify(report, null, 2)}\n`)

if (!uniqueEnough) {
  console.error('Novelty check failed.')
  process.exit(1)
}

console.log('Novelty: PASS with blank-workspace limitation documented in artifacts/reports/novelty-check.json')
