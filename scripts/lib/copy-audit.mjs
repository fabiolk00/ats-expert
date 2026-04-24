import { readdirSync, statSync } from 'node:fs'
import path from 'node:path'

export const COPY_REVIEW_TARGET_DIRS = ['src']
export const REGRESSION_MOJIBAKE_TARGET_DIRS = ['src']
export const LANDING_MOJIBAKE_TARGET_DIRS = ['src/components/landing']
export const APP_PAGE_ROOT_DIR = 'src/app'
export const TARGET_EXTENSIONS = new Set(['.ts', '.tsx'])

// Windows-1252 renderings for bytes 0x80-0x9F when UTF-8 bytes are decoded incorrectly.
export const WINDOWS_1252_CONTINUATION_CHARS = '\u20AC\u201A\u0192\u201E\u2026\u2020\u2021\u02C6\u2030\u0160\u2039\u0152\u017D\u2018\u2019\u201C\u201D\u2022\u2013\u2014\u02DC\u2122\u0161\u203A\u0153\u017E\u0178'

const utf8ContinuationCharClass = `[\\u0080-\\u00BF${WINDOWS_1252_CONTINUATION_CHARS}]`

// Generic UTF-8-as-Latin1/Windows-1252 mojibake families:
// - 2-byte sequences: Ã§, Ã£, Â , Ãƒ, etc.
// - 3-byte sequences: â€”, â€“, â€œ, ï¿½, etc.
// - 4-byte sequences: ðŸ™‚ and similar emoji/astral corruption.
export const mojibakePatterns = [
  new RegExp(`[\\u00C2-\\u00DF]${utf8ContinuationCharClass}`, 'g'),
  new RegExp(`[\\u00E0-\\u00EF]${utf8ContinuationCharClass}{2}`, 'g'),
  new RegExp(`[\\u00F0-\\u00F4]${utf8ContinuationCharClass}{3}`, 'g'),
  /\uFFFD/g,
]

const suspiciousAsciiTerms = [
  ['Nao', 'Não'],
  ['nao', 'não'],
  ['curriculo', 'currículo'],
  ['versao', 'versão'],
  ['descricao', 'descrição'],
  ['experiencia', 'experiência'],
  ['experiencias', 'experiências'],
  ['educacao', 'educação'],
  ['formacao', 'formação'],
  ['instituicao', 'instituição'],
  ['secao', 'seção'],
  ['secoes', 'seções'],
  ['publico', 'público'],
  ['informacoes', 'informações'],
  ['credito', 'crédito'],
  ['creditos', 'créditos'],
  ['possivel', 'possível'],
  ['voce', 'você'],
  ['ate', 'até'],
  ['concluida', 'concluída'],
  ['automatica', 'automática'],
  ['selecionavel', 'selecionável'],
]

export function walk(rootDir, relativeDir) {
  const absoluteDir = path.join(rootDir, relativeDir)
  const entries = readdirSync(absoluteDir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const relativePath = path.join(relativeDir, entry.name)
    const absolutePath = path.join(rootDir, relativePath)

    if (entry.isDirectory()) {
      files.push(...walk(rootDir, relativePath))
      continue
    }

    if (!TARGET_EXTENSIONS.has(path.extname(entry.name))) {
      continue
    }

    if (statSync(absolutePath).isFile()) {
      files.push(relativePath)
    }
  }

  return files
}

function normalizeFilePath(filePath) {
  return filePath.replaceAll('\\', '/')
}

export function isAppPageFile(filePath) {
  const normalizedPath = normalizeFilePath(filePath)
  return path.basename(filePath) === 'page.tsx' && normalizedPath.startsWith(`${APP_PAGE_ROOT_DIR}/`)
}

export function listStrictMojibakeFiles(rootDir) {
  const appPageFiles = walk(rootDir, APP_PAGE_ROOT_DIR).filter(isAppPageFile)
  const landingFiles = LANDING_MOJIBAKE_TARGET_DIRS.flatMap((dir) => walk(rootDir, dir))

  return [...new Set([...appPageFiles, ...landingFiles])].sort()
}

export function listRegressionMojibakeFiles(rootDir) {
  return REGRESSION_MOJIBAKE_TARGET_DIRS.flatMap((dir) => walk(rootDir, dir))
}

export function listCopyReviewFiles(rootDir) {
  return COPY_REVIEW_TARGET_DIRS.flatMap((dir) => walk(rootDir, dir))
}

function getLineNumber(text, index) {
  return text.slice(0, index).split('\n').length
}

export function collectMojibakeIssues(filePath, text) {
  const issuesByLine = new Map()

  for (const pattern of mojibakePatterns) {
    for (const match of text.matchAll(pattern)) {
      const line = getLineNumber(text, match.index ?? 0)
      const key = `${filePath}:${line}:mojibake`

      if (issuesByLine.has(key)) {
        continue
      }

      issuesByLine.set(key, {
        filePath,
        line,
        type: 'mojibake',
        excerpt: text.split('\n')[line - 1]?.trim() ?? '',
      })
    }
  }

  return [...issuesByLine.values()]
}

export function collectAsciiCopyIssues(filePath, text) {
  const issues = []
  const lines = text.split('\n')

  lines.forEach((line, index) => {
    if (!/['"`]/.test(line)) {
      return
    }

    const trimmedLine = line.trim()
    const isTechnicalMatchingLine = (
      trimmedLine.includes('.includes(')
      || trimmedLine.includes('.match(')
      || trimmedLine.includes('.test(')
      || trimmedLine.startsWith('return /')
      || trimmedLine.startsWith('const rolePattern = /')
      || trimmedLine.startsWith('const pattern = new RegExp(')
      || trimmedLine.includes('stopWords = new Set([')
      || trimmedLine.includes("'experience', 'experiencia'")
      || (trimmedLine.includes("'experience'") && trimmedLine.includes("'experiencia'"))
      || trimmedLine.includes('/curriculo-')
      || trimmedLine.startsWith('slug:')
      || trimmedLine.startsWith('slug=')
      || trimmedLine.startsWith('canonical:')
      || trimmedLine.includes('buildRoleLandingMetadata("curriculo-')
      || trimmedLine.includes("buildRoleLandingMetadata('curriculo-")
      || trimmedLine.startsWith('"curriculo-')
      || trimmedLine.startsWith("'curriculo-")
    )

    if (isTechnicalMatchingLine) {
      return
    }

    for (const [term, suggestion] of suspiciousAsciiTerms) {
      const pattern = new RegExp(`\\b${term}\\b`)
      if (!pattern.test(line)) {
        continue
      }

      issues.push({
        filePath,
        line: index + 1,
        type: 'ptbr-copy',
        term,
        suggestion,
        excerpt: line.trim(),
      })
    }
  })

  return issues
}

export function issueKey(issue) {
  if (issue.type === 'mojibake') {
    return `${issue.filePath}:${issue.line}:mojibake`
  }

  return `${issue.filePath}:${issue.line}:${issue.term}`
}

export function uniqueIssueKeys(issues) {
  return [...new Set(issues.map(issueKey))].sort()
}
