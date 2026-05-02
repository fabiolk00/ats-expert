import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { JobTargetingShadowCase } from '../../src/lib/agent/job-targeting/shadow-case-types'

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/giu
const PHONE_RE = /(?:\+?\d[\d\s().-]{7,}\d)/gu
const LINK_RE = /https?:\/\/\S+|linkedin\.com\/\S+/giu

function anonymizeText(value: string | undefined, replacement = '[redacted]'): string {
  return (value ?? '')
    .replace(EMAIL_RE, replacement)
    .replace(PHONE_RE, replacement)
    .replace(LINK_RE, replacement)
    .replace(/\b(?:CPF|CNPJ)\s*[:#]?\s*[\d./-]+/giu, replacement)
}

export function anonymizeShadowCase(input: JobTargetingShadowCase): JobTargetingShadowCase {
  return {
    ...input,
    source: 'real_anonymized',
    cvState: {
      ...input.cvState,
      fullName: 'Pessoa Candidata',
      email: 'anon@example.invalid',
      phone: '+55 00 00000-0000',
      linkedin: undefined,
      location: input.cvState.location ? 'Brasil' : undefined,
      summary: anonymizeText(input.cvState.summary),
      experience: input.cvState.experience.map((entry, index) => ({
        ...entry,
        company: `Empresa ${index + 1}`,
        location: entry.location ? 'Brasil' : undefined,
        bullets: entry.bullets.map((bullet) => anonymizeText(bullet)),
      })),
      education: input.cvState.education.map((entry, index) => ({
        ...entry,
        institution: `Instituicao ${index + 1}`,
      })),
    },
    targetJobDescription: anonymizeText(input.targetJobDescription),
    metadata: {
      ...input.metadata,
      originalSessionId: undefined,
      anonymized: true,
      createdAt: input.metadata?.createdAt ?? new Date().toISOString(),
    },
  }
}

function parseCases(source: string): JobTargetingShadowCase[] {
  const trimmed = source.trim()
  if (!trimmed) {
    return []
  }

  if (trimmed.startsWith('[')) {
    return JSON.parse(trimmed) as JobTargetingShadowCase[]
  }

  return trimmed
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as JobTargetingShadowCase)
}

function parseArgs(args: string[]): { input?: string; output?: string } {
  const result: { input?: string; output?: string } = {}

  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--input') {
      result.input = args[index + 1]
      index += 1
      continue
    }
    if (args[index] === '--output') {
      result.output = args[index + 1]
      index += 1
    }
  }

  return result
}

async function main() {
  const { input, output } = parseArgs(process.argv.slice(2))
  if (!input || !output) {
    console.error('Usage: tsx scripts/job-targeting/export-shadow-cases.ts --input raw.jsonl --output .local/job-targeting-shadow-cases/cases.jsonl')
    process.exitCode = 1
    return
  }

  const cases = parseCases(await readFile(input, 'utf8')).map(anonymizeShadowCase)
  await mkdir(path.dirname(output), { recursive: true })
  await writeFile(output, `${cases.map((testCase) => JSON.stringify(testCase)).join('\n')}\n`, 'utf8')
  console.log(JSON.stringify({ exported: cases.length, output }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

