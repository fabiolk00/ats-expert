import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  collectAsciiCopyIssues,
  collectMojibakeIssues,
  issueKey,
  listCopyReviewFiles,
  listRegressionMojibakeFiles,
  listStrictMojibakeFiles,
  normalizeIssueKey,
  uniqueIssueKeys,
} from './lib/copy-audit.mjs'

const ROOT = process.cwd()

const args = new Set(process.argv.slice(2))
const reportPathArgIndex = process.argv.indexOf('--write-report')
const reportPath = reportPathArgIndex >= 0 ? process.argv[reportPathArgIndex + 1] : null
const baselinePathArgIndex = process.argv.indexOf('--baseline')
const baselinePath = baselinePathArgIndex >= 0 ? process.argv[baselinePathArgIndex + 1] : null
const writeBaselineArgIndex = process.argv.indexOf('--write-baseline')
const writeBaselinePath = writeBaselineArgIndex >= 0 ? process.argv[writeBaselineArgIndex + 1] : null
const failOnCopy = args.has('--fail-on-copy')

const mojibakeSourceFiles = baselinePath
  ? listRegressionMojibakeFiles(ROOT)
  : listStrictMojibakeFiles(ROOT)
const copySourceFiles = listCopyReviewFiles(ROOT)

const mojibakeIssues = []
const copyIssues = []

for (const filePath of mojibakeSourceFiles) {
  const text = readFileSync(path.join(ROOT, filePath), 'utf8')
  mojibakeIssues.push(...collectMojibakeIssues(filePath, text))
}

for (const filePath of copySourceFiles) {
  const text = readFileSync(path.join(ROOT, filePath), 'utf8')
  copyIssues.push(...collectAsciiCopyIssues(filePath, text))
}

const currentBaselineSnapshot = {
  filesScanned: copySourceFiles.length,
  mojibakeFilesScanned: mojibakeSourceFiles.length,
  mojibakeIssueKeys: uniqueIssueKeys(mojibakeIssues),
  copyIssueKeys: uniqueIssueKeys(copyIssues),
}

if (reportPath) {
  const lines = [
    '# PT-BR Copy Audit',
    '',
    `- Files scanned for PT-BR review: ${copySourceFiles.length}`,
    `- Files scanned for mojibake: ${mojibakeSourceFiles.length}`,
    `- Mojibake issues: ${mojibakeIssues.length}`,
    `- PT-BR copy review issues: ${copyIssues.length}`,
    '',
    '## Mojibake',
  ]

  if (mojibakeIssues.length === 0) {
    lines.push('', 'Nenhum mojibake encontrado.')
  } else {
    for (const issue of mojibakeIssues) {
      lines.push('', `- ${issue.filePath}:${issue.line} - ${issue.excerpt}`)
    }
  }

  lines.push('', '## PT-BR Copy Review')

  if (copyIssues.length === 0) {
    lines.push('', 'Nenhuma string suspeita encontrada.')
  } else {
    for (const issue of copyIssues) {
      lines.push('', `- ${issue.filePath}:${issue.line} - \`${issue.term}\` -> \`${issue.suggestion}\``, `  ${issue.excerpt}`)
    }
  }

  writeFileSync(path.join(ROOT, reportPath), `${lines.join('\n')}\n`, 'utf8')
}

if (writeBaselinePath) {
  writeFileSync(
    path.join(ROOT, writeBaselinePath),
    `${JSON.stringify({
      version: 1,
      generatedAt: new Date().toISOString(),
      ...currentBaselineSnapshot,
    }, null, 2)}\n`,
    'utf8',
  )
}

let newMojibakeIssues = []
let newCopyIssues = []

if (baselinePath) {
  const baseline = JSON.parse(readFileSync(path.join(ROOT, baselinePath), 'utf8'))
  const knownMojibakeIssueKeys = new Set((baseline.mojibakeIssueKeys ?? []).map(normalizeIssueKey))
  const knownCopyIssueKeys = new Set((baseline.copyIssueKeys ?? []).map(normalizeIssueKey))

  newMojibakeIssues = mojibakeIssues.filter((issue) => !knownMojibakeIssueKeys.has(normalizeIssueKey(issueKey(issue))))
  newCopyIssues = copyIssues.filter((issue) => !knownCopyIssueKeys.has(normalizeIssueKey(issueKey(issue))))
}

if (!baselinePath && mojibakeIssues.length > 0) {
  console.error(`Copy encoding audit failed: found ${mojibakeIssues.length} mojibake issue(s).`)
  process.exit(1)
}

if (baselinePath && newMojibakeIssues.length > 0) {
  console.error(`Copy encoding audit failed: found ${newMojibakeIssues.length} new mojibake issue(s) beyond baseline.`)
  process.exit(1)
}

if (baselinePath && newCopyIssues.length > 0) {
  console.error(`PT-BR copy audit failed: found ${newCopyIssues.length} new review issue(s) beyond baseline.`)
  process.exit(1)
}

if (failOnCopy && copyIssues.length > 0) {
  console.error(`PT-BR copy audit failed: found ${copyIssues.length} review issue(s).`)
  process.exit(1)
}

const baselineSummary = baselinePath
  ? ` New vs baseline: mojibake ${newMojibakeIssues.length}, copy ${newCopyIssues.length}.`
  : ''

console.log(
  `Copy encoding audit passed. Mojibake: ${mojibakeIssues.length} across ${mojibakeSourceFiles.length} file(s). PT-BR review issues: ${copyIssues.length} across ${copySourceFiles.length} file(s).${baselineSummary}`,
)
